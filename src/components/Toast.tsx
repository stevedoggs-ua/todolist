"use client";
export function Toast({ message, action, onAction }:
  { message: string; action?: string; onAction?: () => void }) {
  return (
    <div role="status"
      className="scale-in fixed left-4 right-4 bottom-28 z-50 mx-auto max-w-sm rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
      style={{ background: "var(--ink)", color: "var(--bg)", boxShadow: "var(--shadow-pop)" }}>
      <span className="text-sm leading-snug">{message}</span>
      {action && (
        <button onClick={onAction} className="text-sm font-semibold shrink-0" style={{ color: "var(--accent)" }}>
          {action}
        </button>
      )}
    </div>
  );
}
