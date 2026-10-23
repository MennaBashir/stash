"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddLinkDialog } from "@/components/stash/add-link-dialog";
import {
  CategoryDeleteAlert,
  CategoryDialog,
} from "@/components/stash/category-dialog";
import {
  AllCaughtUp,
  EmptyCategory,
  NoCategoriesEmpty,
  NoResults,
} from "@/components/stash/empty-states";
import { LinkCard } from "@/components/stash/link-card";
import {
  MobileSidebar,
  SidebarContents,
  ThemeToggle,
  type View,
} from "@/components/stash/sidebar";
import { loadSampleData, stashDispatch, useStash } from "@/lib/store";
import { hostOf } from "@/lib/media";
import { pct } from "@/lib/format";
import type { CategoryColor, StashItem } from "@/lib/types";
import { cn } from "cn";

type FilterValue = "all" | "unwatched" | "watched";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unwatched", label: "To watch" },
  { value: "watched", label: "Done" },
];

function viewTitle(view: View, categoryName: string | null): string {
  if (view.kind === "category" && categoryName) return categoryName;
  if (view.kind === "filter") {
    if (view.value === "watched") return "Done";
    if (view.value === "unwatched") return "To watch";
  }
  return "Everything";
}

export function AppShell() {
  const { categories, items } = useStash();

  const [view, setView] = useState<View>({ kind: "filter", value: "all" });
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addNonce, setAddNonce] = useState(0);
  const [addDefaultCategory, setAddDefaultCategory] = useState<string | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<StashItem | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    target: { id: string; name: string; color: CategoryColor } | null;
  }>({ open: false, target: null });
  const [catNonce, setCatNonce] = useState(0);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  /* views referencing a deleted category fall back to “Everything” */
  const viewDangling =
    view.kind === "category" && !categories.some((c) => c.id === view.id);
  const effectiveView = useMemo<View>(
    () => (viewDangling ? { kind: "filter", value: "all" } : view),
    [viewDangling, view]
  );

  const activeCategory =
    effectiveView.kind === "category"
      ? (categories.find((c) => c.id === effectiveView.id) ?? null)
      : null;

  const baseItems = useMemo(() => {
    if (effectiveView.kind === "category" && activeCategory) {
      return items.filter((i) => i.categoryId === effectiveView.id);
    }
    if (effectiveView.kind === "filter" && effectiveView.value !== "all") {
      const done = effectiveView.value === "watched";
      return items.filter((i) => i.done === done);
    }
    return items;
  }, [items, effectiveView, activeCategory]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? baseItems.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            hostOf(i.url).toLowerCase().includes(q)
        )
      : baseItems;
    return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  }, [baseItems, query]);

  const categoryById = useMemo(() => {
    const map = new Map<string, (typeof categories)[number]>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const doneTotal = items.filter((i) => i.done).length;

  const toggleItem = (item: StashItem) => {
    stashDispatch({ type: "toggle-item", id: item.id });
  };

  const deleteItem = (item: StashItem) => {
    stashDispatch({ type: "delete-item", id: item.id });
    toast("Link removed", {
      description: item.title,
      action: {
        label: "Undo",
        onClick: () => stashDispatch({ type: "add-item", item }),
      },
    });
  };

  const requestDeleteCategory = (id: string) => setCategoryToDelete(id);

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const cat = categories.find((c) => c.id === categoryToDelete);
    const count = items.filter((i) => i.categoryId === categoryToDelete).length;
    stashDispatch({ type: "delete-category", id: categoryToDelete });
    setCategoryToDelete(null);
    if (cat) {
      toast("Category deleted", {
        description: `${cat.name}${count > 0 ? ` and ${count} link${count === 1 ? "" : "s"}` : ""}`,
      });
    }
  };

  const saveCategory = (
    name: string,
    color: CategoryColor,
    id?: string
  ) => {
    if (id) {
      stashDispatch({ type: "update-category", id, name, color });
      toast.success("Category updated");
    } else {
      stashDispatch({ type: "add-category", name, color });
      toast.success("Category created", { description: name });
    }
  };

  const openRenameCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setCatNonce((n) => n + 1);
      setCategoryDialog({
        open: true,
        target: { id: cat.id, name: cat.name, color: cat.color },
      });
    }
  };
  const openAdd = (categoryId?: string) => {
    setEditingItem(null);
    setAddDefaultCategory(categoryId ?? null);
    setAddNonce((n) => n + 1);
    setAddOpen(true);
  };

  const openNewCategory = () => {
    setCatNonce((n) => n + 1);
    setCategoryDialog({ open: true, target: null });
  };

  const title = viewTitle(effectiveView, activeCategory?.name ?? null);
  const subtitle = (() => {
    const vt =
      effectiveView.kind === "filter" && effectiveView.value === "all"
        ? `${items.length} stashed`
        : `${baseItems.length} link${baseItems.length === 1 ? "" : "s"}`;
    if (items.length === 0) return vt;
    const percent = pct(doneTotal, items.length);
    return `${vt} · ${percent}% completed overall`;
  })();

  return (
    <div className="flex min-h-dvh w-full">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <SidebarContents
          categories={categories}
          items={items}
          activeCategoryId={activeCategory?.id ?? null}
          onNavigate={(v) => {
            setView(v);
            setQuery("");
          }}
  onRenameCategory={openRenameCategory}
          onDeleteCategory={requestDeleteCategory}
          onNewCategory={openNewCategory}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-1.5 border-b bg-background/90 px-3 py-2.5 backdrop-blur-sm md:hidden">
          <MobileSidebar
            categories={categories}
            items={items}
            activeCategoryId={activeCategory?.id ?? null}
            onNavigate={(v) => {
              setView(v);
              setQuery("");
            }}
  onRenameCategory={openRenameCategory}
            onDeleteCategory={requestDeleteCategory}
            onNewCategory={openNewCategory}
          />
          <span className="ml-1 select-none text-heading text-xl leading-none">
            Stash
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            <ThemeToggle />
            <Button
              size="icon"
              aria-label="Add a link"
              onClick={() =>
                openAdd(
                  effectiveView.kind === "category"
                    ? effectiveView.id
                    : undefined
                )
              }
            >
              <Plus />
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <header className="flex flex-col gap-4 px-4 pt-6 pb-1 md:px-8 md:pt-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-heading truncate text-3xl italic tracking-tight md:text-[2rem]">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {subtitle}
                </p>
              </div>
              <div className="hidden items-center gap-1 md:flex">
                <ThemeToggle />
                <Button
                  onClick={() =>
                    openAdd(
                      effectiveView.kind === "category"
                        ? effectiveView.id
                        : undefined
                    )
                  }
                >
                  <Plus />
                  Add link
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search links…"
                  aria-label="Search links"
                  className="pr-8 pl-8"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                  >
                    <X />
                  </Button>
                )}
              </div>
              <div
                role="tablist"
                aria-label="Filter links"
                className="flex items-center gap-0.5 rounded-lg bg-secondary p-1"
              >
                {FILTERS.map((f) => {
                  const active =
                    effectiveView.kind === "filter" &&
                    effectiveView.value === f.value;
                  return (
                    <button
                      key={f.value}
                      role="tab"
                      aria-selected={active}
                      onClick={() =>
                        setView({ kind: "filter", value: f.value })
                      }
                      className={cn(
                        "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                        active
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <div className="px-4 pt-5 pb-12 md:px-8">
            {categories.length === 0 ? (
              <NoCategoriesEmpty
                onNewCategory={openNewCategory}
                onAddSample={() => {
                  loadSampleData();
                  setView({ kind: "filter", value: "all" });
                  toast.success("Sample data added", {
                    description: "7 links across 3 categories",
                  });
                }}
              />
            ) : visibleItems.length === 0 ? (
              <EmptyView
                view={effectiveView}
                query={query}
                totalItems={items.length}
                activeCategoryName={activeCategory?.name ?? null}
                baseCount={baseItems.length}
                onClearSearch={() => setQuery("")}
                onAddLink={() =>
                  openAdd(
                    effectiveView.kind === "category"
                      ? effectiveView.id
                      : undefined
                  )
                }
                onSwitchToAll={() => setView({ kind: "filter", value: "all" })}
                onNewCategory={openNewCategory}
                onAddSample={() => loadSampleData()}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {visibleItems.map((item) => (
                    <LinkCard
                      key={item.id}
                      item={item}
                      category={
                        categoryById.get(item.categoryId) ?? undefined
                      }
                      onToggle={() => toggleItem(item)}
                      onEdit={() => {
                        setEditingItem(item);
                        setAddNonce((n) => n + 1);
                        setAddOpen(true);
                      }}
                      onDelete={() => deleteItem(item)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>

      <AddLinkDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setEditingItem(null);
        }}
        defaultCategoryId={
          addDefaultCategory ?? activeCategory?.id ?? null
        }
        editing={editingItem}
        renderKey={`${addNonce}-add`}
      />

      <CategoryDialog
        open={categoryDialog.open}
        onOpenChange={(open) => {
          if (!open) setCategoryDialog({ open: false, target: null });
        }}
        target={categoryDialog.target}
        renderKey={`${catNonce}-cat`}
        onSave={saveCategory}
      />

      <CategoryDeleteAlert
        open={categoryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
        name={
          categories.find((c) => c.id === categoryToDelete)?.name ?? null
        }
        count={
          categoryToDelete
            ? items.filter((i) => i.categoryId === categoryToDelete).length
            : 0
        }
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}

function EmptyView({
  view,
  query,
  totalItems,
  activeCategoryName,
  baseCount,
  onClearSearch,
  onAddLink,
  onSwitchToAll,
  onNewCategory,
  onAddSample,
}: {
  view: View;
  query: string;
  totalItems: number;
  activeCategoryName: string | null;
  baseCount: number;
  onClearSearch: () => void;
  onAddLink: () => void;
  onSwitchToAll: () => void;
  onNewCategory: () => void;
  onAddSample: () => void;
}) {
  if (query.trim()) {
    return <NoResults query={query.trim()} onClear={onClearSearch} />;
  }
  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-16 text-center">
        <h2 className="text-heading text-2xl italic">Your stash is empty</h2>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Stash your first link, or explore with sample data.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onAddLink}>
            <Plus />
            Add a link
          </Button>
          <Button variant="outline" onClick={onNewCategory}>
            New category
          </Button>
          <Button variant="ghost" onClick={onAddSample}>
            Add sample data
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Tip: the “Everything” view shows links across all categories —{" "}
          <button
            className="underline underline-offset-2 hover:text-foreground"
            onClick={onSwitchToAll}
          >
            switch view
          </button>
        </p>
      </div>
    );
  }
  if (view.kind === "category") {
    if (baseCount === 0) {
      return (
        <EmptyCategory categoryName={activeCategoryName ?? ""} onAddLink={onAddLink} />
      );
    }
    return <AllCaughtUp onAddLink={onAddLink} />;
  }
  if (view.value === "watched" || view.value === "unwatched") {
    return <AllCaughtUp onAddLink={onAddLink} />;
  }
  return <AllCaughtUp onAddLink={onAddLink} />;
}

