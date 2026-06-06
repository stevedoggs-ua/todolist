// Demo store: localStorage-backed, no auth/network. Mirrors the Supabase
// data layer so the product is fully interactive without logging in.
// To restore the real backend, `git checkout` the Supabase versions of
// tasks.ts / projects.ts (and re-enable the proxy auth guard).
import type { Task, Project } from "@/lib/types";

const TASKS_KEY = "demo_tasks_v1";
const PROJECTS_KEY = "demo_projects_v1";
const SEEDED_KEY = "demo_seeded_v1";

const INBOX_ID = "00000000-0000-0000-0000-000000000001";
const USER = "demo-user";

function iso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  try { return raw ? (JSON.parse(raw) as T[]) : []; } catch { return []; }
}

function writeRaw<T>(key: string, val: T[]): void {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(val));
}

function task(partial: Partial<Task> & Pick<Task, "title" | "priority">): Task {
  return {
    id: crypto.randomUUID(),
    user_id: USER,
    project_id: INBOX_ID,
    duration_min: null,
    due_date: null,
    due_time: null,
    is_done: false,
    is_focus: false,
    focus_date: null,
    recurrence: null,
    source: "manual",
    created_at: new Date().toISOString(),
    completed_at: null,
    ...partial,
  };
}

function seedIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;

  const projects: Project[] = [
    { id: INBOX_ID, user_id: USER, name: "Inbox", color: "gray", is_inbox: true, created_at: new Date().toISOString() },
    { id: crypto.randomUUID(), user_id: USER, name: "Робота", color: "#2a6fe8", is_inbox: false, created_at: new Date().toISOString() },
  ];

  const tasks: Task[] = [
    task({ title: "Подзвонити стоматологу", priority: 2, duration_min: 15, due_date: iso(0) }),
    task({ title: "Купити продукти на вечерю", priority: 3, duration_min: 30, due_date: iso(0) }),
    task({ title: "Відповісти Анні про дедлайн", priority: 1, duration_min: 10 }),
    task({ title: "Прочитати статтю про есенціалізм", priority: 4 }),
    task({ title: "Зустріч з командою", priority: 2, due_date: iso(1), due_time: "14:00", duration_min: 45 }),
    task({ title: "Підготувати презентацію для клієнта", priority: 1, due_date: iso(3), duration_min: 90 }),
  ];

  writeRaw(PROJECTS_KEY, projects);
  writeRaw(TASKS_KEY, tasks);
  window.localStorage.setItem(SEEDED_KEY, "1");
}

export function getTasks(): Task[] {
  seedIfNeeded();
  return read<Task>(TASKS_KEY);
}

export function saveTasks(tasks: Task[]): void {
  writeRaw(TASKS_KEY, tasks);
}

export function getProjects(): Project[] {
  seedIfNeeded();
  return read<Project>(PROJECTS_KEY);
}
