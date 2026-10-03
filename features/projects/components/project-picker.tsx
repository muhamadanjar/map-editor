import { ChevronRight, Layers3, MapPin, Plus } from "lucide-react";
import type { Project } from "../types";

type ProjectPickerProps = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (projectId: string) => void;
  onCreate: () => void;
};

const geometryLabel: Record<Project["geometry_type"], string> = {
  point: "Point",
  line: "Line",
  polygon: "Polygon",
};

export function ProjectPicker({ projects, loading, error, onRetry, onSelect, onCreate }: ProjectPickerProps) {
  return (
    <section
      aria-labelledby="project-picker-title"
      className="w-[min(92vw,34rem)] rounded-2xl border border-black/10 bg-white/95 p-4 shadow-[0_18px_50px_rgba(28,27,25,0.18)] backdrop-blur"
    >
      <div className="mb-4 flex items-start gap-3 border-b border-black/10 pb-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f1ef] text-[#0f6b5f]" aria-hidden="true">
          <MapPin className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#6b6760]">Map editor</p>
          <h1 id="project-picker-title" className="mt-0.5 text-xl font-semibold tracking-tight text-[#1c1b19]">
            Pilih Project untuk mulai
          </h1>
          <p className="mt-1 text-sm leading-5 text-[#6b6760]">Geometry dan form input mengikuti Project yang Anda pilih.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="mb-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#0f6b5f]/30 bg-[#f2f7f6] px-4 text-sm font-semibold text-[#0f6b5f] transition hover:bg-[#e7f1ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
      >
        <Plus className="size-4" aria-hidden="true" /> Project baru
      </button>

      {loading ? <p className="py-6 text-center text-sm text-[#6b6760]">Memuat daftar Project…</p> : null}

      {error ? (
        <div className="rounded-xl border border-[#c0392b]/25 bg-[#fff6f5] p-3" role="alert">
          <p className="text-sm text-[#8f2d23]">{error}</p>
          <button type="button" onClick={onRetry} className="mt-2 text-sm font-semibold text-[#0f6b5f] underline underline-offset-4">
            Coba lagi
          </button>
        </div>
      ) : null}

      {!loading && !error && projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 bg-[#fbfbfa] px-4 py-7 text-center">
          <Layers3 className="mx-auto size-5 text-[#9c9890]" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-[#1c1b19]">Belum ada Project</p>
          <p className="mt-1 text-sm text-[#6b6760]">Buat project baru untuk mulai mengumpulkan data.</p>
        </div>
      ) : null}

      {!loading && !error && projects.length > 0 ? (
        <ul className="max-h-[min(52dvh,24rem)] space-y-2 overflow-y-auto pr-1" aria-label="Daftar Project">
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => onSelect(project.id)}
                className="group flex w-full items-center gap-3 rounded-xl border border-black/10 bg-[#fbfbfa] px-3 py-3 text-left transition hover:border-[#0f6b5f]/35 hover:bg-[#f2f7f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
              >
                <span className="font-mono text-xs text-[#0f6b5f]">{geometryLabel[project.geometry_type]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#1c1b19]">{project.name}</span>
                  <span className="mt-0.5 block text-xs text-[#6b6760]">{project.feature_count} Feature tersimpan</span>
                </span>
                <ChevronRight className="size-4 text-[#9c9890] transition group-hover:translate-x-0.5 group-hover:text-[#0f6b5f]" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
