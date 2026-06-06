"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { insertTasks } from "@/lib/db/tasks";
import type { Priority } from "@/lib/types";
import { track } from "@/lib/analytics";
import { useSpeech, isSpeechSupported } from "@/lib/voice/useSpeech";
import { MicButton } from "@/components/MicButton";
import { IconSparkles } from "@/components/icons";

function todayIso() { return new Date().toISOString().slice(0, 10); }

// Demo fallback when the AI route isn't available (no auth / no API key):
// split a brain-dump into atomic tasks by lines and separators.
function localSplit(text: string) {
  return text
    .split(/[\n,;]+|\s+(?:і|та)\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .map((title) => ({ title, priority: 4 as const }));
}

export default function CapturePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(isSpeechSupported(window)); }, []);
  const { listening, interim, start, stop } =
    useSpeech((t) => setText((cur) => (cur ? cur + " " : "") + t));

  const submit = async (source: "text" | "voice") => {
    if (text.trim().length < 3) { setError("Напиши трохи більше 🙂"); return; }
    setLoading(true); setError("");
    track("capture_started", { source });
    try {
      let tasks: { title: string; priority: Priority; duration_min?: number | null; due_date?: string | null; due_time?: string | null }[] | null = null;
      try {
        const res = await fetch("/api/parse", { method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, today: todayIso(), source }) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tasks) && data.tasks.length) tasks = data.tasks;
        }
      } catch { /* fall through to local split */ }

      if (!tasks) tasks = localSplit(text);
      await insertTasks(tasks.map((t) => ({ ...t, source })));
      track("parse_succeeded", { count: tasks.length });
      router.push("/inbox");
    } catch {
      setError("Щось пішло не так. Спробуй ще раз.");
    } finally { setLoading(false); }
  };

  const value = listening && interim ? (text ? text + " " : "") + interim : text;

  return (
    <main className="pt-12 flex flex-col min-h-[88vh]">
      <header className="mb-4">
        <h1 className="text-[30px] font-semibold tracking-tight leading-none">Що в голові?</h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--ink-3)" }}>
          Пиши потоком — AI розкладе на задачі.
        </p>
      </header>

      <textarea
        value={value}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
        placeholder="напр.: написати Анні, доробити презу, забукати зал, дзвінок о 15…"
        className="flex-1 min-h-44 rounded-2xl p-4 text-[16px] leading-relaxed resize-none outline-none border-2 transition-colors focus:border-[var(--accent)]"
        style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)", boxShadow: "var(--shadow-card)" }} />

      {error && <p className="text-sm mt-2" style={{ color: "var(--danger)" }}>{error}</p>}

      {supported && (
        <div className="flex flex-col items-center gap-2 my-5">
          <MicButton listening={listening} supported={supported} onStart={start} onStop={stop} />
          <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>
            {listening ? "Слухаю… говори" : "або продиктуй голосом"}
          </span>
        </div>
      )}

      <button onClick={() => submit(listening ? "voice" : "text")} disabled={loading || text.trim().length < 3}
        className="mt-auto h-14 rounded-2xl text-white text-[16px] font-semibold flex items-center justify-center gap-2 press transition-opacity disabled:opacity-40"
        style={{ background: "var(--accent)", boxShadow: text.trim().length >= 3 ? "var(--shadow-fab)" : "none" }}>
        <IconSparkles size={20} />
        {loading ? "Розбираю…" : "Розкласти на задачі"}
      </button>
    </main>
  );
}
