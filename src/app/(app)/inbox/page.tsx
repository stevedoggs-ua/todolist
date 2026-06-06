"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { listInbox, updateTask, deleteTask, saveOrder } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/Skeleton";
import { TaskSheet } from "@/components/TaskSheet";
import { Sortable, useDndSensors } from "@/components/Sortable";
import { IconCalendar, IconTrash, IconInbox, IconPlus } from "@/components/icons";
import { track } from "@/lib/analytics";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function InboxPage() {
  const today = todayIso();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const sensors = useDndSensors();
  const load = () => listInbox().then(setTasks).catch(() => setTasks([]));
  useEffect(() => { load(); }, []);

  const remove = async (t: Task) => {
    setTasks((cur) => cur?.filter((x) => x.id !== t.id) ?? null);
    await deleteTask(t.id);
    track("task_triaged", { action: "delete" });
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !tasks) return;
    const oldI = tasks.findIndex((t) => t.id === active.id);
    const newI = tasks.findIndex((t) => t.id === over.id);
    if (oldI < 0 || newI < 0) return;
    const next = arrayMove(tasks, oldI, newI);
    setTasks(next);
    await saveOrder(next.map((t) => t.id));
  };

  const saveEdit = async (patch: Partial<Task>) => {
    if (!editing) return;
    await updateTask(editing.id, patch);
    if (patch.due_date) track("task_triaged", { action: "scheduled" });
    await load();
  };
  const removeEdit = async () => {
    if (!editing) return;
    await deleteTask(editing.id); setEditing(null); await load();
  };

  return (
    <main className="pt-12">
      <header className="mb-6">
        <h1 className="text-[30px] font-semibold tracking-tight leading-none">Inbox</h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--ink-3)" }}>
          {tasks === null ? " " : tasks.length ? `${tasks.length} на розборі` : "Усе розібрано"}
        </p>
      </header>

      {tasks === null ? (
        <div>{[0, 1, 2].map((i) => <Skeleton key={i} />)}</div>
      ) : tasks.length === 0 ? (
        <EmptyInbox />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">
              {tasks.map((t) => (
                <Sortable key={t.id} id={t.id}>
                  <TaskCard task={t} today={today} onOpen={() => setEditing(t)}
                    trailing={
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditing(t)} aria-label="Призначити дату"
                          className="w-10 h-10 rounded-full flex items-center justify-center press"
                          style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
                          <IconCalendar size={18} />
                        </button>
                        <button onClick={() => remove(t)} aria-label="Видалити"
                          className="w-10 h-10 rounded-full flex items-center justify-center press"
                          style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
                          <IconTrash size={18} />
                        </button>
                      </div>
                    } />
                </Sortable>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editing && (
        <TaskSheet task={editing} today={today}
          onClose={() => setEditing(null)} onSave={saveEdit} onDelete={removeEdit} />
      )}
    </main>
  );
}

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center text-center pt-16 px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--surface-2)" }}>
        <span style={{ color: "var(--ink-3)" }}><IconInbox size={30} /></span>
      </div>
      <h2 className="text-lg font-semibold mb-1">Чисто</h2>
      <p className="text-[14px] mb-6" style={{ color: "var(--ink-3)" }}>
        Натисни ＋ і вивали все, що в голові.
      </p>
      <Link href="/capture"
        className="inline-flex items-center gap-2 h-12 px-5 rounded-2xl text-white text-[15px] font-medium press"
        style={{ background: "var(--accent)" }}>
        <IconPlus size={18} strokeWidth={2.5} /> Новий brain-dump
      </Link>
    </div>
  );
}
