"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Surface a failed callback (e.g. expired/used magic link) instead of a silent bounce.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("auth_error")) {
      setStatus("error");
      setErrorMsg("Посилання застаріло або вже було використане. Введи email — пришлемо нове.");
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
  const valid = /\S+@\S+\.\S+/.test(email);

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
      {/* warm accent glow */}
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-25"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }} />

      <div className="relative w-full max-w-sm mx-auto flex flex-col gap-8">
        {/* hero */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "var(--surface-2)" }}>🧠</div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight">
              Вивали все з голови
            </h1>
            <p className="text-base" style={{ color: "var(--text-secondary)" }}>
              Голосом або текстом — а AI розкладе на задачі з пріоритетом, часом і датою.
            </p>
          </div>
        </div>

        {/* form / sent state */}
        {status === "sent" ? (
          <div className="flex flex-col items-center text-center gap-4 rounded-2xl p-6"
            style={{ background: "var(--surface)" }}>
            <span className="text-4xl">✉️</span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">Перевір пошту</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Надіслали посилання для входу на <span style={{ color: "var(--text-primary)" }}>{email}</span>.
                Не прийшло за хвилину — глянь у «Спам».
              </p>
            </div>
            <button onClick={() => setStatus("idle")}
              className="text-sm font-medium underline" style={{ color: "var(--accent)" }}>
              Надіслати ще раз
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-3">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="email@приклад.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
              aria-label="Електронна пошта"
              className="h-14 rounded-xl px-4 text-base outline-none transition-colors border-2 focus:border-[var(--accent)]"
              style={{ background: "var(--surface)", borderColor: "var(--surface-2)", color: "var(--text-primary)" }}
            />
            {status === "error" && (
              <p className="text-sm" style={{ color: "var(--danger)" }}>{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={!valid || status === "sending"}
              className="h-14 rounded-xl text-white text-base font-medium transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {status === "sending" ? "Надсилаю…" : "Надіслати магічне посилання"}
            </button>
            <p className="text-[13px] text-center mt-1" style={{ color: "var(--text-tertiary)" }}>
              Введи email — пришлемо посилання, жодних паролів.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
