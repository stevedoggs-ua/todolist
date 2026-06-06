import type { Priority } from "@/lib/types";

const COLOR: Record<Priority, string> = {
  1: "var(--p1)", 2: "var(--p2)", 3: "var(--p3)", 4: "var(--p4)",
};

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span role="img" aria-label={`Пріоритет ${priority}`}
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: COLOR[priority] }} />
  );
}
