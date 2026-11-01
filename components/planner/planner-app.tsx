"use client";

import { useState } from "react";
import {
  CalendarCheck2,
  ListChecks,
  LogOut,
  Moon,
  Settings,
  Sun,
  Target,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logOut } from "@/app/login/actions";
import { plannerDispatch, usePlanner, useTodayKey } from "@/lib/planner-store";
import { WeekBoard } from "./week-board";
import { GoalsView } from "./goals-view";

type Tab = "week" | "goals";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}

function SettingsMenu({ weekStartsOn }: { weekStartsOn: 0 | 1 }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Planner settings">
          <Settings className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Week starts on</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(weekStartsOn)}
          onValueChange={(v) =>
            plannerDispatch({ type: "set-settings", settings: { weekStartsOn: Number(v) as 0 | 1 } })
          }
        >
          <DropdownMenuRadioItem value="0">Sunday</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="1">Monday</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PlannerApp() {
  const { tasks, goals, settings } = usePlanner();
  const [tab, setTab] = useState<Tab>("week");
  const todayKey = useTodayKey();

  const tabs: { id: Tab; label: string; icon: typeof ListChecks; count: number }[] = [
    { id: "week", label: "My week", icon: ListChecks, count: tasks.length },
    { id: "goals", label: "Goals", icon: Target, count: goals.filter((g) => !g.done).length },
  ];

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-sidebar">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"
            >
              <CalendarCheck2 className="size-5" />
            </span>
            <div>
              <p className="text-heading text-lg leading-none italic">Day Planner</p>
              <p className="mt-0.5 text-xs text-muted-foreground">plan, do, close the day</p>
            </div>
          </div>

          <nav
            aria-label="Planner sections"
            className="ml-4 flex rounded-xl border bg-card p-1"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  tab === t.id && "bg-primary text-primary-foreground hover:text-primary-foreground"
                )}
              >
                <t.icon className="size-4" />
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    tab === t.id ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <SettingsMenu weekStartsOn={settings.weekStartsOn} />
            <form action={logOut}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1700px] flex-1 px-4 py-6">
        {tab === "week" ? <WeekBoard todayKey={todayKey} /> : <GoalsView goals={goals} />}
      </main>
    </div>
  );
}
