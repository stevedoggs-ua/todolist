"use client";
import { useEffect, useState } from "react";
import { listUpcoming } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/Skeleton";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function UpcomingPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  useEffect(() => { listUpcoming(todayIso()).then(setTasks).catch(() => setTasks([])); }, []);

  if (tasks === null) return <div className="pt-8">{[0,1].map((i) => <Skeleton key={i} />)}</div>;

  const groups = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const k = t.due_date ?? "—"; (acc[k] ||= []).push(t); return acc;
  }, {});

  return (
    <main className="pt-8">
      <h1 className="text-2xl font-semibold mb-4">Upcoming</h1>
      {Object.keys(groups).length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Поки нічого не заплановано наперед.</p>
      )}
      {Object.entries(groups).map(([date, list]) => (
        <section key={date} className="mb-5">
          <h2 className="text-lg font-medium mb-2">{date}</h2>
          {list.map((t) => <TaskCard key={t.id} task={t} />)}
        </section>
      ))}
    </main>
  );
}
