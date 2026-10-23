"use client";

import { Plus, Bookmark, Menu, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import {
  CategoryActionsProvider,
  CategoryProgress,
} from "@/components/stash/category-list";
import type { StashItem, StashCategory } from "@/lib/types";
import { pct } from "@/lib/format";
import { cn } from "cn";

export type View =
  | { kind: "filter"; value: "all" | "unwatched" | "watched" }
  | { kind: "category"; id: string };

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <span
        aria-hidden="true"
        className="grid place-items-center size-7 rounded-lg bg-primary text-primary-foreground"
      >
        <Bookmark className="size-4" fill="currentColor" strokeWidth={1.5} />
      </span>
      <span className="text-heading text-[1.35rem] leading-none tracking-tight">
        Stash
      </span>
    </div>
  );
}

export function OverallProgress({
  items,
  className,
}: {
  items: StashItem[];
  className?: string;
}) {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const percent = pct(done, total);
  return (
    <div
      className={cn(
        "rounded-xl bg-card border border-border/80 px-3 py-3",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading italic text-lg leading-none">
          {percent < 100 ? "Make a dent" : "All caught up"}
        </span>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {percent}%
        </span>
      </div>
      <Progress
        value={percent}
        className="mt-2.5"
        aria-label={`Overall progress ${percent}%`}
      />
      <p className="mt-2.5 px-0.5 text-xs text-muted-foreground tabular-nums">
        {total === 0
          ? "Nothing stashed yet"
          : `${done} of ${total} ${total === 1 ? "item" : "items"} watched or read`}
      </p>
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      className={className}
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark")
            ? "light"
            : "dark"
        )
      }
    >
      <Moon aria-hidden="true" className="hidden dark:block" />
      <Sun aria-hidden="true" className="dark:hidden" />
    </Button>
  );
}

export interface SidebarProps {
  categories: StashCategory[];
  items: StashItem[];
  activeCategoryId: string | null;
  onNavigate: (view: View) => void;
  onRenameCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onNewCategory: () => void;
}

export function SidebarContents({
  categories,
  items,
  activeCategoryId,
  onNavigate,
  onRenameCategory,
  onDeleteCategory,
  onNewCategory,
}: SidebarProps) {
  return (
    <CategoryActionsProvider
      onRenameCategory={onRenameCategory}
      onDeleteCategory={onDeleteCategory}
    >
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="px-2 pt-1">
          <Wordmark />
          <p className="mt-1 text-xs text-muted-foreground">
            save it for later
          </p>
        </div>
        <OverallProgress items={items} />
        <Separator />
        <div className="flex-1 min-h-0 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No categories yet.
              <br />
              Create one to start stashing.
            </p>
          ) : (
            <div className="px-2">
              <p className="px-3 pb-2 pt-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
                Categories
              </p>
              <div className="space-y-1">
                {categories.map((category) => (
                  <CategoryProgress
                    key={category.id}
                    category={category}
                    items={items.filter((i) => i.categoryId === category.id)}
                    active={activeCategoryId === category.id}
                    onSelect={() =>
                      onNavigate({ kind: "category", id: category.id })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <Button variant="outline" className="w-full" onClick={onNewCategory}>
          <Plus />
          New category
        </Button>
      </div>
    </CategoryActionsProvider>
  );
}

export function MobileSidebar(props: SidebarProps) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="md:hidden"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Categories and progress</SheetTitle>
        </SheetHeader>
        <SidebarContents
          {...props}
          onNavigate={(view) => {
            props.onNavigate(view);
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
