// Demo activity store (localStorage): per-day completion % (план/факт) used by
// the Max Score streak widget. Seeded with a short history so the streak feels
// alive in the demo.
const KEY = "demo_activity_v1";
const SEEDED = "demo_activity_seeded_v1";
const THRESHOLD = 60; // a day "qualifies" for the streak at >= this completion %

type Activity = Record<string, number>; // ISO date -> percent (0..100)

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function read(): Activity {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) || "{}") as Activity; }
  catch { return {}; }
}
function write(a: Activity): void {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(a));
}

function seedIfNeeded(today: string): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEEDED)) return;
  const history: Activity = {
    [addDays(today, -1)]: 100,
    [addDays(today, -2)]: 75,
    [addDays(today, -3)]: 100,
    [addDays(today, -4)]: 67,
    [addDays(today, -5)]: 100,
    [addDays(today, -6)]: 80,
  };
  write({ ...history, ...read() });
  window.localStorage.setItem(SEEDED, "1");
}

/** Record today's completion %. Skipped when there's nothing planned. */
export function recordToday(today: string, pct: number, hasTasks: boolean): void {
  seedIfNeeded(today);
  if (!hasTasks) return;
  const a = read();
  a[today] = pct;
  write(a);
}

/** Consecutive qualifying days. Today counts once it qualifies; until then the
 *  streak is measured from yesterday so an in-progress day doesn't look broken. */
export function computeStreak(today: string): number {
  const a = read();
  let cursor = (a[today] ?? 0) >= THRESHOLD ? today : addDays(today, -1);
  let streak = 0;
  while ((a[cursor] ?? 0) >= THRESHOLD) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Last 7 days (oldest → today) with completion %. */
export function last7(today: string): { date: string; pct: number; today: boolean }[] {
  const a = read();
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, -(6 - i));
    return { date, pct: a[date] ?? 0, today: date === today };
  });
}

export const STREAK_THRESHOLD = THRESHOLD;
