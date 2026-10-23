import type { StashState } from "./types";
import { parseMedia } from "./media";

const DAY = 86_400_000;

interface SeedItem {
  categoryId: string;
  url: string;
  title: string;
  description: string;
  ageDays: number;
  done?: boolean;
}

function buildItem(seed: SeedItem, now: number) {
  const media = parseMedia(seed.url);
  return {
    id: `seed-${seed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    categoryId: seed.categoryId,
    url: seed.url,
    title: seed.title,
    description: seed.description,
    image: media.thumbnail,
    favicon: undefined,
    kind: media.kind,
    embedUrl: media.embedUrl,
    createdAt: now - seed.ageDays * DAY,
    done: seed.done ?? false,
    doneAt: seed.done ? now - (seed.ageDays - 2) * DAY : undefined,
  };
}

function sampleState(): StashState {
  const now = Date.now();
  return {
    categories: [
      {
        id: "seed-cat-watch",
        name: "Watch later",
        color: "terracotta",
        createdAt: now - 30 * DAY,
      },
      {
        id: "seed-cat-read",
        name: "Read later",
        color: "sage",
        createdAt: now - 29 * DAY,
      },
      {
        id: "seed-cat-code",
        name: "Code & tutorials",
        color: "ink",
        createdAt: now - 28 * DAY,
      },
    ],
    items: [
      {
        categoryId: "seed-cat-watch",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Rick Astley — Never Gonna Give You Up",
        description: "",
        ageDays: 1,
      },
      {
        categoryId: "seed-cat-watch",
        url: "https://vimeo.com/76979871",
        title: "The New Vimeo Player",
        description: "",
        ageDays: 3,
      },
      {
        categoryId: "seed-cat-read",
        url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
        title: "A Complete Guide to Flexbox",
        description: "",
        ageDays: 2,
        done: true,
      },
      {
        categoryId: "seed-cat-read",
        url: "https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/",
        title: "An Interactive Guide to Flexbox",
        description: "",
        ageDays: 6,
      },
      {
        categoryId: "seed-cat-code",
        url: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
        title: "TypeScript in 100 Seconds",
        description: "",
        ageDays: 4,
      },
      {
        categoryId: "seed-cat-code",
        url: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
        title: "React in 100 Seconds",
        description: "",
        ageDays: 8,
        done: true,
      },
      {
        categoryId: "seed-cat-code",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
        title: "CSS Grid Layout — MDN",
        description: "",
        ageDays: 11,
      },
    ].map((seed) => buildItem(seed, now)),
  };
}

export function sampleStateData(): StashState {
  return sampleState();
}
