import { create } from "zustand";
import type { FeatureGeometry, Position, Project, ProjectFeature, ProjectGeofence } from "../types";

export type ProjectWorkspaceData = {
  projects: Project[];
  activeProjectId: string | null;
  features: ProjectFeature[];
  featureRevision: number;
  drawing: boolean;
  editorMode: "point" | "linestring" | "polygon" | "rectangle" | "select" | null;
  editorSession: number;
  draftGeometry: FeatureGeometry | null;
  focusGeometry: FeatureGeometry | null;
  geofence: ProjectGeofence | null;
  geofenceDrawing: boolean;
  geofencePoints: Position[];
  selectedFeatureIds: string[];
  featureSelectionMode: boolean;
};

export type StateUpdate<T> = T | ((current: T) => T);

type ProjectWorkspaceStore = ProjectWorkspaceData & {
  setValue: <K extends keyof ProjectWorkspaceData>(key: K, value: StateUpdate<ProjectWorkspaceData[K]>) => void;
  activateProject: (projectId: string) => void;
  clearDraft: () => void;
  reset: () => void;
};

function initialData(): ProjectWorkspaceData {
  return {
    projects: [],
    activeProjectId: null,
    features: [],
    featureRevision: 0,
    drawing: false,
    editorMode: null,
    editorSession: 0,
    draftGeometry: null,
    focusGeometry: null,
    geofence: null,
    geofenceDrawing: false,
    geofencePoints: [],
    selectedFeatureIds: [],
    featureSelectionMode: false,
  };
}

export const useProjectWorkspaceStore = create<ProjectWorkspaceStore>((set) => ({
  ...initialData(),
  setValue: (key, value) => set((state) => ({
    [key]: typeof value === "function"
      ? (value as (current: ProjectWorkspaceData[typeof key]) => ProjectWorkspaceData[typeof key])(state[key])
      : value,
  })),
  activateProject: (activeProjectId) => set((state) => ({
    activeProjectId,
    features: [],
    drawing: false,
    editorMode: null,
    editorSession: state.editorSession + 1,
    draftGeometry: null,
    focusGeometry: null,
    geofence: null,
    geofenceDrawing: false,
    geofencePoints: [],
    selectedFeatureIds: [],
    featureSelectionMode: false,
  })),
  clearDraft: () => set((state) => ({
    drawing: false,
    editorMode: null,
    draftGeometry: null,
    editorSession: state.editorSession + 1,
  })),
  reset: () => set(initialData()),
}));

export function setProjectWorkspaceValue<K extends keyof ProjectWorkspaceData>(
  key: K,
  value: StateUpdate<ProjectWorkspaceData[K]>,
): void {
  useProjectWorkspaceStore.getState().setValue(key, value);
}
