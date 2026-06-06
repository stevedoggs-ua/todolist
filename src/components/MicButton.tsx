"use client";
import { IconMic, IconStop } from "./icons";

export function MicButton({ listening, onStart, onStop, supported }:
  { listening: boolean; onStart: () => void; onStop: () => void; supported: boolean }) {
  if (!supported) return null;
  return (
    <div className="relative flex items-center justify-center self-center">
      {listening && (
        <span className="absolute w-[84px] h-[84px] rounded-full animate-ping"
          style={{ background: "var(--accent-weak)" }} />
      )}
      <button
        aria-label={listening ? "Зупинити запис" : "Записати голосом"}
        onClick={listening ? onStop : onStart}
        className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center text-white press"
        style={{ background: "var(--accent)", boxShadow: "var(--shadow-fab)" }}>
        {listening ? <IconStop size={26} /> : <IconMic size={28} />}
      </button>
    </div>
  );
}
