"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Plus, Link2, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_COLORS, type StashCategory, type StashItem } from "@/lib/types";
import { pct } from "@/lib/format";
import { cn } from "cn";

export function CategoryProgress({
  category,
  items,
  active,
  onSelect,
}: {
  category: StashCategory;
  items: StashItem[];
  active: boolean;
  onSelect: () => void;
}) {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const percent = pct(done, total);

  return (
    <div
      className={cn(
        "group/cat relative rounded-lg px-3 py-3 cursor-pointer text-sm transition-colors",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-current={active ? "page" : undefined}
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: CATEGORY_COLORS[category.color] }}
        />
        <span className="flex-1 truncate font-medium">{category.name}</span>
        <span className="text-xs text-muted-foreground tabular-nums" title={`${done} of ${total} completed`}>
          {total === 0 ? "" : `${done}/${total}`}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Options for ${category.name}`}
              className="opacity-0 group-hover/cat:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 size-7"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={onSelect}>
              <Link2 />
              Open
            </DropdownMenuItem>
            <CategoryActions payload={{ type: "category", id: category.id }} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {total > 0 && (
        <Progress
          value={percent}
          className="mt-2.5 h-1"
          aria-label={`${category.name} progress ${percent}%`}
        />
      )}
    </div>
  );
}

// actions

export interface CategoryActionPayload {
  type: "category";
  id: string;
}

export function CategoryActions({ payload }: { payload: CategoryActionPayload }) {
  const { onRenameCategory, onDeleteCategory } = useCategoryActionsContext();
  return (
    <>
      <DropdownMenuItem onSelect={() => onRenameCategory(payload.id)}>
        <Pencil />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" onSelect={() => onDeleteCategory(payload.id)}>
        <Trash2 />
        Delete
      </DropdownMenuItem>
    </>
  );
}


interface CategoryActionsContextValue {
  onRenameCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryActionsContext = createContext<CategoryActionsContextValue | null>(null);

export function CategoryActionsProvider({
  onRenameCategory,
  onDeleteCategory,
  children,
}: CategoryActionsContextValue & { children: ReactNode }) {
  return (
    <CategoryActionsContext.Provider value={{ onRenameCategory, onDeleteCategory }}>
      {children}
    </CategoryActionsContext.Provider>
  );
}

function useCategoryActionsContext() {
  const ctx = useContext(CategoryActionsContext);
  if (!ctx) throw new Error("CategoryActions must be used within CategoryActionsProvider");
  return ctx;
}

export function NewCategoryButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button variant="ghost" size="sm" className={cn("text-muted-foreground justify-start w-full", className)} onClick={onClick}>
      <Plus />
      New category
    </Button>
  );
}
