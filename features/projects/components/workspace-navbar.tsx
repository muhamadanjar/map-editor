"use client";

import { ChevronDown, LogIn, MapPinned } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Project } from "../types";

type WorkspaceNavbarProps = {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  featureCount: number;
  onProjectChange: (projectId: string) => void;
  onLoginUnavailable: () => void;
};

const geometryLabels: Record<Project["geometry_type"], string> = { point: "Point", line: "Line", polygon: "Polygon" };

export function WorkspaceNavbar({ projects, activeProjectId, activeProject, featureCount, onProjectChange, onLoginUnavailable }: WorkspaceNavbarProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("Layanan autentikasi belum dikonfigurasi untuk Map Editor.");
    onLoginUnavailable();
  };

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
          <Dialog onOpenChange={(open) => { if (!open) setFeedback(null); }}>
            <DialogTrigger asChild>
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0f6b5f] px-3 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-[#0a5049] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
                <LogIn className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Masuk</span>
              </button>
            </DialogTrigger>
            <DialogContent className="gap-5 rounded-2xl border-black/10 bg-white p-5 text-[#1c1b19] shadow-[0_18px_50px_rgba(28,27,25,0.24)] sm:max-w-md">
              <DialogHeader className="text-left">
                <DialogTitle>Masuk ke Map Editor</DialogTitle>
                <DialogDescription className="leading-5 text-[#6b6760]">Gunakan akun organisasi Anda untuk mengelola data Project.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-4" onSubmit={submitLogin}>
                <div className="grid gap-2">
                  <label htmlFor="login-email" className="text-sm font-semibold text-[#1c1b19]">Email</label>
                  <input id="login-email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required className="min-h-11 rounded-xl border border-black/15 bg-[#fbfbfa] px-3 text-base text-[#1c1b19] outline-none placeholder:text-[#9c9890] focus:border-[#0f6b5f] focus:ring-2 focus:ring-[#0f6b5f]/25" placeholder="nama@organisasi.id" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="login-password" className="text-sm font-semibold text-[#1c1b19]">Kata sandi</label>
                  <input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="min-h-11 rounded-xl border border-black/15 bg-[#fbfbfa] px-3 text-base text-[#1c1b19] outline-none placeholder:text-[#9c9890] focus:border-[#0f6b5f] focus:ring-2 focus:ring-[#0f6b5f]/25" placeholder="Masukkan kata sandi" />
                </div>
                {feedback ? <p role="status" className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm leading-5 text-[#8f2d23]">{feedback}</p> : null}
                <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0f6b5f] px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-[#0a5049] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">Masuk</button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </nav>
    </header>
  );
}
