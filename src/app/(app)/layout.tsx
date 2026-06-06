"use client";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding } from "@/components/Onboarding";

const ONBOARDING_KEY = "demo_onboarding_done_v1";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    setShowOnboarding(!window.localStorage.getItem(ONBOARDING_KEY));
  }, []);
  const dismiss = () => {
    window.localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  };
  return (
    <div className="min-h-screen">
      {showOnboarding && <Onboarding onDone={dismiss} />}
      <div className="max-w-md mx-auto px-5 pb-32">{children}</div>
      <BottomNav />
    </div>
  );
}
