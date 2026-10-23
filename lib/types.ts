export type LinkKind = "video" | "article";

export type CategoryColor =
  | "terracotta"
  | "amber"
  | "sage"
  | "clay"
  | "plum"
  | "ink";

export interface StashCategory {
  id: string;
  name: string;
  color: CategoryColor;
  createdAt: number;
}

export interface StashItem {
  id: string;
  categoryId: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  kind: LinkKind;
  embedUrl?: string;
  createdAt: number;
  done: boolean;
  doneAt?: number;
}

export interface StashState {
  categories: StashCategory[];
  items: StashItem[];
}

export const CATEGORY_COLORS: Record<CategoryColor, string> = {
  terracotta: "var(--c-terracotta)",
  amber: "var(--c-amber)",
  sage: "var(--c-sage)",
  clay: "var(--c-clay)",
  plum: "var(--c-plum)",
  ink: "var(--c-ink)",
};

export const CATEGORY_COLOR_VALUES = Object.keys(CATEGORY_COLORS) as [
  CategoryColor,
  ...CategoryColor[]
];

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
