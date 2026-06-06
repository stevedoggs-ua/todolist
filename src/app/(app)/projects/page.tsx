"use client";
import { useEffect, useState } from "react";
import { listProjects } from "@/lib/db/projects";
import { openCountByProject } from "@/lib/db/tasks";
import { Skeleton } from "@/components/Skeleton";
import { IconInbox, IconFolder, IconChevronRight } from "@/components/icons";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    listProjects().then(setProjects).catch(() => setProjects([]));
    openCountByProject().then(setCounts).catch(() => {});
  }, []);

  return (
    <main className="pt-12">
      <header className="mb-6">
        <h1 className="text-[30px] font-semibold tracking-tight leading-none">Проєкти</h1>
        <p className="mt-1.5 text-[15px]" style={{ color: "var(--ink-3)" }}>Куди складати задачі</p>
      </header>

      {projects === null ? (
        <div>{[0, 1].map((i) => <Skeleton key={i} className="h-[60px]" />)}</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {projects.map((p, i) => (
            <div key={p.id} className="rise flex items-center gap-3 rounded-2xl px-4 py-3.5 border press"
              style={{ animationDelay: `${i * 45}ms`, background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-card)" }}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: p.is_inbox ? "var(--surface-2)" : `color-mix(in srgb, ${p.color} 22%, transparent)`, color: p.is_inbox ? "var(--ink-2)" : p.color }}>
                {p.is_inbox ? <IconInbox size={18} /> : <IconFolder size={18} />}
              </span>
              <span className="flex-1 text-[15px] font-medium">{p.name}</span>
              {counts[p.id] ? (
                <span className="text-[13px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>{counts[p.id]}</span>
              ) : null}
              <span style={{ color: "var(--ink-3)" }}><IconChevronRight size={18} /></span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
