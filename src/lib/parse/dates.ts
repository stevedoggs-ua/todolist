function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeDueDate(value: string | null, today: string): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (ISO.test(v)) return v;
  if (v === "today" || v === "сьогодні") return today;
  if (v === "tomorrow" || v === "завтра") return addDays(today, 1);
  return null;
}
