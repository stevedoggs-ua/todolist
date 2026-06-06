"use client";
import { useEffect, useState } from "react";
import { listInbox, updateTask, deleteTask } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/Skeleton";
import { track } from "@/lib/analytics";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const load = () => listInbox().then(setTasks).catch(() => setTasks([]));
  useEffect(() => { load(); }, []);

  const toToday = async (t: Task) => {
    setTasks((cur) => cur?.filter((x) => x.id !== t.id) ?? null);
    await updateTask(t.id, { due_date: todayIso() });
    track("task_triaged", { action: "today" });
  };
  const remove = async (t: Task) => {
    setTasks((cur) => cur?.filter((x) => x.id !== t.id) ?? null);
    await deleteTask(t.id);
    track("task_triaged", { action: "delete" });
  };

  if (tasks === null) return <div className="pt-8">{[0,1,2].map((i) => <Skeleton key={i} />)}</div>;
  if (tasks.length === 0)
    return <main className="pt-8 text-center" style={{ color: "var(--text-secondary)" }}>
      <h1 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Inbox</h1>
      <p>Чисто. Натисни ＋ і вивали все, що в голові.</p>
    </main>;

  return (
    <main className="pt-8">
      <h1 className="text-2xl font-semibold mb-4">Inbox</h1>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} actions={
          <div className="flex flex-col gap-2">
            <button onClick={() => toToday(t)} aria-label="В день"
              className="w-12 h-12 rounded-lg" style={{ background: "var(--surface-2)" }}>📅</button>
            <button onClick={() => remove(t)} aria-label="Видалити"
              className="w-12 h-12 rounded-lg" style={{ background: "var(--surface-2)" }}>🗑</button>
          </div>
        } />
      ))}
    </main>
  );
}
