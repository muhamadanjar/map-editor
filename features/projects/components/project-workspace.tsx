"use client";

import { LoaderCircle, PencilLine, Play, Settings2, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProjectFeature,
  cutProjectFeature,
  deleteProjectFeature,
  deleteProjectGeofence,
  getProjectFeatures,
  getProjectGeofence,
  getProjects,
  mergeProjectFeatures,
  ProjectsApiError,
  upsertProjectGeofence,
} from "../api/projects-api";
import type { FeatureGeometry, Position, Project } from "../types";
import { setProjectWorkspaceValue, useProjectWorkspaceStore } from "../stores/project-workspace-store";
import { geofenceErrorMessage } from "./project-geofence-settings";
import { FeatureInputDialog } from "./feature-input-dialog";
import { FeatureTable } from "./feature-table";
import type { MapEditorMode } from "./map-editing-toolbar";
import { ProjectMap } from "./project-map";
import { ProjectPicker } from "./project-picker";
import { ProjectSettingsDialog } from "./project-settings-dialog";
import { WorkspaceNavbar } from "./workspace-navbar";

const geometryLabels: Record<Project["geometry_type"], string> = {
  point: "Point",
  line: "Line",
  polygon: "Polygon",
};

function editorModeForGeometry(type: Project["geometry_type"]): MapEditorMode {
  return type === "point" ? "point" : type === "line" ? "linestring" : "polygon";
}

function geometryIsValidForProject(type: Project["geometry_type"], geometry: FeatureGeometry | null): boolean {
  if (!geometry) return false;
  if (type === "point") return geometry.type === "Point";
  if (type === "line") return geometry.type === "LineString" && geometry.coordinates.length >= 2;
  return geometry.type === "Polygon" && geometry.coordinates[0]?.length >= 4;
}

type SettingsState = { open: boolean; mode: "create" | "edit" } | null;
type TopologyAction = { kind: "cut"; targetId: string } | { kind: "merge"; targetId: string; sourceIds: string[] };

function sortByName(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function ProjectWorkspace() {
  const projects = useProjectWorkspaceStore((state) => state.projects);
  const activeProjectId = useProjectWorkspaceStore((state) => state.activeProjectId);
  const features = useProjectWorkspaceStore((state) => state.features);
  const featureRevision = useProjectWorkspaceStore((state) => state.featureRevision);
  const drawing = useProjectWorkspaceStore((state) => state.drawing);
  const editorMode = useProjectWorkspaceStore((state) => state.editorMode);
  const editorSession = useProjectWorkspaceStore((state) => state.editorSession);
  const draftGeometry = useProjectWorkspaceStore((state) => state.draftGeometry);
  const focusGeometry = useProjectWorkspaceStore((state) => state.focusGeometry);
  const geofence = useProjectWorkspaceStore((state) => state.geofence);
  const geofenceDrawing = useProjectWorkspaceStore((state) => state.geofenceDrawing);
  const geofencePoints = useProjectWorkspaceStore((state) => state.geofencePoints);
  const selectedFeatureIds = useProjectWorkspaceStore((state) => state.selectedFeatureIds);
  const featureSelectionMode = useProjectWorkspaceStore((state) => state.featureSelectionMode);
  const resetWorkspaceStore = useProjectWorkspaceStore((state) => state.reset);
  const activateProjectData = useProjectWorkspaceStore((state) => state.activateProject);
  const clearDraftData = useProjectWorkspaceStore((state) => state.clearDraft);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsState>(null);
  const [geofenceLoading, setGeofenceLoading] = useState(false);
  const [geofenceError, setGeofenceError] = useState<string | null>(null);
  const [geofenceApplying, setGeofenceApplying] = useState(false);
  const [geofenceRemoving, setGeofenceRemoving] = useState(false);
  const [topologyAction, setTopologyAction] = useState<TopologyAction | null>(null);
  const [topologyConfirm, setTopologyConfirm] = useState<TopologyAction | null>(null);
  const [topologySubmitting, setTopologySubmitting] = useState(false);
  const [featureDeleteConfirm, setFeatureDeleteConfirm] = useState<string[] | null>(null);
  const [featureDeleting, setFeatureDeleting] = useState(false);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  const activeSelection = useMemo(
    () => selectedFeatureIds.filter((id) => features.some((feature) => feature.id === id)),
    [features, selectedFeatureIds],
  );

  const clearDraft = useCallback(() => {
    clearDraftData();
    setFormValues({});
    setFormError(null);
    setFormOpen(false);
  }, [clearDraftData]);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      setProjectWorkspaceValue("projects", sortByName(await getProjects()));
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
      setProjectWorkspaceValue("features", nextFeatures);
      setProjectWorkspaceValue("featureRevision", (revision) => revision + 1);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setFeaturesError(error instanceof Error ? error.message : "Feature Project tidak dapat dimuat.");
      }
    } finally {
      if (!signal?.aborted) setFeaturesLoading(false);
    }
  }, []);

  const loadGeofence = useCallback(async (projectId: string) => {
    setGeofenceLoading(true);
    setGeofenceError(null);
    try {
      setProjectWorkspaceValue("geofence", await getProjectGeofence(projectId));
    } catch (error) {
      // A project without a geofence answers 404; anything else is worth showing in the tab.
      if (error instanceof ProjectsApiError && error.status === 404) {
        setProjectWorkspaceValue("geofence", null);
        return;
      }
      setGeofenceError(geofenceErrorMessage(error));
    } finally {
      setGeofenceLoading(false);
    }
  }, []);

  useEffect(() => {
    resetWorkspaceStore();
    let active = true;
    void getProjects()
      .then((nextProjects) => {
        if (active) {
          setProjectWorkspaceValue("projects", sortByName(nextProjects));
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
  }, [resetWorkspaceStore]);

  useEffect(() => {
    if (!activeProjectId) return;
    const controller = new AbortController();
    void getProjectFeatures(activeProjectId, controller.signal)
      .then((nextFeatures) => {
        setProjectWorkspaceValue("features", nextFeatures);
        setProjectWorkspaceValue("featureRevision", (revision) => revision + 1);
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
    activateProjectData(projectId);
    setFeaturesLoading(true);
    setGeofenceError(null);
    setFormValues({});
    setFormError(null);
    setFormOpen(false);
    setFeaturesError(null);
  }, [activateProjectData]);

  const requestProjectChange = useCallback((projectId: string) => {
    if (projectId === activeProjectId) return;
    const hasDraft = drawing || draftGeometry !== null || formOpen;
    if (hasDraft) {
      setPendingProjectId(projectId);
      setSwitchConfirmOpen(true);
      return;
    }
    activateProject(projectId);
  }, [activateProject, activeProjectId, draftGeometry, drawing, formOpen]);

  const handleCoordinate = useCallback((coordinate: Position) => {
    if (geofenceDrawing) {
      setProjectWorkspaceValue("geofencePoints", (points) => [...points, coordinate]);
      return;
    }
  }, [geofenceDrawing]);

  const startDrawing = useCallback((mode?: MapEditorMode) => {
    if (!activeProject) return;
    clearDraft();
    setProjectWorkspaceValue("featureSelectionMode", false);
    setProjectWorkspaceValue("drawing", true);
    setProjectWorkspaceValue("editorMode", mode ?? editorModeForGeometry(activeProject.geometry_type));
  }, [activeProject, clearDraft]);

  const changeEditorMode = useCallback((mode: MapEditorMode) => {
    if (!drawing) {
      startDrawing(mode);
      return;
    }
    setProjectWorkspaceValue("editorMode", mode);
  }, [drawing, startDrawing]);

  const startCut = useCallback(() => {
    const [targetId] = activeSelection;
    if (!targetId) return;
    clearDraft();
    setProjectWorkspaceValue("featureSelectionMode", false);
    setTopologyAction({ kind: "cut", targetId });
    setProjectWorkspaceValue("drawing", true);
    setProjectWorkspaceValue("editorMode", "linestring");
  }, [activeSelection, clearDraft]);

  const startMerge = useCallback(() => {
    if (activeSelection.length < 2) return;
    const [targetId, ...sourceIds] = activeSelection;
    setTopologyConfirm({ kind: "merge", targetId, sourceIds });
  }, [activeSelection]);

  const startFeatureDelete = useCallback(() => {
    if (!activeSelection.length) return;
    setFeatureDeleteConfirm(activeSelection);
  }, [activeSelection]);

  const selectProjectFeature = useCallback((featureId: string | null, additive: boolean) => {
    if (!featureId) {
      setProjectWorkspaceValue("selectedFeatureIds", []);
      return;
    }
    setProjectWorkspaceValue("selectedFeatureIds", (current) => {
      if (!additive) return [featureId];
      return current.includes(featureId) ? current.filter((id) => id !== featureId) : [...current, featureId];
    });
  }, []);

  const applyFeatureDelete = useCallback(async () => {
    if (!activeProject || !featureDeleteConfirm?.length) return;
    setFeatureDeleting(true);
    try {
      await Promise.all(featureDeleteConfirm.map((featureId) => deleteProjectFeature(activeProject.id, featureId)));
      const deleted = new Set(featureDeleteConfirm);
      setProjectWorkspaceValue("features", (current) => current.filter((feature) => !deleted.has(feature.id)));
      setProjectWorkspaceValue("selectedFeatureIds", []);
      setProjectWorkspaceValue("featureRevision", (revision) => revision + 1);
      setFeatureDeleteConfirm(null);
      setNotice(`${deleted.size} Feature dihapus.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Feature tidak dapat dihapus.");
      void loadFeatures(activeProject.id);
    } finally {
      setFeatureDeleting(false);
    }
  }, [activeProject, featureDeleteConfirm, loadFeatures]);

  const finishDrawing = useCallback(() => {
    if (!activeProject) return;
    if (topologyAction?.kind === "cut") {
      if (draftGeometry?.type !== "LineString") {
        setNotice("Gambar satu garis pemotong terlebih dahulu.");
        return;
      }
      setProjectWorkspaceValue("drawing", false);
      setProjectWorkspaceValue("editorMode", "select");
      setTopologyConfirm(topologyAction);
      setTopologyAction(null);
      return;
    }
    if (!geometryIsValidForProject(activeProject.geometry_type, draftGeometry)) {
      setNotice(`Untuk ${geometryLabels[activeProject.geometry_type]}, selesaikan sketsa terlebih dahulu.`);
      return;
    }
    setProjectWorkspaceValue("drawing", false);
    setProjectWorkspaceValue("editorMode", "select");
    setFormOpen(true);
  }, [activeProject, draftGeometry, topologyAction]);

  const applyTopology = useCallback(async () => {
    if (!activeProject || !topologyConfirm) return;
    setTopologySubmitting(true);
    try {
      const result = topologyConfirm.kind === "cut"
        ? await cutProjectFeature(activeProject.id, topologyConfirm.targetId, draftGeometry as FeatureGeometry)
        : await mergeProjectFeatures(activeProject.id, topologyConfirm.targetId, topologyConfirm.sourceIds);
      setProjectWorkspaceValue("features", (current) => {
        const resultIds = new Set(result.features.map((feature) => feature.id));
        const removedIds = topologyConfirm.kind === "cut"
          ? new Set([topologyConfirm.targetId])
          : new Set([topologyConfirm.targetId, ...topologyConfirm.sourceIds]);
        return [...current.filter((feature) => !removedIds.has(feature.id) || resultIds.has(feature.id)), ...result.features.filter((feature) => !current.some((item) => item.id === feature.id))]
          .map((feature) => result.features.find((item) => item.id === feature.id) ?? feature);
      });
      setProjectWorkspaceValue("featureRevision", (revision) => revision + 1);
      setProjectWorkspaceValue("selectedFeatureIds", []);
      clearDraft();
      setTopologyConfirm(null);
      setNotice(result.replayed ? "Operasi sebelumnya dimuat kembali." : `Feature berhasil ${result.operation === "cut" ? "dipotong" : "digabungkan"}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Operasi geometri gagal dilakukan.");
    } finally {
      setTopologySubmitting(false);
    }
  }, [activeProject, clearDraft, draftGeometry, topologyConfirm]);

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
      setProjectWorkspaceValue("features", (current) => [...current, created]);
      setProjectWorkspaceValue("featureRevision", (revision) => revision + 1);
      setNotice("Feature baru tersimpan di Tileserver.");
      clearDraft();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Feature tidak dapat disimpan.");
    } finally {
      setSubmitting(false);
    }
  }, [activeProject, clearDraft, draftGeometry, formValues]);

  const hasValidDraft = activeProject ? geometryIsValidForProject(activeProject.geometry_type, draftGeometry) : false;

  // The geofence fence draws on the workspace map, so its preview shares the map with the feature draft.
  // It renders through the fence source so a boundary in progress never looks like a feature.
  const geofencePreview = useMemo<FeatureGeometry | null>(() => {
    if (!geofenceDrawing) return geofence?.geometry ?? null;
    if (geofencePoints.length >= 3) {
      return { type: "Polygon", coordinates: [[...geofencePoints, geofencePoints[0]]] };
    }
    if (geofencePoints.length === 2) return { type: "LineString", coordinates: geofencePoints };
    return null;
  }, [geofence, geofenceDrawing, geofencePoints]);

  const openSettings = useCallback(
    (mode: "create" | "edit") => {
      if (mode === "edit" && activeProjectId) void loadGeofence(activeProjectId);
      else {
        setProjectWorkspaceValue("geofence", null);
        setGeofenceError(null);
      }
      setProjectWorkspaceValue("geofenceDrawing", false);
      setProjectWorkspaceValue("geofencePoints", []);
      setSettings({ open: true, mode });
    },
    [activeProjectId, loadGeofence],
  );

  const closeSettings = useCallback(() => {
    setSettings(null);
    setProjectWorkspaceValue("geofenceDrawing", false);
    setProjectWorkspaceValue("geofencePoints", []);
  }, []);

  const applyGeofence = useCallback(async () => {
    if (!activeProjectId || geofencePoints.length < 3) return;
    setGeofenceApplying(true);
    setGeofenceError(null);
    try {
      const saved = await upsertProjectGeofence(activeProjectId, {
        type: "Polygon",
        coordinates: [[...geofencePoints, geofencePoints[0]]],
      });
      setProjectWorkspaceValue("geofence", saved);
      setProjectWorkspaceValue("geofenceDrawing", false);
      setProjectWorkspaceValue("geofencePoints", []);
      setNotice("Geofence project tersimpan.");
    } catch (error) {
      setGeofenceError(geofenceErrorMessage(error));
    } finally {
      setGeofenceApplying(false);
    }
  }, [activeProjectId, geofencePoints]);

  const removeGeofence = useCallback(async () => {
    if (!activeProjectId) return;
    setGeofenceRemoving(true);
    setGeofenceError(null);
    try {
      await deleteProjectGeofence(activeProjectId);
      setProjectWorkspaceValue("geofence", null);
      setNotice("Geofence project dihapus.");
    } catch (error) {
      setGeofenceError(geofenceErrorMessage(error));
    } finally {
      setGeofenceRemoving(false);
    }
  }, [activeProjectId]);

  const handleSettingsSaved = useCallback(
    (saved: Project, options: { activate: boolean }) => {
      setProjectWorkspaceValue("projects", (current) => {
        const next = current.some((project) => project.id === saved.id)
          ? current.map((project) => (project.id === saved.id ? saved : project))
          : [...current, saved];
        return sortByName(next);
      });
      setSettings(null);
      if (options.activate) activateProject(saved.id);
      setGeofenceError(null);
      setNotice(
        saved.guest_enabled && saved.public_slug
          ? `Project tersimpan. Formulir guest aktif di /guest/${saved.public_slug}.`
          : "Project tersimpan.",
      );
    },
    [activateProject],
  );

  return (
    <main className="relative h-dvh overflow-hidden bg-[#f6f6f5] text-[#1c1b19]">
      <a href="#workspace-controls" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0f6b5f]">Lewati ke kontrol editor</a>
      <ProjectMap
        project={activeProject}
        featureRevision={featureRevision}
        drawing={drawing || geofenceDrawing}
        drawGeometryType={geofenceDrawing ? "polygon" : null}
        draftGeometry={geofenceDrawing ? null : draftGeometry}
        geofenceGeometry={geofencePreview}
        focusGeometry={focusGeometry}
        workspaceGeometries={features.map((feature) => feature.geometry)}
        projectFeatures={features.map((feature) => ({ id: feature.id, geometry: feature.geometry }))}
        selectedFeatureGeometries={features.filter((feature) => activeSelection.includes(feature.id)).map((feature) => feature.geometry)}
        onCoordinate={handleCoordinate}
        editorSession={editorSession}
        editorMode={drawing ? editorMode : null}
        onDraftGeometryChange={(geometry) => setProjectWorkspaceValue("draftGeometry", geometry)}
        onEditorModeChange={changeEditorMode}
        featureSelectionMode={featureSelectionMode}
        selectedFeatureCount={activeSelection.length}
        onFeatureSelectionModeChange={(active) => setProjectWorkspaceValue("featureSelectionMode", active)}
        onProjectFeatureSelect={selectProjectFeature}
        tableOpen={tableOpen}
        onTableToggle={() => setTableOpen((open) => !open)}
        canDelete={activeSelection.length > 0 && !drawing}
        onDelete={startFeatureDelete}
        canCut={activeProject?.geometry_type === "polygon" && activeSelection.length === 1 && !drawing}
        canMerge={activeProject?.geometry_type === "polygon" && activeSelection.length >= 2 && !drawing}
        onCut={startCut}
        onMerge={startMerge}
      />

      <WorkspaceNavbar
        projects={projects}
        activeProjectId={activeProjectId}
        activeProject={activeProject}
        featureCount={features.length}
        onProjectChange={requestProjectChange}
        onLoginUnavailable={() => setNotice("Form login tersedia, tetapi layanan autentikasi belum dikonfigurasi.")}
      />

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

          <div className="mt-3 space-y-2 border-t border-black/10 pt-3">
            {!drawing ? (
              <button type="button" onClick={() => startDrawing()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f6b5f] px-4 text-sm font-semibold text-white transition hover:bg-[#0a5049] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
                <PencilLine className="size-4" aria-hidden="true" /> Tambah {geometryLabels[activeProject.geometry_type]}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="rounded-lg bg-[#e7f1ef] px-3 py-2 text-sm text-[#0a5049]">
                  {editorMode === "select"
                    ? "Tarik vertex pada peta untuk menyempurnakan sketsa."
                    : editorMode === "rectangle"
                      ? "Tarik pada peta untuk membuat rectangle."
                      : "Gunakan toolbar peta untuk menggambar, lalu pilih Selesai."}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={finishDrawing} disabled={topologyAction ? draftGeometry?.type !== "LineString" : !hasValidDraft} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f6b5f] px-3 text-sm font-semibold text-white transition hover:bg-[#0a5049] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
                    <Play className="size-4" aria-hidden="true" /> Selesai
                  </button>
                  <button type="button" onClick={clearDraft} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
                    <X className="size-4" aria-hidden="true" /> Batal
                  </button>
                </div>
              </div>
            )}
            <button type="button" onClick={() => openSettings("edit")} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">
              <Settings2 className="size-4" aria-hidden="true" /> Pengaturan project
            </button>
            {geofence ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2f5d7c]">Geofence aktif</p>
            ) : null}
          </div>
        </aside>
      ) : null}

      {!activeProject ? (
        <div className="absolute inset-0 z-10 grid place-items-center p-4 pointer-events-none">
          <div className="pointer-events-auto"><ProjectPicker projects={projects} loading={projectsLoading} error={projectsError} onRetry={() => void loadProjects()} onSelect={requestProjectChange} onCreate={() => openSettings("create")} /></div>
        </div>
      ) : null}

      {activeProject && tableOpen ? (
        <div className="absolute inset-x-3 bottom-20 z-20 sm:inset-x-5 sm:bottom-24">
          <FeatureTable
            key={activeProject.id}
            project={activeProject}
            features={features}
            loading={featuresLoading}
            error={featuresError}
            onRetry={() => void loadFeatures(activeProject.id)}
            onFeatureSelect={(feature) => setProjectWorkspaceValue("focusGeometry", { ...feature.geometry })}
            selectedFeatureIds={selectedFeatureIds}
            onFeatureToggle={(feature) => setProjectWorkspaceValue("selectedFeatureIds", (current) => current.includes(feature.id) ? current.filter((id) => id !== feature.id) : [...current, feature.id])}
          />
        </div>
      ) : null}

      {notice ? <p role="status" className="absolute bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#0f6b5f]/25 bg-white px-4 py-3 text-sm font-semibold text-[#0a5049] shadow-[0_8px_24px_rgba(28,27,25,0.16)]">{notice}</p> : null}

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

      {topologyConfirm && activeProject ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/35 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="topology-title" className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(28,27,25,0.24)]">
            <h2 id="topology-title" className="text-lg font-semibold text-[#1c1b19]">{topologyConfirm.kind === "cut" ? "Potong Feature terpilih?" : "Gabungkan Feature terpilih?"}</h2>
            <p className="mt-2 text-sm leading-5 text-[#6b6760]">
              {topologyConfirm.kind === "cut"
                ? "Feature asli akan dipertahankan pada potongan terbesar dan satu Feature baru akan dibuat."
                : "Feature pertama yang dipilih menjadi target; atributnya dipertahankan dan Feature lain dihapus."}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={topologySubmitting} onClick={() => { setTopologyConfirm(null); setTopologyAction(null); clearDraft(); }} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">Batal</button>
              <button type="button" disabled={topologySubmitting} onClick={() => void applyTopology()} className="min-h-11 rounded-xl bg-[#c0392b] px-4 text-sm font-semibold text-white transition hover:bg-[#9e2e23] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]">{topologySubmitting ? "Memproses…" : "Konfirmasi"}</button>
            </div>
          </section>
        </div>
      ) : null}

      {featureDeleteConfirm && activeProject ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/35 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-features-title" className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(28,27,25,0.24)]">
            <h2 id="delete-features-title" className="text-lg font-semibold text-[#1c1b19]">Hapus Feature terpilih?</h2>
            <p className="mt-2 text-sm leading-5 text-[#6b6760]">{featureDeleteConfirm.length} Feature akan dihapus secara permanen dari Project ini.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={featureDeleting} onClick={() => setFeatureDeleteConfirm(null)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#6b6760] transition hover:bg-[#f2f1ee] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5f]">Batal</button>
              <button type="button" disabled={featureDeleting} onClick={() => void applyFeatureDelete()} className="min-h-11 rounded-xl bg-[#c0392b] px-4 text-sm font-semibold text-white transition hover:bg-[#9e2e23] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]">{featureDeleting ? "Menghapus…" : "Hapus Feature"}</button>
            </div>
          </section>
        </div>
      ) : null}

      {settings ? (
        <ProjectSettingsDialog
          project={settings.mode === "edit" ? activeProject : null}
          featureCount={features.length}
          geofence={geofence}
          geofenceLoading={geofenceLoading}
          geofenceError={geofenceError}
          geofenceDraft={{ drawing: geofenceDrawing, points: geofencePoints }}
          geofenceApplying={geofenceApplying}
          geofenceRemoving={geofenceRemoving}
          onGeofenceStartDrawing={() => {
            setGeofenceError(null);
            setProjectWorkspaceValue("geofencePoints", []);
            setProjectWorkspaceValue("geofenceDrawing", true);
          }}
          onGeofenceCancelDrawing={() => {
            setProjectWorkspaceValue("geofenceDrawing", false);
            setProjectWorkspaceValue("geofencePoints", []);
          }}
          onGeofenceApply={() => void applyGeofence()}
          onGeofenceRemove={() => void removeGeofence()}
          onClose={closeSettings}
          onSaved={handleSettingsSaved}
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
