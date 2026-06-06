"use client";
import { useEffect, useState } from "react";
import type { Priority, Task } from "@/lib/types";
import { IconCheck, IconTrash, IconClock, IconCalendar } from "./icons";

const PRIORITIES: { p: Priority; label: string; color: string }[] = [
  { p: 1, label: "Терміново", color: "var(--p1)" },
  { p: 2, label: "Важливо", color: "var(--p2)" },
  { p: 3, label: "Звичайно", color: "var(--p3)" },
  { p: 4, label: "Колись", color: "var(--p4)" },
];

const DURATIONS: { label: string; min: number }[] = [
  { label: "15 хв", min: 15 }, { label: "30 хв", min: 30 }, { label: "45 хв", min: 45 },
  { label: "1 год", min: 60 }, { label: "1.5 год", min: 90 }, { label: "2 год", min: 120 },
];

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function TaskSheet({ task, today, onClose, onSave, onDelete }:
  { task: Task; today: string; onClose: () => void;
    onSave: (patch: Partial<Task>) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [duration, setDuration] = useState<number | null>(task.duration_min);
  const [date, setDate] = useState<string | null>(task.due_date);
  const [time, setTime] = useState<string | null>(task.due_time);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const save = () => {
    const t = title.trim();
    if (!t) return;
    onSave({
      title: t, priority, duration_min: duration,
      due_date: date, due_time: date ? time : null,
    });
    onClose();
  };

  const dateChips: { label: string; value: string | null }[] = [
    { label: "Без дати", value: null },
    { label: "Сьогодні", value: today },
    { label: "Завтра", value: addDays(today, 1) },
  ];

  const sectionTitle = "text-[13px] font-semibold uppercase tracking-wide mb-2.5";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end fade-in" onClick={onClose}>
      <div aria-hidden className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
      <div role="dialog" aria-label="Редагувати задачу" onClick={(e) => e.stopPropagation()}
        className="slide-up relative rounded-t-3xl max-h-[88vh] overflow-y-auto px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-pop)" }}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full" style={{ background: "var(--surface-2)" }} />

        {/* Title */}
        <textarea value={title} onChange={(e) => setTitle(e.target.value)} rows={1}
          aria-label="Назва задачі"
          className="w-full text-[19px] font-semibold leading-snug resize-none outline-none bg-transparent mb-6"
          style={{ color: "var(--ink)" }} />

        {/* Priority */}
        <div className="mb-6">
          <p className={sectionTitle} style={{ color: "var(--ink-3)" }}>Пріоритет</p>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map((pr) => {
              const on = priority === pr.p;
              return (
                <button key={pr.p} onClick={() => setPriority(pr.p)}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border press transition-colors"
                  style={{
                    borderColor: on ? pr.color : "var(--line)",
                    background: on ? `color-mix(in srgb, ${pr.color} 14%, transparent)` : "var(--surface)",
                  }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: pr.color }} />
                  <span className="text-[11.5px] font-medium" style={{ color: on ? pr.color : "var(--ink-2)" }}>{pr.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-6">
          <p className={sectionTitle} style={{ color: "var(--ink-3)" }}>
            <IconClock size={13} className="inline -mt-0.5 mr-1" />Скільки часу
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => {
              const on = duration === d.min;
              return (
                <button key={d.min} onClick={() => setDuration(on ? null : d.min)}
                  className="px-3.5 h-10 rounded-full border text-[14px] font-medium press transition-colors"
                  style={{
                    borderColor: on ? "var(--accent)" : "var(--line)",
                    background: on ? "var(--accent-weak)" : "var(--surface)",
                    color: on ? "var(--accent)" : "var(--ink-2)",
                  }}>
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* When */}
        <div className="mb-6">
          <p className={sectionTitle} style={{ color: "var(--ink-3)" }}>
            <IconCalendar size={13} className="inline -mt-0.5 mr-1" />Коли
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {dateChips.map((c) => {
              const on = date === c.value;
              return (
                <button key={c.label} onClick={() => { setDate(c.value); if (!c.value) setTime(null); }}
                  className="px-3.5 h-10 rounded-full border text-[14px] font-medium press transition-colors"
                  style={{
                    borderColor: on ? "var(--accent)" : "var(--line)",
                    background: on ? "var(--accent-weak)" : "var(--surface)",
                    color: on ? "var(--accent)" : "var(--ink-2)",
                  }}>
                  {c.label}
                </button>
              );
            })}
            <input type="date" value={date ?? ""} onChange={(e) => setDate(e.target.value || null)}
              aria-label="Обрати дату"
              className="px-3 h-10 rounded-full border text-[14px] outline-none press"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink-2)" }} />
          </div>

          {date && (
            <div className="flex items-center gap-2">
              <span className="text-[14px]" style={{ color: "var(--ink-2)" }}>Час початку</span>
              <input type="time" value={time ?? ""} onChange={(e) => setTime(e.target.value || null)}
                aria-label="Час початку"
                className="px-3 h-10 rounded-xl border text-[14px] outline-none"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }} />
              {time && (
                <button onClick={() => setTime(null)} className="text-[13px] press" style={{ color: "var(--ink-3)" }}>
                  прибрати
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={onDelete} aria-label="Видалити задачу"
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 press"
            style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "var(--danger)" }}>
            <IconTrash size={20} />
          </button>
          <button onClick={save}
            className="flex-1 h-12 rounded-2xl text-white text-[16px] font-semibold flex items-center justify-center gap-2 press"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-fab)" }}>
            <IconCheck size={20} strokeWidth={2.5} /> Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}
