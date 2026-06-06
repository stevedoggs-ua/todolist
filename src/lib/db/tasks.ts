import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/types";

type NewTask = Pick<Task, "title" | "priority"> &
  Partial<Pick<Task, "duration_min" | "due_date" | "due_time" | "project_id" | "source">>;

export async function insertTasks(rows: NewTask[]): Promise<Task[]> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const payload = rows.map((r) => ({ ...r, user_id: user.id }));
  const { data, error } = await sb.from("tasks").insert(payload).select("*");
  if (error) throw error;
  return data as Task[];
}

export async function listInbox(): Promise<Task[]> {
  const sb = createClient();
  const { data, error } = await sb.from("tasks")
    .select("*").is("due_date", null).eq("is_done", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Task[];
}

export async function listToday(today: string): Promise<Task[]> {
  const sb = createClient();
  const { data, error } = await sb.from("tasks")
    .select("*").lte("due_date", today)
    .order("is_focus", { ascending: false }).order("priority", { ascending: true });
  if (error) throw error;
  return data as Task[];
}

export async function listUpcoming(today: string): Promise<Task[]> {
  const sb = createClient();
  const { data, error } = await sb.from("tasks")
    .select("*").gt("due_date", today).eq("is_done", false)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return data as Task[];
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function setDone(id: string, done: boolean): Promise<void> {
  await updateTask(id, { is_done: done, completed_at: done ? new Date().toISOString() : null });
}

export async function countFocus(focusDate: string): Promise<number> {
  const sb = createClient();
  const { count } = await sb.from("tasks").select("*", { count: "exact", head: true })
    .eq("is_focus", true).eq("focus_date", focusDate);
  return count ?? 0;
}
