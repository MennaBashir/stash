"use client";

import { motion } from "framer-motion";
import {
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_COLORS, type StashItem } from "@/lib/types";
import { hostOf } from "@/lib/media";
import { relativeTime } from "@/lib/format";
import { cn } from "cn";
import { SmartThumb } from "@/components/stash/smart-thumb";

export function LinkCard({
  item,
  category,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: StashItem;
  category?: { name: string; color: keyof typeof CATEGORY_COLORS };
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow,opacity] duration-200",
        "hover:border-ring/40 hover:shadow-[0_1px_12px_rgba(0,0,0,0.05)]",
        item.done && "opacity-70"
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${item.title} in a new tab`}
          className="block size-full"
        >
          <div className="size-full transition-transform duration-300 group-hover:scale-[1.02]">
            <SmartThumb
              url={item.url}
              image={item.image}
              favicon={item.favicon}
              alt={item.title}
              className={cn(
                "rounded-none",
                item.done && "grayscale-[0.75] opacity-90"
              )}
            />
          </div>
        </a>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
        {item.kind === "video" && !item.done && (
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center opacity-90 transition-opacity group-hover:opacity-100"
          >
            <span className="grid place-items-center size-10 rounded-full bg-black/45 text-white backdrop-blur-sm">
              <Play className="size-4 translate-x-[1px]" fill="currentColor" />
            </span>
          </span>
        )}
        <Badge
          variant="secondary"
          className="absolute top-2.5 left-2.5 gap-1 bg-white/85 text-[0.7rem] text-zinc-800 backdrop-blur-sm dark:bg-black/55 dark:text-zinc-100"
        >
          {item.kind === "video" ? "Video" : "Article"}
        </Badge>
        <label
          className="absolute top-2 right-2 z-10 inline-flex cursor-pointer items-center rounded bg-white/85 p-1.5 backdrop-blur-sm dark:bg-black/55"
          aria-label={
            item.done
              ? `Mark ${item.title} as not done`
              : `Mark ${item.title} as done`
          }
        >
          <motion.span whileTap={{ scale: 0.8 }} className="flex">
            <Checkbox checked={item.done} onCheckedChange={onToggle} className="size-5" />
          </motion.span>
        </label>
      </div>

      <div className="p-3.5">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <h3
            className={cn(
              "line-clamp-2 min-h-10 leading-snug transition-colors decoration-primary underline-offset-2 hover:underline",
              item.done && "line-through decoration-zinc-400"
            )}
          >
            {item.title}
          </h3>
        </a>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-[0.8rem] leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}
        <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          {category && (
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category.color] }}
              />
              <span className="truncate">{category.name}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
            </span>
          )}
          <span className="truncate">{hostOf(item.url)}</span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <time dateTime={new Date(item.createdAt).toISOString()}>
            {relativeTime(item.createdAt)}
          </time>
          <div className="ml-auto flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${item.title}`}
                  className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Open link
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={copyUrl}>
                  <Copy />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
