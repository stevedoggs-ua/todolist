import type { Priority } from "@/lib/types";
const COLOR: Record<Priority, string> = { 1: "var(--p1)", 2: "var(--p2)", 3: "var(--p3)", 4: "var(--p4)" };
export function PriorityDot({ priority }: { priority: Priority }) {
  return <span role="img" aria-label={`Пріоритет ${priority}`}
    style={{ background: COLOR[priority] }}
    className="inline-block w-3 h-3 rounded-full shrink-0" />;
}
