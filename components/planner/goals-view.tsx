"use client";

import { useState } from "react";
import { CalendarDays, Check, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { plannerDispatch, type PlannerGoal } from "@/lib/planner-store";

function GoalCard({ goal }: { goal: PlannerGoal }) {
  const due = goal.dueDate
    ? new Date(goal.dueDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="group/goal flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm"
      role="listitem"
    >
      <button
        type="button"
        aria-label={goal.done ? `Reopen ${goal.title}` : `Complete ${goal.title}`}
        onClick={() => {
          plannerDispatch({ type: "toggle-goal", id: goal.id });
          toast.success(goal.done ? "Goal reopened" : "Goal achieved", {
            description: goal.title,
          });
        }}
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors"
        style={{
          borderColor: "var(--c-sage)",
          background: goal.done ? "var(--c-sage)" : "transparent",
        }}
      >
        {goal.done ? <Check className="size-3 text-white" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={
            goal.done
              ? "text-sm font-medium text-muted-foreground line-through"
              : "text-sm font-medium"
          }
        >
          {goal.title}
        </p>
        {goal.description ? (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {goal.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-secondary-foreground uppercase">
            {goal.horizon === "month" ? "This month" : "Coming period"}
          </span>
          {due ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="size-3" />
              {due}
            </span>
          ) : null}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${goal.title}`}
        onClick={() => {
          plannerDispatch({ type: "delete-goal", id: goal.id });
          toast("Goal deleted", { description: goal.title });
        }}
        className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/goal:opacity-100 hover:text-destructive focus-visible:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function GoalSection({
  title,
  hint,
  goals,
}: {
  title: string;
  hint: string;
  goals: PlannerGoal[];
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-heading text-xl italic">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {goals.length} {goals.length === 1 ? "goal" : "goals"}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2" role="list">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
        {goals.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing here yet — add a goal you actually want to reach.
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function GoalsView({ goals }: { goals: PlannerGoal[] }) {
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    horizon: "month" as "month" | "quarter",
    dueDate: "",
  });

  function addGoal() {
    const title = draft.title.trim();
    if (!title) return;
    plannerDispatch({
      type: "add-goal",
      goal: {
        title,
        description: draft.description,
        horizon: draft.horizon,
        dueDate: draft.dueDate || undefined,
      },
    });
    setDraft({ title: "", description: "", horizon: draft.horizon, dueDate: "" });
    toast.success("Goal added", { description: title });
  }

  const active = goals.filter((g) => !g.done);
  const achieved = goals.filter((g) => g.done);
  const month = active.filter((g) => g.horizon === "month");
  const quarter = active.filter((g) => g.horizon === "quarter");

  return (
    <div className="mx-auto w-full max-w-4xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addGoal();
        }}
        className="rounded-2xl border bg-card p-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"
          >
            <Target className="size-5" />
          </span>
          <div>
            <p className="text-heading text-lg italic">Set a new goal</p>
            <p className="text-xs text-muted-foreground">
              Name what you want to achieve — big enough to matter, small
              enough to plan.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
          <div className="grid gap-1.5">
            <Label htmlFor="goal-title">Goal</Label>
            <Input
              id="goal-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Finish the design portfolio"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="goal-desc">Why it matters (optional)</Label>
            <Input
              id="goal-desc"
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="The outcome behind the goal"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="grid w-full max-w-48 gap-1.5">
            <Label>Horizon</Label>
            <Select
              value={draft.horizon}
              onValueChange={(v) =>
                setDraft({ ...draft, horizon: v as "month" | "quarter" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">Coming period</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full max-w-48 gap-1.5">
            <Label htmlFor="goal-due">Due (optional)</Label>
            <Input
              id="goal-due"
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
            />
          </div>
          <Button type="submit" className="sm:ml-auto">
            <Plus />
            Add goal
          </Button>
        </div>
      </form>

      <div className="mt-8 grid gap-8">
        <GoalSection
          title="This month"
          hint="30 days is enough to build a habit — commit to these."
          goals={month}
        />
        <GoalSection
          title="Coming period"
          hint="Bigger bets for the next few months."
          goals={quarter}
        />
        {achieved.length > 0 ? (
          <GoalSection
            title="Achieved"
            hint="Proof that you finish what you plan."
            goals={achieved}
          />
        ) : null}
      </div>
    </div>
  );
}
