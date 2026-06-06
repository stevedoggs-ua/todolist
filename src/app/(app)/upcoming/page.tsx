"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listUpcoming } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/Skeleton";
import { IconCalendar, IconPlus } from "@/components/icons";
import { groupLabel } from "@/lib/format";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function UpcomingPage() {
  const today = todayIso();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  useEffect(() => { listUpcoming(today).then(setTasks).catch(() => setTasks([])); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = (tasks ?? []).reduce<Record<string, Task[]>>((acc, t) => {
    const k = t.due_date ?? "—"; (acc[k] ||= []).push(t); return acc;
  }, {});
  const dates = Object.keys(groups).sort();

  return (
    <main className="pt-12">
      <header className="mb-6">
        <h1 className="text-[30px] font-semibold tracking-tight leading-none">Згодом</h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--ink-3)" }}>Заплановане наперед</p>
      </header>

      {tasks === null ? (
        <div>{[0, 1].map((i) => <Skeleton key={i} />)}</div>
      ) : dates.length === 0 ? (
        <EmptyUpcoming />
      ) : (
        <div className="flex flex-col gap-7">
          {dates.map((date) => (
            <section key={date}>
              <h2 className="flex items-baseline gap-2 mb-3">
                <span className="text-[17px] font-semibold">{groupLabel(date, today)}</span>
                <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>{groups[date].length}</span>
              </h2>
              <div className="flex flex-col gap-2.5">
                {groups[date].map((t, i) => (
                  <div key={t.id} className="rise" style={{ animationDelay: `${i * 45}ms` }}>
                    <TaskCard task={t} today={today} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyUpcoming() {
  return (
    <div className="flex flex-col items-center text-center pt-16 px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--surface-2)" }}>
        <span style={{ color: "var(--ink-3)" }}><IconCalendar size={30} /></span>
      </div>
      <h2 className="text-lg font-semibold mb-1">Поки порожньо</h2>
      <p className="text-[14px] mb-6" style={{ color: "var(--ink-3)" }}>
        Признач задачам дати — і вони з'являться тут.
      </p>
      <Link href="/capture"
        className="inline-flex items-center gap-2 h-12 px-5 rounded-2xl text-white text-[15px] font-medium press"
        style={{ background: "var(--accent)" }}>
        <IconPlus size={18} strokeWidth={2.5} /> Додати задачу
      </Link>
    </div>
  );
}
