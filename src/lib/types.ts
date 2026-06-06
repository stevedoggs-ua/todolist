export type Priority = 1 | 2 | 3 | 4;
export type TaskSource = "voice" | "text" | "manual";

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  priority: Priority;
  duration_min: number | null;
  due_date: string | null;   // ISO yyyy-mm-dd
  due_time: string | null;   // HH:mm
  is_done: boolean;
  is_focus: boolean;
  focus_date: string | null; // ISO yyyy-mm-dd
  sort_order: number | null; // manual ordering within a list
  recurrence: string | null;
  source: TaskSource;
  created_at: string;
  completed_at: string | null;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_inbox: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  onboarding_done: boolean;
  timezone: string;
  created_at: string;
}
