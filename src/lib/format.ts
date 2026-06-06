const MONTHS = [
  "січ", "лют", "бер", "квіт", "трав", "черв",
  "лип", "серп", "вер", "жовт", "лист", "груд",
];
const WEEKDAYS = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"];

function parse(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(aIso + "T00:00:00Z");
  const b = Date.parse(bIso + "T00:00:00Z");
  return Math.round((a - b) / 86_400_000);
}

/** Compact label for a task chip: «Сьогодні», «Завтра», «пн», «5 черв». */
export function relativeDay(iso: string, today: string): string {
  const diff = daysBetween(iso, today);
  if (diff === 0) return "Сьогодні";
  if (diff === 1) return "Завтра";
  if (diff === -1) return "Вчора";
  const d = parse(iso);
  if (diff > 1 && diff < 7) return WEEKDAYS[d.getDay()];
  if (diff < 0) return "прострочено";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Section header for Upcoming groups. */
export function groupLabel(iso: string, today: string): string {
  const diff = daysBetween(iso, today);
  if (diff === 0) return "Сьогодні";
  if (diff === 1) return "Завтра";
  const d = parse(iso);
  const wd = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"][d.getDay()];
  if (diff > 1 && diff < 7) return wd;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Today's headline date, e.g. «пʼятниця, 6 червня». */
export function todayHeadline(iso: string): string {
  const full = ["неділя", "понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота"];
  const monthsFull = [
    "січня", "лютого", "березня", "квітня", "травня", "червня",
    "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
  ];
  const d = parse(iso);
  const wd = full[d.getDay()];
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${d.getDate()} ${monthsFull[d.getMonth()]}`;
}

export function durationLabel(min: number): string {
  if (min < 60) return `${min} хв`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} год ${m} хв` : `${h} год`;
}
