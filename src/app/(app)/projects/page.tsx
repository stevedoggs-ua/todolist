"use client";
import { useEffect, useState } from "react";
import { listProjects } from "@/lib/db/projects";
import { Skeleton } from "@/components/Skeleton";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => { listProjects().then(setProjects).catch(() => setProjects([])); }, []);

  if (projects === null) return <div className="pt-8">{[0,1].map((i) => <Skeleton key={i} />)}</div>;

  return (
    <main className="pt-8">
      <h1 className="text-2xl font-semibold mb-4">Projects</h1>
      {projects.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "var(--surface)" }}>
          <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
          <span className="text-base">{p.name}</span>
        </div>
      ))}
    </main>
  );
}
