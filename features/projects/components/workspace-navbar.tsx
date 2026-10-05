"use client";

import { ChevronDown, LogOut, MapPinned } from "lucide-react";
import type { Project } from "../types";
import type { AccountProfile } from "@/features/auth/types";

type WorkspaceNavbarProps = {
  account: AccountProfile;
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  featureCount: number;
  onProjectChange: (projectId: string) => void;
};

const geometryLabels: Record<Project["geometry_type"], string> = { point: "Point", line: "Line", polygon: "Polygon" };

export function WorkspaceNavbar({ account, projects, activeProjectId, activeProject, featureCount, onProjectChange }: WorkspaceNavbarProps) {
  return (
    <header id="workspace-controls" className="absolute inset-x-3 top-3 z-30 sm:inset-x-5 sm:top-5">
      <nav aria-label="Navigasi workspace" className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-[0_5px_16px_rgba(28,27,25,0.12)] backdrop-blur">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e7f1ef] text-[#0f6b5f]" aria-hidden="true"><MapPinned className="size-4" /></span>
          <span className="hidden text-sm font-semibold tracking-tight text-[#1c1b19] sm:inline">Map Editor</span>
          <span className="hidden h-5 border-l border-black/10 sm:block" aria-hidden="true" />
          <label className="sr-only" htmlFor="project-switcher">Project aktif</label>
          <div className="relative min-w-0">
            <select
              id="project-switcher"
              value={activeProjectId ?? ""}
              onChange={(event) => onProjectChange(event.target.value)}
              className="h-9 max-w-40 appearance-none truncate bg-transparent py-1 pl-2 pr-7 text-sm font-semibold text-[#1c1b19] outline-none focus-visible:ring-2 focus-visible:ring-[#0f6b5f] sm:max-w-64"
            >
              <option value="" disabled>Pilih Project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} - {geometryLabels[project.geometry_type]}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#6b6760]" aria-hidden="true" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {activeProject ? <span className="hidden rounded-lg bg-[#f2f1ee] px-2.5 py-1.5 font-mono text-xs text-[#6b6760] md:inline">{geometryLabels[activeProject.geometry_type].toUpperCase()} · {featureCount} FEATURE</span> : null}
          <div className="flex min-w-0 max-w-20 flex-col text-right sm:max-w-44 lg:max-w-60" aria-label="Akun aktif">
            <span className="truncate text-xs font-semibold leading-4 text-[#1c1b19]">{account.name || account.email || "Akun aktif"}</span>
            {account.email ? <span className="truncate text-[10px] leading-4 text-[#6b6760]">{account.email}</span> : null}
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
              <LogOut className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Keluar</span>
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
