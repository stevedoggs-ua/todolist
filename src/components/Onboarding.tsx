"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { IconMic, IconSparkles, IconStarFilled, IconArrowRight } from "./icons";
import { Logo } from "./Logo";

const SLIDES = [
  { Icon: IconMic, t: "Вивали все з голови", s: "Голосом або текстом — усе, що крутиться в думках. Без форм і полів." },
  { Icon: IconSparkles, t: "AI розкладе по полицях", s: "Пріоритет, оцінка часу й дата — застосунок зробить це за секунди." },
  { Icon: IconStarFilled, t: "Фокусуйся на головному", s: "Обери 1–3 задачі дня — і роби те, що справді важливо." },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const finish = (skipped: boolean) => {
    track(skipped ? "onboarding_skipped" : "onboarding_completed", {});
    onDone();
  };
  const last = i === SLIDES.length - 1;
  const Slide = SLIDES[i];

  return (
    <div className="fixed inset-0 z-50 flex flex-col p-6 pt-[max(env(safe-area-inset-top),24px)]"
      style={{ background: "var(--bg)" }}>
      <Logo size={26} className="mx-auto mb-6" />
      {/* progress + skip */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5 flex-1">
          {SLIDES.map((_, idx) => (
            <span key={idx} className="h-1 flex-1 rounded-full transition-colors duration-300"
              style={{ background: idx <= i ? "var(--accent)" : "var(--surface-2)" }} />
          ))}
        </div>
        {!last && (
          <button onClick={() => finish(true)} className="text-[14px] font-medium press"
            style={{ color: "var(--ink-3)" }}>Пропустити</button>
        )}
      </div>

      {/* content (re-animates on change) */}
      <div key={i} className="scale-in flex-1 flex flex-col justify-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "var(--accent-weak)", color: "var(--accent)" }}>
          <Slide.Icon size={40} />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">{Slide.t}</h1>
          <p className="text-[17px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{Slide.s}</p>
        </div>
      </div>

      <button onClick={() => (last ? finish(false) : setI(i + 1))}
        className="h-14 rounded-2xl text-white text-[16px] font-semibold flex items-center justify-center gap-2 press"
        style={{ background: "var(--accent)", boxShadow: "var(--shadow-fab)" }}>
        {last ? "Почати" : "Далі"}
        <IconArrowRight size={20} />
      </button>
    </div>
  );
}
