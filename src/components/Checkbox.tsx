"use client";
import { IconCheck } from "./icons";

export function Checkbox({ checked, onChange, label }:
  { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button aria-label={label} aria-pressed={checked} onClick={onChange}
      className="w-11 h-11 flex items-center justify-center shrink-0 press">
      <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          border: checked ? "none" : "2px solid var(--ink-3)",
          background: checked ? "var(--success)" : "transparent",
        }}>
        {checked && <span className="pop text-white"><IconCheck size={15} strokeWidth={3} /></span>}
      </span>
    </button>
  );
}
