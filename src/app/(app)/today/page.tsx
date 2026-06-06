"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listToday, setDone, updateTask, deleteTask, countFocus } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Checkbox } from "@/components/Checkbox";
import { Skeleton } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { Timeline } from "@/components/Timeline";
import { TaskSheet } from "@/components/TaskSheet";
import { IconStar, IconStarFilled, IconSparkles, IconPlus, IconClock } from "@/components/icons";
import { track } from "@/lib/analytics";
import { todayHeadline, durationLabel, sumDuration } from "@/lib/format";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }
const FOCUS_LIMIT = 3;

export default function TodayPage() {
  const today = todayIso();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [view, setView] = useState<"list" | "timeline">("list");
  const load = () => listToday(today).then(setTasks).catch(() => setTasks([]));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const all = tasks ?? [];
  const focus = all.filter((t) => t.is_focus && t.focus_date === today);
  const rest = all.filter((t) => !(t.is_focus && t.focus_date === today));
  const focusDone = focus.filter((t) => t.is_done).length;
  const total = all.length;
  const doneTotal = all.filter((t) => t.is_done).length;
  const plannedMin = sumDuration(all.map((t) => t.duration_min));

  const toggle = async (t: Task) => {
    const done = !t.is_done;
    setTasks((cur) => cur?.map((x) => (x.id === t.id ? { ...x, is_done: done } : x)) ?? null);
    await setDone(t.id, done);
    if (done) track("task_completed", {});
  };

  const toggleFocus = async (t: Task) => {
    if (!t.is_focus) {
      const n = await countFocus(today);
      if (n >= FOCUS_LIMIT) { setToast("Фокус — це максимум 3. Прибери щось, щоб додати нове."); return; }
      setTasks((cur) => cur?.map((x) => (x.id === t.id ? { ...x, is_focus: true, focus_date: today } : x)) ?? null);
      await updateTask(t.id, { is_focus: true, focus_date: today });
      track("focus_set", {});
    } else {
      setTasks((cur) => cur?.map((x) => (x.id === t.id ? { ...x, is_focus: false, focus_date: null } : x)) ?? null);
      await updateTask(t.id, { is_focus: false, focus_date: null });
    }
  };

  const saveEdit = async (patch: Partial<Task>) => {
    if (!editing) return;
    await updateTask(editing.id, patch);
    await load();
  };
  const removeEdit = async () => {
    if (!editing) return;
    await deleteTask(editing.id);
    setEditing(null);
    await load();
  };

  const Row = (t: Task, i: number) => (
    <div key={t.id} className="rise" style={{ animationDelay: `${i * 45}ms` }}>
      <TaskCard task={t} today={today} focus={t.is_focus && t.focus_date === today} onOpen={() => setEditing(t)}
        leading={<Checkbox checked={t.is_done} onChange={() => toggle(t)} label={`Виконати: ${t.title}`} />}
        trailing={
          <button onClick={() => toggleFocus(t)} aria-label={t.is_focus ? "Прибрати з фокусу" : "У фокус"}
            className="w-10 h-10 flex items-center justify-center shrink-0 press"
            style={{ color: t.is_focus ? "var(--accent)" : "var(--ink-3)" }}>
            {t.is_focus ? <IconStarFilled size={20} /> : <IconStar size={20} />}
          </button>
        } />
    </div>
  );

  return (
    <main className="pt-12">
      <header className="mb-5">
        <h1 className="text-[30px] font-semibold tracking-tight leading-none">Сьогодні</h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--ink-3)" }}>{todayHeadline(today)}</p>
        {tasks !== null && total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center text-[13px] mb-1.5" style={{ color: "var(--ink-2)" }}>
              <span>{doneTotal} з {total} зроблено</span>
              {plannedMin > 0 && (
                <span className="inline-flex items-center gap-1"><IconClock size={13} /> ≈ {durationLabel(plannedMin)} на день</span>
              )}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(doneTotal / total) * 100}%`, background: "var(--accent)" }} />
            </div>
          </div>
        )}
      </header>

      {tasks !== null && total > 0 && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl mb-5" style={{ background: "var(--surface-2)" }}>
          {(["list", "timeline"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className="h-9 rounded-xl text-[14px] font-medium transition-colors press"
              style={{ background: view === v ? "var(--surface)" : "transparent",
                color: view === v ? "var(--ink)" : "var(--ink-3)",
                boxShadow: view === v ? "var(--shadow-card)" : "none" }}>
              {v === "list" ? "Список" : "Таймлайн"}
            </button>
          ))}
        </div>
      )}

      {tasks === null ? (
        <div>{[0, 1, 2].map((i) => <Skeleton key={i} />)}</div>
      ) : total === 0 ? (
        <EmptyToday />
      ) : view === "timeline" ? (
        <Timeline tasks={all} today={today} onOpen={(t) => setEditing(t)} onToggle={toggle} />
      ) : (
        <>
          <section className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 text-[17px] font-semibold">
                <span style={{ color: "var(--accent)" }}><IconStarFilled size={18} /></span>
                Фокус дня
              </h2>
              <span className="text-[13px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent-weak)", color: "var(--accent)" }}>
                {focusDone}/{focus.length || 3}
              </span>
            </div>

            {focus.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-5 text-center"
                style={{ borderColor: "var(--line)", color: "var(--ink-3)" }}>
                <p className="text-[14px]">Обери 1–3 головні задачі на сьогодні — тапни ☆ на картці.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">{focus.map(Row)}</div>
            )}

            {focus.length > 0 && focusDone === focus.length && (
              <div className="scale-in mt-3 flex items-center gap-2.5 rounded-2xl px-4 py-3.5"
                style={{ background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}>
                <IconSparkles size={20} />
                <p className="text-[14px] font-semibold">Головне на сьогодні — зроблено!</p>
              </div>
            )}
          </section>

          {rest.length > 0 && (
            <section>
              <h2 className="text-[17px] font-semibold mb-3">Решта</h2>
              <div className="flex flex-col gap-2.5">{rest.map((t, i) => Row(t, i + focus.length))}</div>
            </section>
          )}
        </>
      )}

      {toast && <Toast message={toast} action="Ок" onAction={() => setToast("")} />}
      {editing && (
        <TaskSheet task={editing} today={today}
          onClose={() => setEditing(null)} onSave={saveEdit} onDelete={removeEdit} />
      )}
    </main>
  );
}

function EmptyToday() {
  return (
    <div className="flex flex-col items-center text-center pt-16 px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--surface-2)" }}>
        <span style={{ color: "var(--accent)" }}><IconSparkles size={30} /></span>
      </div>
      <h2 className="text-lg font-semibold mb-1">На сьогодні чисто</h2>
      <p className="text-[14px] mb-6" style={{ color: "var(--ink-3)" }}>
        Заглянь в Inbox або вивали нові думки.
      </p>
      <Link href="/capture"
        className="inline-flex items-center gap-2 h-12 px-5 rounded-2xl text-white text-[15px] font-medium press"
        style={{ background: "var(--accent)" }}>
        <IconPlus size={18} strokeWidth={2.5} /> Додати задачу
      </Link>
    </div>
  );
}
