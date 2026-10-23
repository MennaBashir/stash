"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Link as LinkIcon,
  Clapperboard,
  Newspaper,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { makeItem, stashDispatch, useStash } from "@/lib/store";
import type { StashItem } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { parseMedia, safeUrl, hostOf } from "@/lib/media";
import { cn } from "cn";
import { SmartThumb } from "@/components/stash/smart-thumb";

const urlSchema = z.url();

type MetaStatus = "idle" | "loading" | "ok" | "error";

interface FetchedMeta {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  kind: "video" | "article";
  embedUrl: string | null;
}

function fetchable(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.length < 11) return false;
  if (!safeUrl(trimmed)) return false;
  return urlSchema.safeParse(trimmed).success;
}

export interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategoryId?: string | null;
  editing?: StashItem | null;
  /** changes whenever the dialog is (re)opened, forcing fresh form state */
  renderKey: string;
}

export function AddLinkDialog({
  open,
  onOpenChange,
  defaultCategoryId,
  editing,
  renderKey,
}: AddLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit stash" : "Add a link"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Rename it or move it to another category."
              : "Paste a video or article URL — details are fetched for you."}
          </DialogDescription>
        </DialogHeader>
        <AddLinkForm
          key={renderKey}
          defaultCategoryId={defaultCategoryId}
          editing={editing}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddLinkForm({
  defaultCategoryId,
  editing,
  onDone,
}: {
  defaultCategoryId?: string | null;
  editing?: StashItem | null;
  onDone: () => void;
}) {
  const { categories } = useStash();
  const [url, setUrl] = useState(editing?.url ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [image, setImage] = useState<string | undefined>(editing?.image);
  const [favicon, setFavicon] = useState<string | undefined>(editing?.favicon);
  const [embedUrl, setEmbedUrl] = useState<string | undefined>(editing?.embedUrl);
  const [kind, setKind] = useState<"video" | "article">(editing?.kind ?? "article");
  const [categoryId, setCategoryId] = useState<string>(
    editing?.categoryId ?? defaultCategoryId ?? ""
  );
  const [fetchStatus, setFetchStatus] = useState<MetaStatus | null>(null);

  const mode = editing ? "edit" : "create";

  const controllerRef = useRef<AbortController | null>(null);
  const lastFetchedRef = useRef("");

  const fetchMeta = useCallback(async (target: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setFetchStatus("loading");
    try {
      const res = await fetch(
        `/api/metadata?url=${encodeURIComponent(target)}`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        setFetchStatus("error");
        return;
      }
      const meta = (await res.json()) as FetchedMeta;
      setTitle((current) => current || meta.title || "");
      setDescription((current) => current || meta.description || "");
      if (meta.image) setImage(meta.image);
      if (meta.favicon) setFavicon(meta.favicon);
      if (meta.embedUrl) setEmbedUrl(meta.embedUrl);
      const media = parseMedia(target);
      setKind(media.kind === "video" ? "video" : meta.kind);
      lastFetchedRef.current = target;
      setFetchStatus("ok");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setFetchStatus("error");
    }
  }, []);

  // debounce auto-fetch — only async-callback setStates
  useEffect(() => {
    if (mode === "edit") return;
    const timer = setTimeout(() => {
      const candidate = url.trim();
      if (!fetchable(candidate)) return;
      if (candidate === lastFetchedRef.current) return;
      fetchMeta(candidate);
    }, 550);
    return () => clearTimeout(timer);
  }, [url, mode, fetchMeta]);

  useEffect(() => {
    controllerRef.current?.abort();
  }, []);

  const status: MetaStatus =
    mode === "edit" || !fetchable(url.trim()) ? "idle" : (fetchStatus ?? "idle");

  const canSave =
    mode === "edit"
      ? title.trim().length > 0
      : fetchable(url) &&
        title.trim().length > 0 &&
        categoryId !== "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "edit" && editing) {
      stashDispatch({
        type: "update-item",
        id: editing.id,
        patch: { title: title.trim(), description, categoryId },
      });
      toast.success("Updated");
    } else {
      const media = parseMedia(url.trim());
      stashDispatch({
        type: "add-item",
        item: makeItem({
          categoryId,
          url,
          title,
          description: description || undefined,
          image,
          favicon,
          kind: media.kind,
          embedUrl,
        }),
      });
      toast.success("Stashed", { description: title.trim() });
    }
    onDone();
  };

  const isFetching = status === "loading";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="stash-url">URL</Label>
        <div className="relative">
          <LinkIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="stash-url"
            inputMode="url"
            placeholder="https://…"
            value={url}
            disabled={mode === "edit"}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={cn("pl-8", mode === "edit" && "opacity-70")}
          />
        </div>
      </div>

      {mode === "create" && (
        <div className="overflow-hidden rounded-xl border bg-muted/40">
          {isFetching ? (
            <div className="flex gap-3 p-3">
              <Skeleton className="aspect-[16/9] w-40 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-4 w-4/5 rounded" />
                <Skeleton className="h-4 w-3/5 rounded" />
                <div className="mt-auto flex items-center gap-1.5">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            </div>
          ) : safeUrl(url.trim()) && title ? (
            <div className="flex gap-3 p-3">
              <div className="aspect-[16/9] w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
                <SmartThumb
                  url={url}
                  image={image}
                  favicon={favicon}
                  alt=""
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">
                    {title}
                  </p>
                  <Badge variant="outline" className="shrink-0 gap-1 text-[0.65rem]">
                    {kind === "video" ? (
                      <Clapperboard className="size-3" />
                    ) : (
                      <Newspaper className="size-3" />
                    )}
                    {kind === "video" ? "Video" : "Article"}
                  </Badge>
                </div>
                {description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {description}
                  </p>
                )}
                <p className="mt-1 text-[0.7rem] text-muted-foreground">
                  {hostOf(url)}
                </p>
              </div>
            </div>
          ) : (
            <p className="p-3 text-left text-xs text-muted-foreground">
              {status === "error" && safeUrl(url.trim())
                ? "Metadata didn’t load — fill in the title manually and save."
                : "Waiting for a valid URL…"}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="stash-title">Title</Label>
        <Input
          id="stash-title"
          placeholder={status === "error" ? "Add a title manually" : "Fetched automatically — editable"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="stash-description">Description (optional)</Label>
        <Input
          id="stash-description"
          placeholder="Optional note"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="stash-category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="stash-category" className="w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[c.color] }}
                  />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        {isFetching && (
          <span className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Reading the page…
          </span>
        )}
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSave || isFetching}>
          {mode === "edit" ? "Save changes" : "Stash it"}
        </Button>
      </DialogFooter>
    </form>
  );
}
