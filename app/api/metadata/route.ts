import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { parseMedia, safeUrl } from "@/lib/media";

const FETCH_TIMEOUT_MS = 8_000;
const OEMBED_TIMEOUT_MS = 4_000;
const MAX_HTML_BYTES = 3_000_000;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "instance-data",
]);

function isPrivateAddress(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(h)) return true;
  if (h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const [a, b] = h.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  if (/^(fc|fd)[0-9a-f]{2}:/i.test(h)) return true; // IPv6 ULA
  if (/^fe[89ab][0-9a-f]:/i.test(h)) return true; // IPv6 link-local
  return false;
}

function validateInput(raw: string | null): URL {
  if (!raw) throw new Error("missing url");
  const u = safeUrl(raw);
  if (!u) throw new Error("invalid url");
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("invalid protocol");
  }
  if (u.port && !["80", "443"].includes(u.port)) throw new Error("invalid port");
  if (u.hostname !== u.hostname.trim().toLowerCase()) throw new Error("invalid host");
  if (isPrivateAddress(u.hostname)) throw new Error("blocked host");
  if (u.username || u.password) throw new Error("credentials not allowed");
  return u;
}

interface ParsedMeta {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

function parseHtml(html: string, pageUrl: URL): ParsedMeta {
  const $ = cheerio.load(html);
  const metaContent = (names: string[]): string | undefined => {
    for (const n of names) {
      const sel =
        n.includes(":") || n === "title"
          ? `meta[property="${n}"], meta[name="${n}"]`
          : `meta[property="${n}"], meta[name="${n}"]`;
      const val = $(sel).first().attr("content");
      if (val && val.trim()) return val.trim();
    }
    return undefined;
  };

  const title =
    metaContent(["og:title", "twitter:title"]) ||
    $("head > title").first().text().trim() ||
    $("title").first().text().trim() ||
    undefined;

  const description =
    metaContent(["og:description", "twitter:description", "description"]) ||
    undefined;

  const rawImage =
    metaContent(["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"]) ||
    undefined;

  const image = rawImage ? absolute(rawImage, pageUrl) : undefined;

  const favEl = $(
    'link[rel="apple-touch-icon"], link[rel="icon"], link[rel="shortcut icon"], link[rel$="icon"]'
  ).first();
  const favHref = favEl.attr("href");
  const favicon = favHref
    ? absolute(favHref, pageUrl)
    : `${pageUrl.origin}/favicon.ico`;

  return {
    title: title ? title.slice(0, 200) : undefined,
    description: description ? description.slice(0, 500) : undefined,
    image,
    favicon,
  };
}

function absolute(href: string, base: URL): string | undefined {
  try {
    const resolved = new URL(href, base);
    if (resolved.protocol === "http:" || resolved.protocol === "https:") {
      return resolved.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function vimeoThumbnail(vimeoUrl: string): Promise<ParsedMeta | null> {
  try {
    const res = await fetchWithTimeout(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`,
      OEMBED_TIMEOUT_MS
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
      video_id?: number;
    };
    return {
      title: data.title?.slice(0, 200),
      image: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: NextRequest) {
  let target: URL;
  try {
    target = validateInput(request.nextUrl.searchParams.get("url"));
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }

  const media = parseMedia(target.toString());

  let res: Response;
  try {
    res = await fetchWithTimeout(target.toString(), FETCH_TIMEOUT_MS, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en",
      },
      redirect: "follow",
    });
  } catch {
    return errorResponse("upstream unreachable", 502);
  }

  if (!res.ok) {
    return errorResponse(`upstream returned ${res.status}`, 502);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
    return errorResponse("not an html page", 422);
  }

  const reader = res.body?.getReader();
  let html: string;
  if (reader) {
    const chunks: Uint8Array[] = [];
    let received = 0;
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      if (received > MAX_HTML_BYTES) {
        reader.cancel();
        break;
      }
    }
    const merged = new Uint8Array(received);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    html = decoder.decode(merged);
  } else {
    html = await res.text();
  }

  const parsed = parseHtml(html, target);

  if (/(^|\.)vimeo\.com$/.test(target.hostname) && media.embedUrl) {
    const extra = await vimeoThumbnail(
      media.embedUrl.replace(
        "https://player.vimeo.com/video/",
        "https://vimeo.com/"
      )
    );
    if (extra) {
      parsed.title = extra.title ?? parsed.title;
      parsed.image = extra.image ?? parsed.image;
    }
  }

  return NextResponse.json(
    {
      url: target.toString(),
      title: parsed.title ?? null,
      description: parsed.description ?? null,
      image: parsed.image ?? null,
      favicon: parsed.favicon ?? null,
      kind: media.kind,
      embedUrl: media.embedUrl ?? null,
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
