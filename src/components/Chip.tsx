export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] px-2 py-0.5 rounded-lg"
    style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>{children}</span>;
}
