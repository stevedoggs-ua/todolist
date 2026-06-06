"use client";
import { useEffect, useRef, useState } from "react";
import {
  DndContext, DragOverlay, closestCorners, useDroppable,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Sortable, useDndSensors } from "./Sortable";
import { TaskCard } from "./TaskCard";
import { Checkbox } from "./Checkbox";
import { IconStar, IconStarFilled, IconSparkles } from "./icons";
import type { Task } from "./../lib/types";

const FOCUS_LIMIT = 3;

type Cols = { focus: string[]; rest: string[] };

export function FocusBoard({ focusTasks, restTasks, today, onToggleDone, onToggleFocus, onOpen, onCommit }:
  { focusTasks: Task[]; restTasks: Task[]; today: string;
    onToggleDone: (t: Task) => void; onToggleFocus: (t: Task) => void;
    onOpen: (t: Task) => void; onCommit: (focusIds: string[], restIds: string[]) => void }) {
  const byId = new Map<string, Task>([...focusTasks, ...restTasks].map((t) => [t.id, t]));
  const focusIds = focusTasks.map((t) => t.id);
  const restIds = restTasks.map((t) => t.id);

  const [cols, setCols] = useState<Cols>({ focus: focusIds, rest: restIds });
  const [activeId, setActiveId] = useState<string | null>(null);
  const blocked = useRef(false);
  const sensors = useDndSensors();

  // Re-sync when data changes (e.g. after a reload).
  const sig = `${focusIds.join(",")}|${restIds.join(",")}`;
  useEffect(() => { setCols({ focus: focusIds, rest: restIds }); /* eslint-disable-next-line */ }, [sig]);

  const containerOf = (id: string): keyof Cols | null =>
    id === "focus" || id === "rest" ? (id as keyof Cols)
      : cols.focus.includes(id) ? "focus" : cols.rest.includes(id) ? "rest" : null;

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const from = containerOf(String(active.id));
    const to = containerOf(String(over.id));
    if (!from || !to || from === to) return;
    if (to === "focus" && cols.focus.length >= FOCUS_LIMIT) { blocked.current = true; return; }
    setCols((prev) => {
      const fromItems = prev[from].filter((id) => id !== active.id);
      const overItems = prev[to];
      const overIdx = overItems.indexOf(String(over.id));
      const insertAt = overIdx >= 0 ? overIdx : overItems.length;
      const toItems = [...overItems.slice(0, insertAt), String(active.id), ...overItems.slice(insertAt)];
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) { blocked.current = false; return; }
    const from = containerOf(String(active.id));
    const to = containerOf(String(over.id));
    let next = cols;
    if (from && to && from === to) {
      const items = cols[from];
      const oldI = items.indexOf(String(active.id));
      const newI = items.indexOf(String(over.id));
      if (oldI !== newI && newI >= 0) {
        next = { ...cols, [from]: arrayMove(items, oldI, newI) };
        setCols(next);
      }
    }
    blocked.current = false;
    onCommit(next.focus, next.rest);
  };

  const Row = (id: string) => {
    const t = byId.get(id);
    if (!t) return null;
    const isFocus = cols.focus.includes(id);
    return (
      <Sortable key={id} id={id}>
        <TaskCard task={t} today={today} focus={isFocus} onOpen={() => onOpen(t)}
          leading={<Checkbox checked={t.is_done} onChange={() => onToggleDone(t)} label={`Виконати: ${t.title}`} />}
          trailing={
            <button onClick={() => onToggleFocus(t)} aria-label={isFocus ? "Прибрати з фокусу" : "У фокус"}
              className="w-10 h-10 flex items-center justify-center shrink-0 press"
              style={{ color: isFocus ? "var(--accent)" : "var(--ink-3)" }}>
              {isFocus ? <IconStarFilled size={20} /> : <IconStar size={20} />}
            </button>
          } />
      </Sortable>
    );
  };

  const focusDone = cols.focus.filter((id) => byId.get(id)?.is_done).length;
  const active = activeId ? byId.get(activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragOver={onDragOver} onDragEnd={onDragEnd}>

      <section className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold">
            <span style={{ color: "var(--accent)" }}><IconStarFilled size={18} /></span>
            Фокус дня
          </h2>
          <span className="text-[13px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent-weak)", color: "var(--accent)" }}>
            {focusDone}/{cols.focus.length || 3}
          </span>
        </div>

        <Zone id="focus" empty={cols.focus.length === 0}>
          <SortableContext items={cols.focus} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">{cols.focus.map(Row)}</div>
          </SortableContext>
        </Zone>

        {cols.focus.length > 0 && focusDone === cols.focus.length && (
          <div className="scale-in mt-3 flex items-center gap-2.5 rounded-2xl px-4 py-3.5"
            style={{ background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}>
            <IconSparkles size={20} />
            <p className="text-[14px] font-semibold">Головне на сьогодні — зроблено!</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[17px] font-semibold mb-3">Решта</h2>
        <Zone id="rest" empty={cols.rest.length === 0} restHint>
          <SortableContext items={cols.rest} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">{cols.rest.map(Row)}</div>
          </SortableContext>
        </Zone>
      </section>

      <DragOverlay>
        {active ? (
          <div style={{ cursor: "grabbing" }}>
            <TaskCard task={active} today={today} focus={active.is_focus && active.focus_date === today} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Zone({ id, empty, restHint, children }:
  { id: string; empty: boolean; restHint?: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="rounded-2xl transition-colors"
      style={{ outline: isOver ? "2px dashed var(--accent)" : "none", outlineOffset: 4, minHeight: empty ? 64 : undefined }}>
      {empty ? (
        <div className="rounded-2xl border border-dashed px-4 py-5 text-center"
          style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
          <p className="text-[14px]">
            {restHint ? "Перетягни сюди задачі або познач виконаними." : "Перетягни сюди задачу або тапни ☆ — максимум 3."}
          </p>
        </div>
      ) : children}
    </div>
  );
}
