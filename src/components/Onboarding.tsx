"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

const SLIDES = [
  { t: "Вивали все з голови", s: "Голосом або текстом — все, що крутиться в думках." },
  { t: "AI розкладе по полицях", s: "Пріоритет, оцінка часу і дата — автоматично." },
  { t: "Фокусуйся на головному", s: "Триаж в Inbox → обери 1–3 задачі дня у Focus." },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const finish = (skipped: boolean) => {
    track(skipped ? "onboarding_skipped" : "onboarding_completed", {});
    onDone();
  };
  const last = i === SLIDES.length - 1;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6" style={{ background: "var(--bg)" }}>
      <button onClick={() => finish(true)} className="self-end text-sm" style={{ color: "var(--text-secondary)" }}>Пропустити</button>
      <div className="flex-1 flex flex-col justify-center gap-3">
        <div className="flex gap-1.5 mb-2">
          {SLIDES.map((_, idx) => (
            <span key={idx} className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: idx <= i ? "var(--accent)" : "var(--surface-2)" }} />
          ))}
        </div>
        <h1 className="text-3xl font-semibold">{SLIDES[i].t}</h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>{SLIDES[i].s}</p>
      </div>
      <button onClick={() => (last ? finish(false) : setI(i + 1))}
        className="h-14 rounded-xl text-white text-base font-medium" style={{ background: "var(--accent)" }}>
        {last ? "Почати" : "Далі"}
      </button>
    </div>
  );
}
