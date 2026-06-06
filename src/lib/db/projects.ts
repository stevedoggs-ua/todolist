import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";

export async function listProjects(): Promise<Project[]> {
  const sb = createClient();
  const { data, error } = await sb.from("projects").select("*").order("is_inbox", { ascending: false });
  if (error) throw error;
  return data as Project[];
}

export async function getInboxProject(): Promise<Project | null> {
  const sb = createClient();
  const { data } = await sb.from("projects").select("*").eq("is_inbox", true).maybeSingle();
  return (data as Project) ?? null;
}
