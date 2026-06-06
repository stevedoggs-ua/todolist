"use client";
export function MicButton({ listening, onStart, onStop, supported }:
  { listening: boolean; onStart: () => void; onStop: () => void; supported: boolean }) {
  if (!supported) return null;
  return (
    <button aria-label={listening ? "Зупинити запис" : "Записати голосом"}
      onClick={listening ? onStop : onStart}
      className="w-[72px] h-[72px] rounded-full mx-auto flex items-center justify-center text-3xl text-white"
      style={{ background: listening ? "var(--danger)" : "var(--accent)" }}>
      {listening ? "■" : "🎤"}
    </button>
  );
}
