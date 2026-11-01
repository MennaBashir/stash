"use client";

import { useSyncExternalStore } from "react";
import { newId } from "./types";

const STORAGE_KEY = "planner.v1";

export type GoalHorizon = "month" | "quarter";

export interface PlannerTask {
  id: string;
  dateKey: string;
  title: string;
  done: boolean;
  doneAt?: number;
  note?: string;
  createdAt: number;
}

export interface PlannerGoal {
  id: string;
  title: string;
  description?: string;
  horizon: GoalHorizon;
  dueDate?: string;
  done: boolean;
  doneAt?: number;
  createdAt: number;
}

export interface DayNote {
  dateKey: string;
  text: string;
  updatedAt: number;
}

export interface PlannerState {
  tasks: PlannerTask[];
  goals: PlannerGoal[];
  notes: Record<string, DayNote>;
  settings: PlannerSettings;
}

export interface PlannerSettings {
  weekStartsOn: 0 | 1;
}

export type PlannerAction =
  | { type: "load"; state: PlannerState }
  | { type: "add-task"; dateKey: string; title: string; done?: boolean }
  | { type: "update-task"; id: string; title: string }
  | { type: "toggle-task"; id: string }
  | { type: "move-task"; id: string; dateKey: string }
  | { type: "delete-task"; id: string }
  | { type: "set-note"; dateKey: string; text: string }
  | { type: "set-settings"; settings: Partial<PlannerSettings> }
  | { type: "add-goal"; goal: Omit<PlannerGoal, "id" | "createdAt" | "done"> }
  | { type: "update-goal"; id: string; patch: Partial<Pick<PlannerGoal, "title" | "description" | "horizon" | "dueDate">> }
  | { type: "toggle-goal"; id: string }
  | { type: "delete-goal"; id: string };

const EMPTY_STATE: PlannerState = {
  tasks: [],
  goals: [],
  notes: {},
  settings: { weekStartsOn: 0 },
};

function pruneAndValidate(raw: unknown): PlannerState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as PlannerState;
  if (!Array.isArray(s.tasks) || !Array.isArray(s.goals)) return null;
  return {
    tasks: s.tasks.filter(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.dateKey === "string" &&
        typeof t.title === "string" &&
        typeof t.done === "boolean"
    ),
    goals: s.goals.filter(
      (g) =>
        g &&
        typeof g.id === "string" &&
        typeof g.title === "string" &&
        (g.horizon === "month" || g.horizon === "quarter")
    ),
    notes:
      s.notes && typeof s.notes === "object"
        ? Object.fromEntries(
            Object.entries(s.notes).filter(
              ([k, n]) =>
                typeof k === "string" && n && typeof n.text === "string"
            )
          )
        : {},
    settings: {
      weekStartsOn:
        s.settings?.weekStartsOn === 1 ? 1 : 0,
    },
  };
}

let state: PlannerState = EMPTY_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function persist(next: PlannerState) {
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

function getSnapshot(): PlannerState {
  ensureInit();
  return state;
}

function getServerSnapshot(): PlannerState {
  return EMPTY_STATE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function reducer(current: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case "load":
      return action.state;
    case "add-task": {
      const done = action.done ?? false;
      return {
        ...current,
        tasks: [
          ...current.tasks,
          {
            id: newId(),
            dateKey: action.dateKey,
            title: action.title.trim(),
            done,
            doneAt: done ? Date.now() : undefined,
            createdAt: Date.now(),
          },
        ],
      };
    }
    case "update-task":
      return {
        ...current,
        tasks: current.tasks.map((t) =>
          t.id === action.id ? { ...t, title: action.title.trim() || t.title } : t
        ),
      };
    case "toggle-task": {
      const now = Date.now();
      return {
        ...current,
        tasks: current.tasks.map((t) =>
          t.id === action.id
            ? { ...t, done: !t.done, doneAt: t.done ? undefined : now }
            : t
        ),
      };
    }
    case "move-task":
      return {
        ...current,
        tasks: current.tasks.map((t) =>
          t.id === action.id ? { ...t, dateKey: action.dateKey } : t
        ),
      };
    case "delete-task":
      return {
        ...current,
        tasks: current.tasks.filter((t) => t.id !== action.id),
      };
    case "set-note": {
      const text = action.text.trim();
      if (!text) {
        return {
          ...current,
          notes: Object.fromEntries(
            Object.entries(current.notes).filter(([k]) => k !== action.dateKey)
          ),
        };
      }
      return {
        ...current,
        notes: {
          ...current.notes,
          [action.dateKey]: {
            dateKey: action.dateKey,
            text,
            updatedAt: Date.now(),
          },
        },
      };
    }
    case "set-settings":
      return {
        ...current,
        settings: { ...current.settings, ...action.settings },
      };
    case "add-goal":
      return {
        ...current,
        goals: [
          ...current.goals,
          {
            id: newId(),
            createdAt: Date.now(),
            done: false,
            title: action.goal.title.trim(),
            description: action.goal.description?.trim() || undefined,
            horizon: action.goal.horizon,
            dueDate: action.goal.dueDate || undefined,
          },
        ],
      };
    case "update-goal":
      return {
        ...current,
        goals: current.goals.map((g) =>
          g.id === action.id ? { ...g, ...action.patch } : g
        ),
      };
    case "toggle-goal": {
      const now = Date.now();
      return {
        ...current,
        goals: current.goals.map((g) =>
          g.id === action.id
            ? { ...g, done: !g.done, doneAt: g.done ? undefined : now }
            : g
        ),
      };
    }
    case "delete-goal":
      return { ...current, goals: current.goals.filter((g) => g.id !== action.id) };
  }
}

function dispatch(action: PlannerAction) {
  ensureInit();
  state = reducer(state, action);
  persist(state);
  for (const listener of listeners) listener();
}

export function usePlanner(): PlannerState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* today's date is only knowable on the client — null while prerendering */
const noopSubscribe = () => () => {};

export function useTodayKey(): string | null {
  return useSyncExternalStore(noopSubscribe, () => dateKeyOf(new Date()), () => null);
}

export { dispatch as plannerDispatch };

/* date helpers — week starts on Sunday */

export function dateKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 0): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const distance = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - distance);
  return d;
}

export function weekDays(weekStart: Date): { date: Date; key: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    return { date, key: dateKeyOf(date) };
  });
}

export function formatDayHeader(date: Date): { name: string; num: string } {
  return {
    name: date.toLocaleDateString("en-US", { weekday: "short" }),
    num: String(date.getDate()),
  };
}

export function formatWeekRange(days: { date: Date }[]): string {
  const first = days[0].date;
  const last = days[6].date;
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(first)} – ${fmt(last)}`;
}

export function isToday(key: string): boolean {
  return key === dateKeyOf(new Date());
}
