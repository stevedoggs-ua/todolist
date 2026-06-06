"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  const google = () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  const magic = async () => {
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setSent(true);
  };

  return (
    <main className="min-h-screen flex flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Вивали все з голови</h1>
      <button onClick={google}
        className="h-14 rounded-xl bg-black text-white text-base font-medium">
        Увійти через Google
      </button>
      <div className="flex flex-col gap-3">
        <input type="email" inputMode="email" placeholder="email@приклад.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="h-14 rounded-xl border px-4 text-base" />
        <button onClick={magic} disabled={!email}
          className="h-14 rounded-xl border text-base font-medium disabled:opacity-40">
          Надіслати магічне посилання
        </button>
        {sent && <p className="text-sm text-green-600">Перевір пошту — там посилання для входу.</p>}
      </div>
    </main>
  );
}
