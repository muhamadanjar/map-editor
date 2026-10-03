import { useState } from "react";
import Button from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Crosshair, Table2 } from "lucide-react";
import type { Project, ProjectFeature } from "../types";

const PAGE_SIZE = 10;

type FeatureTableProps = {
  project: Project;
  features: ProjectFeature[];
  loading: boolean;
  error: string | null;
  collapsed: boolean;
  onRetry: () => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onFeatureSelect: (feature: ProjectFeature) => void;
  selectedFeatureIds: string[];
  onFeatureToggle: (feature: ProjectFeature) => void;
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function FeatureTable({ project, features, loading, error, collapsed, onRetry, onCollapsedChange, onFeatureSelect, selectedFeatureIds, onFeatureToggle }: FeatureTableProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(features.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, features.length);
  const visibleFeatures = features.slice(pageStart, pageEnd);

  return (
    <section aria-labelledby="feature-table-title" className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_32px_rgba(28,27,25,0.14)]">
      <div className={`flex items-center justify-between gap-4 bg-[#fbfbfa] px-4 py-3 ${collapsed ? "" : "border-b border-black/10"}`}>
        <div className="flex items-center gap-2">
          <Table2 className="size-4 text-[#0f6b5f]" aria-hidden="true" />
          <div>
            <h2 id="feature-table-title" className="text-sm font-semibold text-[#1c1b19]">Data tersimpan</h2>
            <p className="font-mono text-xs text-[#6b6760]">{features.length} Feature · read-only</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!collapsed ? <span className="hidden text-xs text-[#6b6760] sm:inline">Centang untuk operasi · pilih Fokus untuk peta</span> : null}
          <Button
            type="button"
            variant="ghost"
            size="lg"
            aria-controls="feature-table-content"
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
            className="text-xs font-semibold text-[#0f6b5f] hover:bg-[#e7f1ef] hover:text-[#0a5049] focus-visible:border-[#0f6b5f] focus-visible:ring-[#0f6b5f]/30"
          >
            {collapsed ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{collapsed ? "Buka tabel" : "Tutup tabel"}</span>
            <span className="sm:hidden">{collapsed ? "Buka" : "Tutup"}</span>
          </Button>
        </div>
      </div>

      {!collapsed ? <div id="feature-table-content">
      {loading ? <p className="px-4 py-6 text-sm text-[#6b6760]">Memuat Feature…</p> : null}
      {error ? (
        <div className="px-4 py-5" role="alert">
          <p className="text-sm text-[#8f2d23]">{error}</p>
          <button type="button" onClick={onRetry} className="mt-2 text-sm font-semibold text-[#0f6b5f] underline underline-offset-4">Coba lagi</button>
        </div>
      ) : null}
      {!loading && !error && features.length === 0 ? (
        <p className="px-4 py-7 text-center text-sm text-[#6b6760]">Belum ada Feature tersimpan untuk Project ini.</p>
      ) : null}
      {!loading && !error && features.length > 0 ? (
        <div className="max-h-48 overflow-auto">
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-[#f2f1ee] text-xs font-medium uppercase tracking-[0.1em] text-[#6b6760]">
              <tr>
                <th className="w-11 px-3 py-2.5"><span className="sr-only">Pilih</span></th>
                <th className="px-4 py-2.5">ID</th>
                {project.form_schema.map((field) => <th key={field.name} className="px-4 py-2.5">{field.label}</th>)}
                <th className="px-4 py-2.5"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleFeatures.map((feature) => (
                <tr key={feature.id} className={`border-t border-black/[0.07] hover:bg-[#f2f7f6] ${selectedFeatureIds.includes(feature.id) ? "bg-[#e7f1ef]" : ""}`}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedFeatureIds.includes(feature.id)}
                      onChange={() => onFeatureToggle(feature)}
                      aria-label={`Pilih Feature ${feature.id.slice(0, 8)}`}
                      className="size-4 rounded border-black/30 accent-[#0f6b5f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[#6b6760]">{feature.id.slice(0, 8)}</td>
                  {project.form_schema.map((field) => (
                    <td key={field.name} className="max-w-48 truncate px-4 py-2.5 text-[#1c1b19]">{displayValue(feature.attributes[field.name])}</td>
                  ))}
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => onFeatureSelect(feature)}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#0f6b5f] transition hover:bg-[#e7f1ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]"
                    >
                      <Crosshair className="size-3.5" aria-hidden="true" /> Fokus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {!loading && !error && features.length > 0 && pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.07] bg-[#fbfbfa] px-4 py-2.5">
          <span className="font-mono text-xs text-[#6b6760]" aria-live="polite">
            Menampilkan {pageStart + 1}–{pageEnd} dari {features.length}
          </span>
          <nav aria-label="Pagination data tersimpan" className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={currentPage === 1}
              aria-label="Halaman sebelumnya"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="border-black/10 bg-white text-[#0f6b5f] hover:bg-[#e7f1ef] hover:text-[#0a5049]"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <span className="min-w-24 text-center text-xs font-semibold text-[#1c1b19]" aria-label={`Halaman ${currentPage} dari ${pageCount}`}>
              Halaman {currentPage} / {pageCount}
            </span>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={currentPage === pageCount}
              aria-label="Halaman berikutnya"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              className="border-black/10 bg-white text-[#0f6b5f] hover:bg-[#e7f1ef] hover:text-[#0a5049]"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      ) : null}
      </div> : null}
    </section>
  );
}
