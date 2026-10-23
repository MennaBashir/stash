"use client";

import { Bookmark, Plus, SearchX, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoCategoriesEmpty({
  onNewCategory,
  onAddSample,
}: {
  onNewCategory: () => void;
  onAddSample: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-20 text-center">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"
      >
        <Bookmark className="size-6" />
      </span>
      <h2 className="text-heading mt-5 text-3xl italic">
        Anything you want later,
        <br />
        in one place.
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Create a category — like “Watch later” or “Tech reads” — then drop
        article and video links into it. Check them off as you go and watch
        your progress add up.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onNewCategory}>
          <Plus />
          New category
        </Button>
        <Button variant="outline" onClick={onAddSample}>
          Add sample data
        </Button>
      </div>
    </div>
  );
}

export function EmptyCategory({
  categoryName,
  onAddLink,
}: {
  categoryName: string;
  onAddLink: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-20 text-center">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"
      >
        <Bookmark className="size-6" />
      </span>
      <h2 className="text-heading mt-5 text-2xl italic">
        “{categoryName}” is waiting for its first link
      </h2>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Paste any video or article URL and it gets fetched, previewed and
        filed here.
      </p>
      <Button className="mt-6" onClick={onAddLink}>
        <Plus />
        Add a link
      </Button>
    </div>
  );
}

export function AllCaughtUp({
  onAddLink,
}: {
  onAddLink: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-20 text-center">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"
      >
        <PartyPopper className="size-6" />
      </span>
      <h2 className="text-heading mt-5 text-2xl italic">
        Nothing left unwatched here
      </h2>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Every link in this view is done. Stash something new or check another
        category.
      </p>
      <Button className="mt-6" onClick={onAddLink}>
        <Plus />
        Add a link
      </Button>
    </div>
  );
}

export function NoResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-20 text-center">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"
      >
        <SearchX className="size-6" />
      </span>
      <h2 className="text-heading mt-5 text-2xl italic">
        No matches for “{query}”
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Try a different word, or clear the search.
      </p>
      <Button className="mt-6" variant="outline" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}
