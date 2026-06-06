import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...p }: Props & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden {...p}>
      {children}
    </svg>
  );
}

export const IconSun = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Svg>
);

export const IconCalendar = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="17" rx="3" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </Svg>
);

export const IconInbox = (p: Props) => (
  <Svg {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </Svg>
);

export const IconFolder = (p: Props) => (
  <Svg {...p}>
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </Svg>
);

export const IconPlus = (p: Props) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);

export const IconStar = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.3l-5.8 3.06 1.11-6.46-4.7-4.58 6.49-.94z" />
  </Svg>
);

export const IconStarFilled = ({ size = 24, ...p }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.3l-5.8 3.06 1.11-6.46-4.7-4.58 6.49-.94z" />
  </svg>
);

export const IconCheck = (p: Props) => (
  <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>
);

export const IconTrash = (p: Props) => (
  <Svg {...p}>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

export const IconMic = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
  </Svg>
);

export const IconStop = ({ size = 24, ...p }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <rect x="6" y="6" width="12" height="12" rx="3" />
  </svg>
);

export const IconClock = (p: Props) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);

export const IconChevronRight = (p: Props) => (
  <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
);

export const IconSparkles = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
    <path d="M19 14l.7 1.9L21.5 16l-1.8.7L19 18.5l-.7-1.8L16.5 16l1.8-.6z" />
  </Svg>
);

export const IconArrowRight = (p: Props) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
);

export const IconFlag = (p: Props) => (
  <Svg {...p}><path d="M4 22V4M4 4h11l-1.5 4L15 12H4" /></Svg>
);
