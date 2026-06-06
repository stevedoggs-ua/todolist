"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconArrowRight } from "@/components/icons";
import { Logo } from "@/components/Logo";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
  const valid = /\S+@\S+\.\S+/.test(email);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("auth_error")) {
      setStatus("error");
      setErrorMsg("Посилання застаріло або вже було використане. Введи email — пришлемо нове.");
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message || "Не вдалося надіслати. Спробуй ще раз.");
    } else {
      setStatus("sent");
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-center px-6 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[440px] h-[440px] rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }} />

      <div className="relative w-full max-w-sm mx-auto flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-5">
          <Logo size={44} />
          <div className="flex flex-col gap-2.5">
            <h1 className="text-[28px] leading-[1.1] font-semibold tracking-tight">Вивали все з голови</h1>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              Голосом або текстом — а AI розкладе на задачі з пріоритетом, часом і датою.
            </p>
          </div>
        </div>

        {status === "sent" ? (
          <div className="scale-in flex flex-col items-center text-center gap-4 rounded-2xl p-6 border"
            style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-card)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--accent-weak)", color: "var(--accent)" }}>
              <IconArrowRight size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[16px] font-semibold">Перевір пошту</p>
              <p className="text-[14px]" style={{ color: "var(--ink-2)" }}>
                Надіслали посилання на <span style={{ color: "var(--ink)" }}>{email}</span>.
                Не прийшло за хвилину — глянь у «Спам».
              </p>
            </div>
            <button onClick={() => setStatus("idle")} className="text-[14px] font-semibold press" style={{ color: "var(--accent)" }}>
              Надіслати ще раз
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-3">
            <input
              type="email" inputMode="email" autoComplete="email"
              placeholder="email@приклад.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
              aria-label="Електронна пошта"
              className="h-14 rounded-2xl px-4 text-[16px] outline-none transition-colors border-2 focus:border-[var(--accent)]"
              style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)" }} />
            {status === "error" && <p className="text-sm" style={{ color: "var(--danger)" }}>{errorMsg}</p>}
            <button type="submit" disabled={!valid || status === "sending"}
              className="h-14 rounded-2xl text-white text-[16px] font-semibold flex items-center justify-center gap-2 press transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", boxShadow: valid ? "var(--shadow-fab)" : "none" }}>
              {status === "sending" ? "Надсилаю…" : "Надіслати магічне посилання"}
            </button>
            <p className="text-[13px] text-center mt-1" style={{ color: "var(--ink-3)" }}>
              Введи email — пришлемо посилання, жодних паролів.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
