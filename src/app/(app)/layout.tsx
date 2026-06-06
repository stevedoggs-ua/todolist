"use client";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding } from "@/components/Onboarding";
import { createClient } from "@/lib/supabase/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setShowOnboarding(false); return; }
      const { data } = await sb.from("profiles").select("onboarding_done").eq("id", user.id).maybeSingle();
      setShowOnboarding(!(data?.onboarding_done));
    });
  }, []);
  return (
    <div className="min-h-screen pb-20">
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <div className="max-w-md mx-auto px-4">{children}</div>
      <BottomNav />
    </div>
  );
}
