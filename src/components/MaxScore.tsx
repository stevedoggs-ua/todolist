"use client";
import { useEffect, useState } from "react";
import { recordToday, last7, STREAK_THRESHOLD } from "@/lib/db/activity";

const DOW = ["Н", "П", "В", "С", "Ч", "П", "С"]; // Su..Sa initial

function dowInitial(iso: string): string {
  return DOW[new Date(iso + "T00:00:00Z").getUTCDay()];
}

export function MaxScore({ today, done, total }: { today: string; done: number; total: number }) {
  const [imgOk, setImgOk] = useState(true);
  const [week, setWeek] = useState<{ date: string; pct: number; today: boolean }[]>([]);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = pct >= STREAK_THRESHOLD ? "var(--success)" : pct > 0 ? "var(--accent)" : "var(--ink-3)";

  useEffect(() => {
    recordToday(today, pct, total > 0);
    setWeek(last7(today));
  }, [today, pct, total]);

  return (
    <div className="rounded-2xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-3">
        {/* Max photo as the icon */}
        <div className="relative w-11 h-11 rounded-full p-[2px] shrink-0"
          style={{ background: "linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent) 50%, var(--p2)))" }}>
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            {imgOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/ceo.jpg" alt="Max" className="w-full h-full object-cover" onError={() => setImgOk(false)} />
            ) : <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>МШ</span>}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>Max Score</p>
          <p className="text-[14px]" style={{ color: "var(--ink-2)" }}>{done} з {total} задач закрито</p>
        </div>

        {/* productivity rating % — the hero number */}
        <div className="text-right shrink-0">
          <p className="text-[28px] font-semibold leading-none" style={{ color }}>{pct}%</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--ink-3)" }}>продуктивність</p>
        </div>
      </div>

      {/* % progress bar */}
      <div className="h-2 rounded-full overflow-hidden mt-3.5" style={{ background: "var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>

      {/* 7-day % trend */}
      <div className="flex items-end justify-between gap-1.5 mt-4 h-12">
        {week.map((d) => {
          const qualified = d.pct >= STREAK_THRESHOLD;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-md flex items-end overflow-hidden" style={{ height: 32, background: "var(--surface-2)" }}>
                <div className="w-full rounded-md transition-all"
                  style={{
                    height: `${Math.max(d.pct, 4)}%`,
                    background: d.today ? "var(--accent)" : qualified ? "color-mix(in srgb, var(--accent) 55%, transparent)" : "var(--ink-3)",
                    opacity: d.pct === 0 && !d.today ? 0.35 : 1,
                  }} />
              </div>
              <span className="text-[10px]" style={{ color: d.today ? "var(--accent)" : "var(--ink-3)", fontWeight: d.today ? 600 : 400 }}>
                {dowInitial(d.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
