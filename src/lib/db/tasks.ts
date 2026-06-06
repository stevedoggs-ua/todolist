// Demo mode: localStorage-backed (no auth). Same signatures as the Supabase
// version so pages don't change. Restore from git history for the real backend.
import type { Task } from "@/lib/types";
import { getTasks, saveTasks } from "./local";
import { addMinutes } from "@/lib/format";

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
    sort_order: null,
    recurrence: null,
    source: r.source ?? "manual",
    created_at: now,
    completed_at: null,
  }));
  saveTasks([...created, ...getTasks()]);
  return created;
}

const ord = (t: Task) => t.sort_order ?? 1e9;

export async function listInbox(): Promise<Task[]> {
  return getTasks()
    .filter((t) => !t.due_date && !t.is_done)
    .sort((a, b) => ord(a) - ord(b) || b.created_at.localeCompare(a.created_at));
}

export async function listToday(today: string): Promise<Task[]> {
  return getTasks()
    .filter((t) => t.due_date && t.due_date <= today)
    .sort((a, b) => ord(a) - ord(b) || a.priority - b.priority);
}

export async function listUpcoming(today: string): Promise<Task[]> {
  return getTasks()
    .filter((t) => t.due_date && t.due_date > today && !t.is_done)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "") || ord(a) - ord(b));
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

/** Persist a manual order: writes sort_order = index for the given ids. */
export async function saveOrder(orderedIds: string[]): Promise<void> {
  const pos = new Map(orderedIds.map((id, i) => [id, i]));
  saveTasks(getTasks().map((t) => (pos.has(t.id) ? { ...t, sort_order: pos.get(t.id)! } : t)));
}

/** Re-pack timeline: keep the earliest start, lay the given tasks back-to-back. */
export async function repackTimeline(orderedIds: string[]): Promise<void> {
  const all = getTasks();
  const byId = new Map(all.map((t) => [t.id, t]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((t): t is Task => !!t && !!t.due_time);
  if (!ordered.length) return;
  let cur = ordered.map((t) => t.due_time as string).sort()[0];
  const patch = new Map<string, string>();
  for (const t of ordered) { patch.set(t.id, cur); cur = addMinutes(cur, t.duration_min ?? 30); }
  saveTasks(all.map((t) => (patch.has(t.id) ? { ...t, due_time: patch.get(t.id)! } : t)));
}

export async function openCountByProject(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const t of getTasks()) {
    if (t.is_done || !t.project_id) continue;
    counts[t.project_id] = (counts[t.project_id] ?? 0) + 1;
  }
  return counts;
}
