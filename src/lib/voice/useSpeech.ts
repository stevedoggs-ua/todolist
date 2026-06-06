"use client";
import { useRef, useState, useCallback } from "react";

export function isSpeechSupported(w: Window & typeof globalThis): boolean {
  return typeof (w as any).SpeechRecognition !== "undefined"
      || typeof (w as any).webkitSpeechRecognition !== "undefined";
}

export function useSpeech(onText: (text: string) => void) {
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");

  const start = useCallback(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "uk-UA"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let finalText = ""; let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interimText += r[0].transcript;
      }
      if (finalText) onText(finalText);
      setInterim(interimText);
    };
    rec.onend = () => { setListening(false); setInterim(""); };
    rec.onerror = () => { setListening(false); setInterim(""); };
    recRef.current = rec; rec.start(); setListening(true);
  }, [onText]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  return { listening, interim, start, stop };
}
