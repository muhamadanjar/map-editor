import type { CreateFeatureInput, Project, ProjectFeature } from "../types";

const API_BASE = "/api/tileserver/api/v1";

async function readJson<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let detail = `Tileserver merespons ${response.status}.`;
  try {
    const body = (await response.json()) as { detail?: string; error?: string };
    detail = body.detail ?? body.error ?? detail;
  } catch {
    // The service can return an empty non-JSON response.
  }
  throw new Error(detail);
}

export async function getProjects(signal?: AbortSignal): Promise<Project[]> {
  return readJson<Project[]>(await fetch(`${API_BASE}/projects`, { signal, cache: "no-store" }));
}

export async function getProjectFeatures(projectId: string, signal?: AbortSignal): Promise<ProjectFeature[]> {
  return readJson<ProjectFeature[]>(
    await fetch(`${API_BASE}/projects/${projectId}/features`, { signal, cache: "no-store" }),
  );
}

export async function createProjectFeature(
  projectId: string,
  input: CreateFeatureInput,
): Promise<ProjectFeature> {
  return readJson<ProjectFeature>(
    await fetch(`${API_BASE}/projects/${projectId}/features`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export function projectGeoJsonUrl(projectId: string, revision: number): string {
  return `${API_BASE}/projects/${projectId}/features.geojson?revision=${revision}`;
}
