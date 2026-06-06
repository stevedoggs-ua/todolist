import { IconCheck } from "./icons";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-2xl text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent) 55%, var(--p2)))",
        boxShadow: "var(--shadow-fab)",
      }}>
      <IconCheck size={Math.round(size * 0.56)} strokeWidth={3} />
    </span>
  );
}

export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="font-semibold tracking-tight" style={{ fontSize: size * 0.56 }}>
        Max<span style={{ color: "var(--accent)" }}> Plan</span>
      </span>
    </span>
  );
}
