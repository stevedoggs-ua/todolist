"use client";
import { useEffect, useState } from "react";
import { recordToday, computeStreak, last7, STREAK_THRESHOLD } from "@/lib/db/activity";

const DOW = ["Н", "П", "В", "С", "Ч", "П", "С"]; // Su..Sa initial

function dowInitial(iso: string): string {
  return DOW[new Date(iso + "T00:00:00Z").getUTCDay()];
}

export function MaxScore({ today, todayPct, hasTasks }:
  { today: string; todayPct: number; hasTasks: boolean }) {
  const [imgOk, setImgOk] = useState(true);
  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState<{ date: string; pct: number; today: boolean }[]>([]);

  useEffect(() => {
    recordToday(today, todayPct, hasTasks);
    setStreak(computeStreak(today));
    setWeek(last7(today));
  }, [today, todayPct, hasTasks]);

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
          <p className="text-[17px] font-semibold leading-tight">
            🔥 {streak} {pluralDays(streak)}
          </p>
        </div>

        {/* today план/факт */}
        <div className="text-right shrink-0">
          <p className="text-[20px] font-semibold leading-none"
            style={{ color: todayPct >= STREAK_THRESHOLD ? "var(--success)" : "var(--accent)" }}>{todayPct}%</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-3)" }}>сьогодні</p>
        </div>
      </div>

      {/* last 7 days */}
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

function pluralDays(n: number): string {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день поспіль";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дні поспіль";
  return "днів поспіль";
}
