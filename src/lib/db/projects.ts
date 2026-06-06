// Demo mode: localStorage-backed (no auth). Restore from git for the real backend.
import type { Project } from "@/lib/types";
import { getProjects } from "./local";

export async function listProjects(): Promise<Project[]> {
  return getProjects().sort((a, b) => Number(b.is_inbox) - Number(a.is_inbox));
}

export async function getInboxProject(): Promise<Project | null> {
  return getProjects().find((p) => p.is_inbox) ?? null;
}
