import type { LinkKind } from "./types";

export interface MediaInfo {
  kind: LinkKind;
  thumbnail?: string;
  embedUrl?: string;
}

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

export function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

export function hostOf(raw: string): string {
  const u = safeUrl(raw);
  return u ? u.hostname.replace(/^www\./, "") : raw;
}

function youtubeId(u: URL): string | null {
  if (u.hostname === "youtu.be") {
    return u.pathname.split("/")[1] || null;
  }
  const v = u.searchParams.get("v");
  if (v) return v;
  const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([\w-]+)/);
  return m ? m[1] : null;
}

export function parseMedia(raw: string): MediaInfo {
  const u = safeUrl(raw);
  if (!u) return { kind: "article" };

  if (YT_HOSTS.has(u.hostname)) {
    const id = youtubeId(u);
    if (id) {
      return {
        kind: "video",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      };
    }
  }

  if (/(^|\.)vimeo\.com$/.test(u.hostname)) {
    const m = u.pathname.match(/\/(\d{6,})/) ?? u.pathname.match(/\/video\/(\d{6,})/);
    if (m) {
      return {
        kind: "video",
        embedUrl: `https://player.vimeo.com/video/${m[1]}`,
      };
    }
  }

  return { kind: "article" };
}

const TINTS = ["var(--c-tint-1)", "var(--c-tint-2)", "var(--c-tint-3)", "var(--c-tint-4)", "var(--c-tint-5)"];

export function tintOf(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function fallbackThumb(raw: string): string | null {
  const u = safeUrl(raw);
  if (!u) return null;
  return `${u.origin}/favicon.ico`;
}
