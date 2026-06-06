"use client";
import { useRef, useState, useCallback, useEffect } from "react";

export function isSpeechSupported(w: Window & typeof globalThis): boolean {
  return typeof (w as any).SpeechRecognition !== "undefined"
      || typeof (w as any).webkitSpeechRecognition !== "undefined";
}

export function useSpeech(onText: (text: string) => void) {
  const recRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const onTextRef = useRef(onText);
  useEffect(() => { onTextRef.current = onText; }, [onText]);

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");

  const start = useCallback(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    shouldListenRef.current = true;
    const rec = new Ctor();
    rec.lang = "uk-UA";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText.trim()) onTextRef.current(finalText.trim());
      setInterim(interimText);
    };

    rec.onerror = (e: any) => {
      // Permission/service errors are terminal — stop for good.
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        shouldListenRef.current = false;
        setListening(false);
        setInterim("");
      }
      // Transient errors (no-speech, network, aborted) fall through to onend,
      // which restarts recognition while the user is still recording.
    };

    // The Web Speech API stops on its own after a pause/silence even with
    // continuous=true. Auto-restart so a long brain-dump with pauses between
    // tasks keeps being captured (not just the first phrase).
    rec.onend = () => {
      setInterim("");
      if (shouldListenRef.current) {
        try { rec.start(); } catch { /* already starting; ignore */ }
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { /* ignore double start */ }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
    setInterim("");
  }, []);

  // Stop cleanly if the component unmounts mid-recording.
  useEffect(() => () => {
    shouldListenRef.current = false;
    try { recRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  return { listening, interim, start, stop };
}
