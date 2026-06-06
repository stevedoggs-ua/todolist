"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSun, IconCalendar, IconInbox, IconFolder, IconPlus } from "./icons";

type Tab = { href: string; label: string; Icon: (p: { size?: number }) => React.ReactNode };

const LEFT: Tab[] = [
  { href: "/today", label: "Сьогодні", Icon: IconSun },
  { href: "/upcoming", label: "Згодом", Icon: IconCalendar },
];
const RIGHT: Tab[] = [
  { href: "/inbox", label: "Inbox", Icon: IconInbox },
  { href: "/projects", label: "Проєкти", Icon: IconFolder },
];

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const { Icon, label, href } = tab;
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className="flex flex-col items-center justify-center gap-1 h-full press"
      style={{ color: active ? "var(--accent)" : "var(--ink-3)" }}>
      <Icon size={23} />
      <span className="text-[10.5px] font-medium leading-none">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 pointer-events-none">
      <div className="pointer-events-auto relative w-full max-w-sm h-16 grid grid-cols-5 items-center rounded-[26px] border backdrop-blur-xl"
        style={{ background: "var(--nav-bg)", borderColor: "var(--line)", boxShadow: "var(--shadow-pop)" }}>
        {LEFT.map((t) => <TabLink key={t.href} tab={t} active={path === t.href} />)}

        <div className="flex items-center justify-center">
          <Link href="/capture" aria-label="Capture — записати думки"
            aria-current={path === "/capture" ? "page" : undefined}
            className="w-14 h-14 -mt-6 rounded-full flex items-center justify-center text-white press"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-fab)" }}>
            <IconPlus size={26} strokeWidth={2.5} />
          </Link>
        </div>

        {RIGHT.map((t) => <TabLink key={t.href} tab={t} active={path === t.href} />)}
      </div>
    </nav>
  );
}
