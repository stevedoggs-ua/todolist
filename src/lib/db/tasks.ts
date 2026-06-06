// Demo mode: localStorage-backed (no auth). Same signatures as the Supabase
// version so pages don't change. Restore from git history for the real backend.
import type { Task } from "@/lib/types";
import { getTasks, saveTasks } from "./local";

type NewTask = Pick<Task, "title" | "priority"> &
  Partial<Pick<Task, "duration_min" | "due_date" | "due_time" | "project_id" | "source">>;

const INBOX_ID = "00000000-0000-0000-0000-000000000001";

export async function insertTasks(rows: NewTask[]): Promise<Task[]> {
  const now = new Date().toISOString();
  const created: Task[] = rows.map((r) => ({
    id: crypto.randomUUID(),
    user_id: "demo-user",
    project_id: r.project_id ?? INBOX_ID,
    title: r.title,
    priority: r.priority,
    duration_min: r.duration_min ?? null,
    due_date: r.due_date ?? null,
    due_time: r.due_time ?? null,
    is_done: false,
    is_focus: false,
    focus_date: null,
    recurrence: null,
    source: r.source ?? "manual",
    created_at: now,
    completed_at: null,
  }));
  saveTasks([...created, ...getTasks()]);
  return created;
}

export async function listInbox(): Promise<Task[]> {
  return getTasks()
    .filter((t) => !t.due_date && !t.is_done)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listToday(today: string): Promise<Task[]> {
  return getTasks()
    .filter((t) => t.due_date && t.due_date <= today)
    .sort((a, b) => Number(b.is_focus) - Number(a.is_focus) || a.priority - b.priority);
}

export async function listUpcoming(today: string): Promise<Task[]> {
  return getTasks()
    .filter((t) => t.due_date && t.due_date > today && !t.is_done)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  saveTasks(getTasks().map((t) => (t.id === id ? { ...t, ...patch } : t)));
}

export async function deleteTask(id: string): Promise<void> {
  saveTasks(getTasks().filter((t) => t.id !== id));
}

export async function setDone(id: string, done: boolean): Promise<void> {
  await updateTask(id, { is_done: done, completed_at: done ? new Date().toISOString() : null });
}

export async function countFocus(focusDate: string): Promise<number> {
  return getTasks().filter((t) => t.is_focus && t.focus_date === focusDate).length;
}
