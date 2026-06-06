"use client";
import { useEffect, useState } from "react";
import { listToday, setDone, updateTask, countFocus } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Checkbox } from "@/components/Checkbox";
import { Skeleton } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { track } from "@/lib/analytics";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }
const FOCUS_LIMIT = 3;

export default function TodayPage() {
  const today = todayIso();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [toast, setToast] = useState("");
  const load = () => listToday(today).then(setTasks).catch(() => setTasks([]));
  useEffect(() => { load(); }, []);

  const focus = (tasks ?? []).filter((t) => t.is_focus && t.focus_date === today);
  const rest = (tasks ?? []).filter((t) => !(t.is_focus && t.focus_date === today));
  const focusDone = focus.filter((t) => t.is_done).length;

  const toggle = async (t: Task) => {
    const done = !t.is_done;
    setTasks((cur) => cur?.map((x) => x.id === t.id ? { ...x, is_done: done } : x) ?? null);
    await setDone(t.id, done);
    if (done) track("task_completed", {});
  };

  const toggleFocus = async (t: Task) => {
    if (!t.is_focus) {
      const n = await countFocus(today);
      if (n >= FOCUS_LIMIT) { setToast("Фокус — це максимум 3. Прибери щось, щоб додати нове."); return; }
      setTasks((cur) => cur?.map((x) => x.id === t.id ? { ...x, is_focus: true, focus_date: today } : x) ?? null);
      await updateTask(t.id, { is_focus: true, focus_date: today });
      track("focus_set", {});
    } else {
      setTasks((cur) => cur?.map((x) => x.id === t.id ? { ...x, is_focus: false, focus_date: null } : x) ?? null);
      await updateTask(t.id, { is_focus: false, focus_date: null });
    }
  };

  if (tasks === null) return <div className="pt-8">{[0,1,2].map((i) => <Skeleton key={i} />)}</div>;

  const row = (t: Task) => (
    <div key={t.id} className="flex items-center gap-1">
      <Checkbox checked={t.is_done} onChange={() => toggle(t)} label={`Виконати: ${t.title}`} />
      <div className="flex-1"><TaskCard task={t} actions={
        <button onClick={() => toggleFocus(t)} aria-label="У фокус" className="w-12 h-12"
          style={{ color: t.is_focus ? "var(--accent)" : "var(--text-tertiary)" }}>★</button>
      } /></div>
    </div>
  );

  return (
    <main className="pt-8">
      <h1 className="text-2xl font-semibold">Today</h1>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Фокус: {focusDone} з {focus.length} · Всього: {tasks.filter(t=>t.is_done).length} з {tasks.length} зроблено
      </p>

      <h2 className="text-lg font-medium mb-2">🎯 Фокус дня</h2>
      {focus.length === 0
        ? <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>Обери 1–3 головні задачі на сьогодні (★).</p>
        : <div className="mb-4">{focus.map(row)}</div>}
      {focus.length > 0 && focusDone === focus.length &&
        <p className="text-sm mb-4" style={{ color: "var(--success)" }}>Головне на сьогодні — зроблено 🎯</p>}

      <h2 className="text-lg font-medium mb-2">Решта</h2>
      {rest.length === 0
        ? <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>На сьогодні більше нічого 🎉</p>
        : rest.map(row)}

      {toast && <Toast message={toast} action="Ок" onAction={() => setToast("")} />}
    </main>
  );
}
