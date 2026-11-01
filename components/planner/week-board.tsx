"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  plannerDispatch,
  usePlanner,
  formatWeekRange,
  startOfWeek,
  weekDays,
} from "@/lib/planner-store";
import { DayCard } from "./day-card";
import { Skeleton } from "@/components/ui/skeleton";

export function WeekBoard({ todayKey }: { todayKey: string | null }) {
  const { tasks, notes, settings } = usePlanner();
  const weekStartsOn = settings.weekStartsOn;
  const [weekOffset, setWeekOffset] = useState(0);

  const days = useMemo(() => {
    if (!todayKey) return null;
    const weekStart = startOfWeek(new Date(todayKey + "T00:00:00"), weekStartsOn);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);
    return weekDays(weekStart);
  }, [todayKey, weekStartsOn, weekOffset]);

  const isCurrentWeek = todayKey !== null && weekOffset === 0;

  const weekTasks = useMemo(() => {
    if (!days) return [];
    return tasks.filter((t) => days.some((d) => d.key === t.dateKey));
  }, [tasks, days]);
  const weekDone = weekTasks.filter((t) => t.done).length;
  const pct =
    weekTasks.length > 0 ? Math.round((weekDone / weekTasks.length) * 100) : 0;

  const leftover = useMemo(() => {
    if (!isCurrentWeek || !todayKey) return [];
    return weekTasks.filter((t) => !t.done && t.dateKey < todayKey);
  }, [weekTasks, isCurrentWeek, todayKey]);

  if (!days) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1700px]:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  function carryOver() {
    for (const task of leftover) {
      plannerDispatch({ type: "move-task", id: task.id, dateKey: todayKey! });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Previous week"
          >
            <ChevronLeft />
          </Button>
          <div className="min-w-44 text-center">
            <p className="text-sm font-semibold">
              {isCurrentWeek ? "This week" : weekOffset === 1 ? "Next week" : "Week board"}
            </p>
            <p className="text-xs text-muted-foreground">{formatWeekRange(days)}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Next week"
          >
            <ChevronRight />
          </Button>
          {!isCurrentWeek ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(0)}
              aria-label="Jump to this week"
            >
              <History />
              Today
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: "var(--c-sage)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {weekTasks.length === 0
              ? "No tasks planned"
              : `${weekDone} of ${weekTasks.length} done · ${pct}%`}
          </p>
        </div>
      </div>

      {leftover.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-accent/40 px-4 py-2.5">
          <p className="text-sm text-accent-foreground">
            {leftover.length} unfinished{" "}
            {leftover.length === 1 ? "task" : "tasks"} from earlier days
          </p>
          <Button size="sm" variant="outline" className="ml-auto" onClick={carryOver}>
            Move to today
            <ArrowRight />
          </Button>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1700px]:grid-cols-7">
        {days.map((day) => (
          <DayCard
            key={day.key}
            date={day.date}
            dateKey={day.key}
            today={day.key === todayKey}
            tasks={tasks.filter((t) => t.dateKey === day.key)}
            note={notes[day.key]?.text}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {weekOffset < 0
          ? "Looking back — how did those days go? Check the notes."
          : weekOffset > 0
            ? "Plan ahead before the days arrive."
            : "Drag tasks between days, double-click to rename, and close each day with a note."}
      </p>
    </div>
  );
}
