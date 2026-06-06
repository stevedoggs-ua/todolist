export function Checkbox({ checked, onChange, label }:
  { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button aria-label={label} aria-pressed={checked} onClick={onChange}
      className="w-12 h-12 flex items-center justify-center shrink-0">
      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
        style={{ borderColor: checked ? "var(--success)" : "var(--text-tertiary)",
                 background: checked ? "var(--success)" : "transparent" }}>
        {checked && <span className="text-white text-sm">✓</span>}
      </span>
    </button>
  );
}
