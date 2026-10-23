"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORY_COLORS,
  CATEGORY_COLOR_VALUES,
  type CategoryColor,
} from "@/lib/types";
import { cn } from "cn";

export interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null/undefined = create mode; an object = edit mode */
  target?: { id: string; name: string; color: CategoryColor } | null;
  /** unix-style nonce bumped on every open so form state resets */
  renderKey: string;
  onSave: (name: string, color: CategoryColor, id?: string) => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  target,
  renderKey,
  onSave,
}: CategoryDialogProps) {
  const editing = target ?? null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Rename category" : "New category"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the name or color."
              : "Group links by what they’re for."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CategoryForm
            key={renderKey}
            editingId={editing?.id}
            initialName={editing?.name ?? ""}
            initialColor={editing?.color ?? "terracotta"}
            onSave={onSave}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  editingId,
  initialName,
  initialColor,
  onSave,
  onDone,
}: {
  editingId?: string;
  initialName: string;
  initialColor: CategoryColor;
  onSave: (name: string, color: CategoryColor, id?: string) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<CategoryColor>(initialColor);
  const isEdit = Boolean(editingId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, color, editingId);
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          placeholder='e.g. "Watch later", "Tech reads"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={40}
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label>Color</Label>
        <div className="flex gap-2" role="radiogroup" aria-label="Category color">
          {CATEGORY_COLOR_VALUES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
              className={cn(
                "size-7 rounded-full transition-transform hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                color === c &&
                  "scale-110 ring-2 ring-foreground/70 ring-offset-1"
              )}
              style={{ backgroundColor: CATEGORY_COLORS[c] }}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          {isEdit ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoryDeleteAlert({
  open,
  onOpenChange,
  name,
  count,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string | null;
  count: number;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{name ? `Delete “${name}”?` : "Delete category?"}</DialogTitle>
          <DialogDescription>
            This deletes the {count === 1 ? "1 link" : `${count} links`} inside
            it too. This can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
