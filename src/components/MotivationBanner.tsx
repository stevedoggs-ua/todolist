"use client";
import { useEffect, useState } from "react";
import { IconSparkles } from "./icons";

const CONFETTI = ["var(--p1)", "var(--p2)", "var(--p3)", "var(--success)", "var(--accent)"];

export function MotivationBanner({ onClose }: { onClose: () => void }) {
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 fade-in" onClick={onClose}>
      <div aria-hidden className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />

      <div role="dialog" aria-label="Мотивація від CEO" onClick={(e) => e.stopPropagation()}
        className="scale-in relative w-full max-w-sm rounded-3xl px-6 pt-7 pb-6 text-center overflow-hidden"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-pop)" }}>

        {/* confetti */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24">
          {CONFETTI.map((c, i) => (
            <span key={i} className="pop absolute block w-1.5 h-1.5 rounded-full"
              style={{
                background: c,
                left: `${12 + i * 18}%`,
                top: `${10 + (i % 3) * 14}px`,
                animationDelay: `${i * 70}ms`,
              }} />
          ))}
        </div>

        {/* accent glow */}
        <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }} />

        {/* photo */}
        <div className="relative mx-auto mb-4 w-[88px] h-[88px] rounded-full p-[3px]"
          style={{ background: "linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent) 40%, var(--p2)))" }}>
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            {imgOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/ceo.jpg" alt="Макс Штепа" className="w-full h-full object-cover"
                onError={() => setImgOk(false)} />
            ) : (
              <span className="text-2xl font-semibold" style={{ color: "var(--accent)" }}>МШ</span>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-fab)" }}>
            <IconSparkles size={16} />
          </span>
        </div>

        <p className="text-[18px] font-semibold mb-2">Друже, класний результат!</p>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          Ти на крок ближче до того, щоб увійти в зал слави скеларівців.
        </p>
        <p className="text-[15px] leading-relaxed mt-1.5" style={{ color: "var(--ink-2)" }}>
          Продовжуй у тому ж дусі.
        </p>

        <div className="mt-5 flex flex-col items-center">
          <span className="text-[15px] font-semibold">Макс Штепа</span>
          <span className="text-[12px]" style={{ color: "var(--ink-3)" }}>CEO · SKELAR</span>
        </div>
      </div>
    </div>
  );
}
