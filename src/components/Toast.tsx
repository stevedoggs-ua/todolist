"use client";
export function Toast({ message, action, onAction }:
  { message: string; action?: string; onAction?: () => void }) {
  return (
    <div role="status" className="fixed left-4 right-4 bottom-24 z-50 rounded-xl px-4 py-3 flex items-center justify-between"
      style={{ background: "var(--text-primary)", color: "var(--bg)" }}>
      <span className="text-sm">{message}</span>
      {action && <button onClick={onAction} className="text-sm font-medium underline">{action}</button>}
    </div>
  );
}
