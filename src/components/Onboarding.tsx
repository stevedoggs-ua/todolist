"use client";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { IconMic, IconSparkles, IconStarFilled, IconArrowRight, IconCheck, IconClock, IconCalendar } from "./icons";
import { Logo } from "./Logo";

const SLIDES = [
  { t: "Вивали все з голови", s: "Голосом або текстом — усе, що крутиться в думках. Без форм і полів." },
  { t: "AI розкладе по полицях", s: "Пріоритет, час і дата — Max Plan зробить це за секунди." },
  { t: "Фокусуйся на головному", s: "Обери 1–3 задачі дня — і тримай продуктивність на максимумі." },
];

const chip = "inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap";

function MiniCard({ color, title, icon, meta, delay, done = false }:
  { color: string; title: string; icon: React.ReactNode; meta: string; delay: number; done?: boolean }) {
  return (
    <div className="rise flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 w-full"
      style={{ animationDelay: `${delay}ms`, background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-card)" }}>
      {done
        ? <span className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: "var(--success)" }}><IconCheck size={12} strokeWidth={3} /></span>
        : <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[13.5px] font-medium truncate"
          style={{ color: done ? "var(--ink-3)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>{title}</p>
        <span className={chip + " mt-0.5"} style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>{icon}{meta}</span>
      </div>
    </div>
  );
}

function Scene({ i }: { i: number }) {
  if (i === 0) {
    return (
      <div className="relative h-56 w-full flex items-center justify-center">
        <span className="absolute w-44 h-44 rounded-full animate-ping" style={{ background: "var(--accent-weak)" }} />
        <span className="absolute w-28 h-28 rounded-full" style={{ background: "var(--accent-weak)" }} />
        <div className="pop relative w-[88px] h-[88px] rounded-full flex items-center justify-center text-white"
          style={{ background: "var(--accent)", boxShadow: "var(--shadow-fab)" }}>
          <IconMic size={38} />
        </div>
        <span className={chip + " float absolute left-1 top-7"} style={{ background: "var(--surface)", color: "var(--ink-2)", boxShadow: "var(--shadow-card)" }}>написати Анні</span>
        <span className={chip + " float absolute right-0 top-16"} style={{ background: "var(--surface)", color: "var(--ink-2)", boxShadow: "var(--shadow-card)", animationDelay: "0.7s" }}>дзвінок о 15</span>
        <span className={chip + " float absolute left-6 bottom-6"} style={{ background: "var(--surface)", color: "var(--ink-2)", boxShadow: "var(--shadow-card)", animationDelay: "1.3s" }}>купити квіти</span>
      </div>
    );
  }
  if (i === 1) {
    return (
      <div className="relative h-56 w-full flex items-center justify-center">
        <div className="relative w-[280px] flex flex-col gap-2.5">
          <span className="pop absolute -top-3 -right-1 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: "var(--accent)", boxShadow: "var(--shadow-fab)" }}><IconSparkles size={18} /></span>
          <MiniCard color="var(--p1)" title="Написати Анні про дедлайн" icon={<IconClock size={11} />} meta="15 хв" delay={0} />
          <MiniCard color="var(--p2)" title="Дзвінок з клієнтом" icon={<IconCalendar size={11} />} meta="завтра · 15:00" delay={110} />
          <MiniCard color="var(--p3)" title="Купити квіти" icon={<IconClock size={11} />} meta="30 хв" delay={220} />
        </div>
      </div>
    );
  }
  return (
    <div className="relative h-56 w-full flex items-center justify-center">
      <div className="scale-in w-[270px] rounded-3xl border-2 px-4 py-4"
        style={{ borderColor: "var(--accent)", background: "var(--surface)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 text-[14px] font-semibold"><span style={{ color: "var(--accent)" }}><IconStarFilled size={16} /></span>Фокус дня</span>
          <span className="text-[12px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--accent-weak)", color: "var(--accent)" }}>2/3</span>
        </div>
        <div className="flex flex-col gap-2">
          <MiniCard color="var(--p1)" title="Глибока робота: презентація" icon={<IconClock size={11} />} meta="1.5 год" delay={120} done />
          <MiniCard color="var(--p2)" title="Розбір кандидатів" icon={<IconClock size={11} />} meta="1 год" delay={240} done />
        </div>
      </div>
    </div>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);
  const finish = (skipped: boolean) => {
    track(skipped ? "onboarding_skipped" : "onboarding_completed", {});
    onDone();
  };
  const last = i === SLIDES.length - 1;
  const next = () => (last ? finish(false) : setI(i + 1));
  const prev = () => i > 0 && setI(i - 1);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col px-6 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] overflow-hidden"
      style={{ background: "var(--bg)" }}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (startX.current === null) return;
        const dx = e.changedTouches[0].clientX - startX.current;
        if (dx < -50) next();
        else if (dx > 50) prev();
        startX.current = null;
      }}>

      {/* accent glow */}
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[460px] h-[460px] rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }} />

      <div className="relative flex items-center justify-between">
        <Logo size={24} />
        {!last && (
          <button onClick={() => finish(true)} className="text-[14px] font-medium press" style={{ color: "var(--ink-3)" }}>Пропустити</button>
        )}
      </div>

      <div className="relative flex gap-1.5 mt-5">
        {SLIDES.map((_, idx) => (
          <span key={idx} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: idx <= i ? "var(--accent)" : "var(--surface-2)" }} />
        ))}
      </div>

      {/* scene + copy (re-animates per slide) */}
      <div key={i} className="relative flex-1 flex flex-col justify-center min-h-0">
        <div className="scale-in"><Scene i={i} /></div>
        <div className="slide-in mt-6" style={{ animationDelay: "60ms" }}>
          <h1 className="text-[30px] leading-[1.12] font-semibold tracking-tight">{SLIDES[i].t}</h1>
          <p className="text-[16px] leading-relaxed mt-2.5" style={{ color: "var(--ink-2)" }}>{SLIDES[i].s}</p>
        </div>
      </div>

      <button onClick={next}
        className="relative h-14 rounded-2xl text-white text-[16px] font-semibold flex items-center justify-center gap-2 press shrink-0"
        style={{ background: "var(--accent)", boxShadow: "var(--shadow-fab)" }}>
        {last ? "Почати" : "Далі"}
        <IconArrowRight size={20} />
      </button>
    </div>
  );
}
