"use client";

import { ChevronDown, LoaderCircle, MapPin, PencilLine, Play, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createProjectFeature, getProjectFeatures, getProjects } from "../api/projects-api";
import type { FeatureGeometry, Position, Project, ProjectFeature } from "../types";
import { FeatureInputDialog } from "./feature-input-dialog";
import { FeatureTable } from "./feature-table";
import { ProjectMap } from "./project-map";
import { ProjectPicker } from "./project-picker";

const geometryLabels: Record<Project["geometry_type"], string> = {
  point: "Point",
  line: "Line",
  polygon: "Polygon",
};

function draftPreview(type: Project["geometry_type"] | undefined, coordinates: Position[], saved: FeatureGeometry | null): FeatureGeometry | null {
  if (saved) return saved;
  if (!type || coordinates.length === 0) return null;
  if (type === "point") return { type: "Point", coordinates: coordinates[0] };
  return { type: "LineString", coordinates };
}

function finalGeometry(type: Project["geometry_type"], coordinates: Position[]): FeatureGeometry | null {
  if (type === "point") return coordinates[0] ? { type: "Point", coordinates: coordinates[0] } : null;
  if (type === "line") return coordinates.length >= 2 ? { type: "LineString", coordinates } : null;
  return coordinates.length >= 3 ? { type: "Polygon", coordinates: [[...coordinates, coordinates[0]]] } : null;
}

export function ProjectWorkspace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [features, setFeatures] = useState<ProjectFeature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  const [featureRevision, setFeatureRevision] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [draftCoordinates, setDraftCoordinates] = useState<Position[]>([]);
  const [draftGeometry, setDraftGeometry] = useState<FeatureGeometry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [focusGeometry, setFocusGeometry] = useState<FeatureGeometry | null>(null);
  const [tableCollapsed, setTableCollapsed] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  const clearDraft = useCallback(() => {
    setDrawing(false);
    setDraftCoordinates([]);
    setDraftGeometry(null);
    setFormValues({});
    setFormError(null);
    setFormOpen(false);
  }, []);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      setProjects(await getProjects());
    } catch (error) {
      setProjectsError(error instanceof Error ? error.message : "Daftar Project tidak dapat dimuat.");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const loadFeatures = useCallback(async (projectId: string, signal?: AbortSignal) => {
    setFeaturesLoading(true);
    setFeaturesError(null);
    try {
      const nextFeatures = await getProjectFeatures(projectId, signal);
      setFeatures(nextFeatures);
      setFeatureRevision((revision) => revision + 1);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setFeaturesError(error instanceof Error ? error.message : "Feature Project tidak dapat dimuat.");
      }
    } finally {
      if (!signal?.aborted) setFeaturesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getProjects()
      .then((nextProjects) => {
        if (active) {
          setProjects(nextProjects);
          setProjectsError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setProjectsError(error instanceof Error ? error.message : "Daftar Project tidak dapat dimuat.");
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;
    const controller = new AbortController();
    void getProjectFeatures(activeProjectId, controller.signal)
      .then((nextFeatures) => {
        setFeatures(nextFeatures);
        setFeatureRevision((revision) => revision + 1);
        setFeaturesError(null);
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") {
          setFeaturesError(error instanceof Error ? error.message : "Feature Project tidak dapat dimuat.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setFeaturesLoading(false);
      });
    return () => controller.abort();
  }, [activeProjectId]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const activateProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    setFeatures([]);
    setFeaturesLoading(true);
    setFocusGeometry(null);
    clearDraft();
    setFeaturesError(null);
  }, [clearDraft]);

  const requestProjectChange = useCallback((projectId: string) => {
    if (projectId === activeProjectId) return;
    const hasDraft = drawing || draftCoordinates.length > 0 || draftGeometry !== null || formOpen;
    if (hasDraft) {
      setPendingProjectId(projectId);
      setSwitchConfirmOpen(true);
      return;
    }
    activateProject(projectId);
  }, [activateProject, activeProjectId, draftCoordinates.length, draftGeometry, drawing, formOpen]);

  const handleCoordinate = useCallback((coordinate: Position) => {
    if (!activeProject || !drawing) return;
    if (activeProject.geometry_type === "point") {
      setDraftGeometry({ type: "Point", coordinates: coordinate });
      setDrawing(false);
      setFormOpen(true);
      return;
    }
    setDraftCoordinates((coordinates) => [...coordinates, coordinate]);
  }, [activeProject, drawing]);

  const startDrawing = useCallback(() => {
    clearDraft();
    setDrawing(true);
  }, [clearDraft]);

  const finishDrawing = useCallback(() => {
    if (!activeProject) return;
    const geometry = finalGeometry(activeProject.geometry_type, draftCoordinates);
    if (!geometry) {
      setNotice(`Untuk ${geometryLabels[activeProject.geometry_type]}, tambahkan lebih banyak titik terlebih dahulu.`);
      return;
    }
    setDraftGeometry(geometry);
    setDrawing(false);
    setFormOpen(true);
  }, [activeProject, draftCoordinates]);

  const submitFeature = useCallback(async () => {
    if (!activeProject || !draftGeometry) return;
    const requiredFile = activeProject.form_schema.find((field) => field.type === "file" && field.required);
    if (requiredFile) {
      setFormError(`Field ${requiredFile.label} wajib diisi melalui aplikasi pengelolaan data.`);
      return;
    }

    const attributes = Object.fromEntries(
      activeProject.form_schema
        .filter((field) => field.type !== "file")
        .map((field) => {
          const value = formValues[field.name] ?? "";
          if (field.type === "number" && value !== "") return [field.name, Number(value)];
          return [field.name, value || null];
        }),
    );

    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createProjectFeature(activeProject.id, { geometry: draftGeometry, attributes });
      setFeatures((current) => [...current, created]);
      setFeatureRevision((revision) => revision + 1);
      setNotice("Feature baru tersimpan di Tileserver.");
      clearDraft();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Feature tidak dapat disimpan.");
    } finally {
      setSubmitting(false);
    }
  }, [activeProject, clearDraft, draftGeometry, formValues]);

  const previewGeometry = draftPreview(activeProject?.geometry_type, draftCoordinates, draftGeometry);
  const hasEnoughVertices = activeProject?.geometry_type === "line" ? draftCoordinates.length >= 2 : draftCoordinates.length >= 3;

  return (
    <main className="relative h-dvh overflow-hidden bg-[#f6f6f5] text-[#1c1b19]">
      <a href="#workspace-controls" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0f6b5f]">Lewati ke kontrol editor</a>
      <ProjectMap
        project={activeProject}
        featureRevision={featureRevision}
        drawing={drawing}
        draftGeometry={previewGeometry}
        focusGeometry={focusGeometry}
        workspaceGeometries={features.map((feature) => feature.geometry)}
        onCoordinate={handleCoordinate}
      />

      <header id="workspace-controls" className="absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-3 sm:inset-x-5 sm:top-5">
        <div className="rounded-xl border border-black/10 bg-white/95 p-2 shadow-[0_5px_16px_rgba(28,27,25,0.12)] backdrop-blur">
          <label className="sr-only" htmlFor="project-switcher">Project aktif</label>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#e7f1ef] text-[#0f6b5f]" aria-hidden="true"><MapPin className="size-4" /></span>
            <select
              id="project-switcher"
              value={activeProjectId ?? ""}
              onChange={(event) => requestProjectChange(event.target.value)}
              className="h-9 max-w-48 appearance-none bg-transparent pr-6 text-sm font-semibold text-[#1c1b19] outline-none focus-visible:ring-2 focus-visible:ring-[#0f6b5f]"
            >
              <option value="" disabled>Pilih Project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {geometryLabels[project.geometry_type]}</option>)}
            </select>
            <ChevronDown className="-ml-6 size-4 shrink-0 text-[#6b6760]" aria-hidden="true" />
          </div>
        </div>
        {activeProject ? (
          <div className="hidden rounded-xl border border-black/10 bg-white/95 px-3 py-2 shadow-[0_5px_16px_rgba(28,27,25,0.12)] backdrop-blur sm:block">
            <p className="font-mono text-xs text-[#6b6760]">{geometryLabels[activeProject.geometry_type].toUpperCase()} · {features.length} FEATURE</p>
          </div>
        ) : null}
      </header>

      {activeProject ? (
        <aside className="absolute left-3 top-16 z-20 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-black/10 bg-white/95 p-3 shadow-[0_8px_24px_rgba(28,27,25,0.13)] backdrop-blur sm:left-5 sm:top-20">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#0f6b5f]">Project aktif</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-[#1c1b19]">{activeProject.name}</h1>
              <p className="mt-0.5 text-sm leading-5 text-[#6b6760]">{activeProject.description || `Input geometry ${geometryLabels[activeProject.geometry_type]} baru.`}</p>
            </div>
            <span className="shrink-0 rounded-md bg-[#e7f1ef] px-2 py-1 font-mono text-xs text-[#0f6b5f]">{geometryLabels[activeProject.geometry_type]}</span>
          </div>

          <div className="mt-3 border-t border-black/10 pt-3">
            {!drawing ? (
              <button type="button" onClick={startDrawing} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f6b5f] px-4 text-sm font-semibold text-white transition hover:bg-[#0a5049] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
                <PencilLine className="size-4" aria-hidden="true" /> Tambah {geometryLabels[activeProject.geometry_type]}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="rounded-lg bg-[#e7f1ef] px-3 py-2 text-sm text-[#0a5049]">
                  {activeProject.geometry_type === "point" ? "Klik satu lokasi pada peta." : "Klik peta untuk menambah titik, lalu selesaikan bentuk."}
                </p>
                <div className="flex gap-2">
                  {activeProject.geometry_type !== "point" ? (
                    <button type="button" onClick={finishDrawing} disabled={!hasEnoughVertices} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f6b5f] px-3 text-sm font-semibold text-white transition hover:bg-[#0a5049] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
                      <Play className="size-4" aria-hidden="true" /> Selesai
                    </button>
                  ) : null}
                  <button type="button" onClick={clearDraft} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
                    <X className="size-4" aria-hidden="true" /> Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      ) : null}

      {!activeProject ? (
        <div className="absolute inset-0 z-10 grid place-items-center p-4 pointer-events-none">
          <div className="pointer-events-auto"><ProjectPicker projects={projects} loading={projectsLoading} error={projectsError} onRetry={() => void loadProjects()} onSelect={requestProjectChange} /></div>
        </div>
      ) : null}

      {activeProject ? (
        <div className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-5 sm:bottom-5">
          <FeatureTable
            key={activeProject.id}
            project={activeProject}
            features={features}
            loading={featuresLoading}
            error={featuresError}
            collapsed={tableCollapsed}
            onRetry={() => void loadFeatures(activeProject.id)}
            onCollapsedChange={setTableCollapsed}
            onFeatureSelect={(feature) => setFocusGeometry({ ...feature.geometry })}
          />
        </div>
      ) : null}

      {notice ? <p role="status" className="absolute bottom-56 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-[#0f6b5f]/25 bg-white px-4 py-3 text-sm font-semibold text-[#0a5049] shadow-[0_8px_24px_rgba(28,27,25,0.16)]">{notice}</p> : null}

      {formOpen && activeProject ? (
        <FeatureInputDialog
          project={activeProject}
          values={formValues}
          submitting={submitting}
          error={formError}
          onChange={(name, value) => setFormValues((current) => ({ ...current, [name]: value }))}
          onClose={clearDraft}
          onSubmit={() => void submitFeature()}
        />
      ) : null}

      {switchConfirmOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/35 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="switch-title" className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(28,27,25,0.24)]">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0ee] text-[#c0392b]" aria-hidden="true"><Trash2 className="size-5" /></span>
              <div>
                <h2 id="switch-title" className="text-lg font-semibold text-[#1c1b19]">Buang input yang belum disimpan?</h2>
                <p className="mt-1 text-sm leading-5 text-[#6b6760]">Geometry dan nilai form saat ini akan hilang ketika Project diganti.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setSwitchConfirmOpen(false); setPendingProjectId(null); }} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">Tetap di Project ini</button>
              <button type="button" onClick={() => { if (pendingProjectId) activateProject(pendingProjectId); setPendingProjectId(null); setSwitchConfirmOpen(false); }} className="min-h-11 rounded-xl bg-[#c0392b] px-4 text-sm font-semibold text-white transition hover:bg-[#9e2e23] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]">Buang & ganti Project</button>
            </div>
          </section>
        </div>
      ) : null}

      {projectsLoading && activeProject ? <p className="sr-only" role="status">Memuat daftar Project</p> : null}
      {submitting ? <span className="sr-only"><LoaderCircle />Menyimpan Feature</span> : null}
      <p className="absolute bottom-1 right-3 z-10 font-mono text-[10px] text-[#6b6760]/80 sm:right-5">EPSG:4326 · OSM</p>
    </main>
  );
}
