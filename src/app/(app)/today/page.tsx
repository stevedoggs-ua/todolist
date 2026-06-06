"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listToday, setDone, updateTask, deleteTask, countFocus, saveOrder, repackTimeline } from "@/lib/db/tasks";
import { Skeleton } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { Timeline } from "@/components/Timeline";
import { TaskSheet } from "@/components/TaskSheet";
import { FocusBoard } from "@/components/FocusBoard";
import { MotivationBanner } from "@/components/MotivationBanner";
import { IconSparkles, IconPlus, IconClock } from "@/components/icons";
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
  const [celebrate, setCelebrate] = useState(false);
  const celebrateN = useRef(0);
  const load = () => listToday(today).then(setTasks).catch(() => setTasks([]));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const all = tasks ?? [];
  const focus = all.filter((t) => t.is_focus && t.focus_date === today);
  const rest = all.filter((t) => !(t.is_focus && t.focus_date === today));
  const total = all.length;
  const doneTotal = all.filter((t) => t.is_done).length;
  const plannedMin = sumDuration(all.map((t) => t.duration_min));

  const toggle = async (t: Task) => {
    const done = !t.is_done;
    setTasks((cur) => cur?.map((x) => (x.id === t.id ? { ...x, is_done: done } : x)) ?? null);
    if (done) { celebrateN.current += 1; setCelebrate(true); track("task_completed", {}); }
    await setDone(t.id, done);
  };

  const toggleFocus = async (t: Task) => {
    if (!t.is_focus) {
      const n = await countFocus(today);
      if (n >= FOCUS_LIMIT) { setToast("Фокус — це максимум 3. Прибери щось, щоб додати нове."); return; }
      await updateTask(t.id, { is_focus: true, focus_date: today });
      track("focus_set", {});
    } else {
      await updateTask(t.id, { is_focus: false, focus_date: null });
    }
    await load();
  };

  const commitBoard = async (focusIds: string[], restIds: string[]) => {
    const cur = new Map(all.map((t) => [t.id, t]));
    const ops: Promise<unknown>[] = [];
    for (const id of focusIds) {
      const t = cur.get(id);
      if (t && !(t.is_focus && t.focus_date === today)) ops.push(updateTask(id, { is_focus: true, focus_date: today }));
    }
    for (const id of restIds) {
      const t = cur.get(id);
      if (t && t.is_focus) ops.push(updateTask(id, { is_focus: false, focus_date: null }));
    }
    await Promise.all(ops);
    await saveOrder([...focusIds, ...restIds]);
    await load();
  };

  const reorderTimeline = async (ids: string[]) => { await repackTimeline(ids); await load(); };

  const saveEdit = async (patch: Partial<Task>) => { if (editing) { await updateTask(editing.id, patch); await load(); } };
  const removeEdit = async () => { if (editing) { await deleteTask(editing.id); setEditing(null); await load(); } };

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
        <Timeline tasks={all} today={today} onOpen={(t) => setEditing(t)} onToggle={toggle} onReorder={reorderTimeline} />
      ) : (
        <FocusBoard focusTasks={focus} restTasks={rest} today={today}
          onToggleDone={toggle} onToggleFocus={toggleFocus} onOpen={(t) => setEditing(t)} onCommit={commitBoard} />
      )}

      {celebrate && <MotivationBanner key={celebrateN.current} onClose={() => setCelebrate(false)} />}
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
