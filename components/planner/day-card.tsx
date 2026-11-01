"use client";

import { useState } from "react";
import {
  Check,
  GripVertical,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  plannerDispatch,
  type PlannerTask,
  formatDayHeader,
} from "@/lib/planner-store";

function TaskActions({
  title,
  onDelete,
  onEdit,
}: {
  title: string;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/task:opacity-100 focus-within:opacity-100">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${title}`}
        onClick={onEdit}
        className="size-7 text-muted-foreground hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${title}`}
        onClick={() => (confirming ? onDelete() : setConfirming(true))}
        onMouseLeave={() => setConfirming(false)}
        className={cn(
          "size-7 text-muted-foreground hover:text-destructive",
          confirming && "opacity-100"
        )}
      >
        {confirming ? (
          <Check className="size-3.5 text-destructive" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </Button>
    </span>
  );
}

function TaskItem({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  task: PlannerTask;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.title) {
      plannerDispatch({ type: "update-task", id: task.id, title: trimmed });
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="px-1 py-0.5">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setDraft(task.title);
              setEditing(false);
            }
          }}
          onBlur={commit}
          className="h-7 text-sm"
        />
      </li>
    );
  }

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group/task flex cursor-grab items-start gap-1.5 rounded-md px-1 py-1 hover:bg-muted/60 active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      title="Drag to another day"
    >
      <GripVertical className="mt-1 size-3.5 shrink-0 text-muted-foreground/40" />
      <Checkbox
        checked={task.done}
        onCheckedChange={() => plannerDispatch({ type: "toggle-task", id: task.id })}
        aria-label={`Mark ${task.title} done`}
        className="mt-0.5"
      />
      <span
        onDoubleClick={() => {
          setDraft(task.title);
          setEditing(true);
        }}
        className={cn(
          "min-w-0 flex-1 select-none text-sm leading-snug",
          task.done && "text-muted-foreground line-through"
        )}
      >
        {task.title}
      </span>
      <TaskActions
        title={task.title}
        onEdit={() => {
          setDraft(task.title);
          setEditing(true);
        }}
        onDelete={() => plannerDispatch({ type: "delete-task", id: task.id })}
      />
    </li>
  );
}

export function DayCard({
  date,
  dateKey,
  today,
  tasks,
  note,
}: {
  date: Date;
  dateKey: string;
  today: boolean;
  tasks: PlannerTask[];
  note?: string;
}) {
  const [draft, setDraft] = useState("");
  const [showNote, setShowNote] = useState(Boolean(note));
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const { name, num } = formatDayHeader(date);
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function addTask() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    plannerDispatch({ type: "add-task", dateKey, title: trimmed });
    setDraft("");
  }

  return (
    <div
      className={cn(
        "flex min-h-64 flex-col rounded-2xl border bg-card p-4 shadow-sm transition-shadow",
        today && "border-ring ring-1 ring-ring/40",
        dragOver && "border-ring bg-accent/40 ring-2 ring-ring/50"
      )}
      aria-label={`${name} ${num}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = e.dataTransfer.getData("text/plain");
        if (!taskId) return;
        const task = tasks.find((t) => t.id === taskId);
        if (task?.dateKey !== dateKey) {
          plannerDispatch({ type: "move-task", id: taskId, dateKey });
        }
        setDraggingId(null);
      }}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {name}
          </p>
          <p className={cn("text-heading text-2xl italic", !today && "text-foreground/80")}>
            {num}
          </p>
        </div>
        {today ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
            Today
          </span>
        ) : null}
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: "var(--c-sage)" }}
          aria-label={`${done} of ${total} done`}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {total === 0 ? "Plan the day" : `${done} of ${total} done`}
      </p>

      <ul className="mt-3 flex flex-1 flex-col gap-0.5">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isDragging={draggingId === task.id}
            onDragStart={() => setDraggingId(task.id)}
            onDragEnd={() => setDraggingId(null)}
          />
        ))}
        {total === 0 ? (
          <li className="px-1 py-2 text-xs text-muted-foreground/70 italic">
            {dragOver ? "Drop the task here" : "Drag a task here or add one below"}
          </li>
        ) : null}
      </ul>

      {showNote ? (
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <StickyNote className="size-3.5" />
            Close the day
          </p>
          <textarea
            value={note ?? ""}
            onChange={(e) =>
              plannerDispatch({ type: "set-note", dateKey, text: e.target.value })
            }
            placeholder="What did you finish today? What slowed you down? What you want to carry into tomorrow?"
            rows={4}
            className="min-h-28 w-full resize-y rounded-xl border bg-muted/40 p-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 field-sizing-content focus:border-ring focus:bg-background"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className={cn(
            "mt-3 self-start text-xs text-muted-foreground hover:text-foreground",
            note && "text-foreground"
          )}
        >
          <span className="flex items-center gap-1.5">
            <StickyNote className="size-3.5" />
            {note ? "View note" : "Close the day"}
          </span>
          {note ? (
            <span className="mt-1.5 line-clamp-2 block rounded-lg border bg-muted/40 p-2 text-left text-[11px] leading-relaxed whitespace-pre-wrap">
              {note}
            </span>
          ) : null}
        </button>
      )}

      <div className="mt-3 flex items-center gap-2 border-t pt-3">
        <Plus className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTask();
            }
          }}
          onBlur={addTask}
          placeholder="Add a task…"
          className="h-8 border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
