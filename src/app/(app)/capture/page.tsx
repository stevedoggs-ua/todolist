"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { insertTasks } from "@/lib/db/tasks";
import type { Priority } from "@/lib/types";
import { track } from "@/lib/analytics";
import { useSpeech, isSpeechSupported } from "@/lib/voice/useSpeech";
import { MicButton } from "@/components/MicButton";

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

  return (
    <main className="pt-8 flex flex-col gap-4 min-h-[70vh]">
      <h1 className="text-2xl font-semibold">Що в голові?</h1>
      <textarea value={listening && interim ? text + " " + interim : text}
        onChange={(e) => setText(e.target.value)} disabled={loading}
        placeholder="напр.: написати Анні, доробити презу, дзвінок о 15…"
        className="flex-1 min-h-48 rounded-xl border p-4 text-base resize-none"
        style={{ background: "var(--surface)" }} />
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <MicButton listening={listening} supported={supported} onStart={start} onStop={stop} />
      <button onClick={() => submit(listening ? "voice" : "text")} disabled={loading}
        className="h-14 rounded-xl text-white text-base font-medium disabled:opacity-50"
        style={{ background: "var(--accent)" }}>
        {loading ? "Розбираю…" : "Розкласти на задачі"}
      </button>
    </main>
  );
}
