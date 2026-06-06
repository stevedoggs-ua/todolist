"use client";
import type { ReactNode } from "react";
import type { Task } from "@/lib/types";
import { PriorityDot } from "./PriorityDot";
import { Chip } from "./Chip";
import { IconClock, IconCalendar } from "./icons";
import { relativeDay, durationLabel } from "@/lib/format";

export function TaskCard({ task, leading, trailing, today, focus, onOpen }:
  { task: Task; leading?: ReactNode; trailing?: ReactNode; today?: string;
    focus?: boolean; onOpen?: () => void }) {
  const done = task.is_done;
  const overdue = !!(task.due_date && today && task.due_date < today && !done);

  const body = (
    <div className="flex-1 min-w-0 text-left">
      <div className="flex items-start gap-2">
        <span className="mt-[7px]"><PriorityDot priority={task.priority} /></span>
        <p className="text-[15px] leading-snug line-clamp-2"
          style={{
            color: done ? "var(--ink-3)" : "var(--ink)",
            textDecoration: done ? "line-through" : "none",
          }}>
          {task.title}
        </p>
      </div>
      {(task.due_date || task.duration_min) && (
        <div className="flex gap-1.5 mt-1.5 flex-wrap pl-4">
          {task.due_date && (
            <Chip icon={<IconCalendar size={12} />} tone={overdue ? "danger" : "default"}>
              {today ? relativeDay(task.due_date, today) : task.due_date}
              {task.due_time ? ` · ${task.due_time}` : ""}
            </Chip>
          )}
          {task.duration_min && (
            <Chip icon={<IconClock size={12} />}>{durationLabel(task.duration_min)}</Chip>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-3 rounded-2xl px-3.5 py-3 border"
      style={{
        background: "var(--surface)",
        borderColor: focus ? "var(--accent)" : "var(--line)",
        boxShadow: focus ? "var(--shadow-card), inset 0 0 0 1px var(--accent)" : "var(--shadow-card)",
      }}>
      {leading}
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex-1 min-w-0 press">{body}</button>
      ) : body}
      {trailing}
    </div>
  );
}
