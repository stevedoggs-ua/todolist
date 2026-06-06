"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/capture", label: "Capture", icon: "＋" },
  { href: "/today", label: "Today", icon: "◷" },
  { href: "/upcoming", label: "Upcoming", icon: "▦" },
  { href: "/inbox", label: "Inbox", icon: "▤" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t flex justify-around pb-[env(safe-area-inset-bottom)]"
      style={{ background: "var(--bg)" }}>
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}
            className="flex flex-col items-center gap-0.5 py-2 w-16 min-h-12"
            style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}>
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-[11px]">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
