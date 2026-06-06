type Tone = "default" | "accent" | "danger" | "success";

const TONE: Record<Tone, { bg: string; fg: string }> = {
  default: { bg: "var(--surface-2)", fg: "var(--ink-2)" },
  accent: { bg: "var(--accent-weak)", fg: "var(--accent)" },
  danger: { bg: "color-mix(in srgb, var(--danger) 14%, transparent)", fg: "var(--danger)" },
  success: { bg: "color-mix(in srgb, var(--success) 16%, transparent)", fg: "var(--success)" },
};

export function Chip({ children, icon, tone = "default" }:
  { children: React.ReactNode; icon?: React.ReactNode; tone?: Tone }) {
  const t = TONE[tone];
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: t.bg, color: t.fg }}>
      {icon}
      {children}
    </span>
  );
}
