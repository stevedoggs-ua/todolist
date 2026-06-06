"use client";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Priority, Task } from "@/lib/types";
import { Sortable, useDndSensors } from "./Sortable";
import { Checkbox } from "./Checkbox";
import { TaskCard } from "./TaskCard";
import { addMinutes, durationLabel, minutesBetween } from "@/lib/format";

const P_COLOR: Record<Priority, string> = {
  1: "var(--p1)", 2: "var(--p2)", 3: "var(--p3)", 4: "var(--p4)",
};

export function Timeline({ tasks, today, onOpen, onToggle, onReorder }:
  { tasks: Task[]; today: string; onOpen: (t: Task) => void;
    onToggle: (t: Task) => void; onReorder: (orderedIds: string[]) => void }) {
  const sensors = useDndSensors();
  const scheduled = tasks
    .filter((t) => t.due_time)
    .sort((a, b) => (a.due_time ?? "").localeCompare(b.due_time ?? ""));
  const unscheduled = tasks.filter((t) => !t.due_time);
  const ids = scheduled.map((t) => t.id);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldI = ids.indexOf(String(active.id));
      const newI = ids.indexOf(String(over.id));
      if (oldI >= 0 && newI >= 0) onReorder(arrayMove(ids, oldI, newI));
    }
  };

  return (
    <div>
      {scheduled.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-4 py-6 text-center mb-6"
          style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
          <p className="text-[14px]">Ще нічого не заплановано на годину.<br />Признач задачам час — і день складеться в розклад.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {scheduled.map((t, i) => {
                const start = t.due_time as string;
                const dur = t.duration_min ?? 30;
                const end = addMinutes(start, dur);
                const prev = scheduled[i - 1];
                const gap = prev ? minutesBetween(addMinutes(prev.due_time as string, prev.duration_min ?? 30), start) : 0;
                return (
                  <div key={t.id}>
                    {gap > 0 && (
                      <div className="flex gap-3 items-center">
                        <div className="w-11 shrink-0" />
                        <div className="flex items-center gap-2 py-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
                          <span className="h-px w-5" style={{ background: "var(--line)" }} />
                          {durationLabel(gap)} вільно
                        </div>
                      </div>
                    )}
                    <Sortable id={t.id}>
                      <div className="flex gap-3">
                        <div className="w-11 shrink-0 pt-3 text-[12.5px] font-semibold tabular-nums" style={{ color: "var(--ink-2)" }}>
                          {start}
                        </div>
                        <div className="flex-1 mb-2.5 rounded-2xl border flex items-stretch overflow-hidden"
                          style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-card)" }}>
                          <span className="w-1 shrink-0" style={{ background: P_COLOR[t.priority] }} />
                          <Checkbox checked={t.is_done} onChange={() => onToggle(t)} label={`Виконати: ${t.title}`} />
                          <button type="button" onClick={() => onOpen(t)} className="flex-1 text-left py-3 pr-3 min-w-0 press">
                            <p className="text-[15px] leading-snug line-clamp-2"
                              style={{ color: t.is_done ? "var(--ink-3)" : "var(--ink)", textDecoration: t.is_done ? "line-through" : "none" }}>
                              {t.title}
                            </p>
                            <p className="text-[12.5px] mt-0.5 tabular-nums" style={{ color: "var(--ink-3)" }}>
                              {start}–{end} · {durationLabel(dur)}
                            </p>
                          </button>
                        </div>
                      </div>
                    </Sortable>
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {unscheduled.length > 0 && (
        <section className="mt-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: "var(--ink-3)" }}>
            Без часу
          </h3>
          <div className="flex flex-col gap-2.5">
            {unscheduled.map((t) => (
              <TaskCard key={t.id} task={t} today={today} onOpen={() => onOpen(t)}
                leading={<Checkbox checked={t.is_done} onChange={() => onToggle(t)} label={`Виконати: ${t.title}`} />} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
