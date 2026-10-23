"use client";

import { useSyncExternalStore } from "react";
import {
  CATEGORY_COLOR_VALUES,
  newId,
  type CategoryColor,
  type StashItem,
  type StashState,
} from "./types";
import { sampleStateData } from "./sample-data";

const STORAGE_KEY = "stash.v1";

const EMPTY_STATE: StashState = { categories: [], items: [] };

export type StashAction =
  | { type: "load"; state: StashState }
  | { type: "add-category"; name: string; color: CategoryColor }
  | { type: "update-category"; id: string; name?: string; color?: CategoryColor }
  | { type: "delete-category"; id: string }
  | { type: "add-item"; item: StashItem }
  | {
      type: "update-item";
      id: string;
      patch: Partial<Pick<StashItem, "title" | "description" | "categoryId">>;
    }
  | { type: "toggle-item"; id: string }
  | { type: "delete-item"; id: string };

function pruneAndValidate(raw: unknown): StashState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as StashState;
  if (!Array.isArray(s.categories) || !Array.isArray(s.items)) return null;
  return {
    categories: s.categories.filter(
      (c) => c && typeof c.id === "string" && typeof c.name === "string"
    ),
    items: s.items.filter(
      (i) =>
        i &&
        typeof i.id === "string" &&
        typeof i.url === "string" &&
        (i.kind === "video" || i.kind === "article")
    ),
  };
}

/* external store — a small local data source for localStorage-backed app state */

let state: StashState = EMPTY_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function persist(next: StashState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or unavailable — keep in-memory state
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = pruneAndValidate(JSON.parse(stored));
      if (parsed) {
        state = parsed;
        return;
      }
    }
  } catch {
    // corrupted storage — start fresh
  }
  state = EMPTY_STATE;
}

function getSnapshot(): StashState {
  ensureInit();
  return state;
}

function getServerSnapshot(): StashState {
  return EMPTY_STATE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function reducer(current: StashState, action: StashAction): StashState {
  switch (action.type) {
    case "load":
      return action.state;
    case "add-category":
      return {
        ...current,
        categories: [
          ...current.categories,
          {
            id: newId(),
            name: action.name.trim(),
            color: action.color,
            createdAt: Date.now(),
          },
        ],
      };
    case "update-category":
      return {
        ...current,
        categories: current.categories.map((c) =>
          c.id === action.id
            ? {
                ...c,
                name: action.name?.trim() ?? c.name,
                color: action.color ?? c.color,
              }
            : c
        ),
      };
    case "delete-category":
      return {
        categories: current.categories.filter((c) => c.id !== action.id),
        items: current.items.filter((i) => i.categoryId !== action.id),
      };
    case "add-item":
      return { ...current, items: [...current.items, action.item] };
    case "update-item":
      return {
        ...current,
        items: current.items.map((i) =>
          i.id === action.id ? { ...i, ...action.patch } : i
        ),
      };
    case "toggle-item": {
      const now = Date.now();
      return {
        ...current,
        items: current.items.map((i) =>
          i.id === action.id
            ? { ...i, done: !i.done, doneAt: i.done ? undefined : now }
            : i
        ),
      };
    }
    case "delete-item":
      return { ...current, items: current.items.filter((i) => i.id !== action.id) };
  }
}

function dispatch(action: StashAction) {
  ensureInit();
  state = reducer(state, action);
  persist(state);
  for (const listener of listeners) listener();
}

export function useStash(): StashState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export { dispatch as stashDispatch };

export function loadSampleData() {
  dispatch({ type: "load", state: sampleStateData() });
}

export function makeItem(input: {
  categoryId: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  kind: "video" | "article";
  embedUrl?: string;
}): StashItem {
  return {
    id: newId(),
    categoryId: input.categoryId,
    url: input.url.trim(),
    title: input.title.trim() || input.url,
    description: input.description?.trim() || undefined,
    image: input.image,
    favicon: input.favicon,
    kind: input.kind,
    embedUrl: input.embedUrl,
    createdAt: Date.now(),
    done: false,
  };
}

export function nextColor(usedCount: number): CategoryColor {
  return CATEGORY_COLOR_VALUES[usedCount % CATEGORY_COLOR_VALUES.length];
}
