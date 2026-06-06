"use client";
import type { Task } from "@/lib/types";
import { PriorityDot } from "./PriorityDot";
import { Chip } from "./Chip";

export function TaskCard({ task, actions }:
  { task: Task; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl mb-2" style={{ background: "var(--surface)" }}>
      <PriorityDot priority={task.priority} />
      <div className="flex-1 min-w-0">
        <p className="text-base" style={{ color: "var(--text-primary)" }}>{task.title}</p>
        <div className="flex gap-2 mt-1 flex-wrap">
          {task.duration_min && <Chip>{task.duration_min} хв</Chip>}
          {task.due_date && <Chip>{task.due_date}{task.due_time ? ` ${task.due_time}` : ""}</Chip>}
        </div>
      </div>
      {actions}
    </div>
  );
}
