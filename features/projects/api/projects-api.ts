import type {
  CreateFeatureInput,
  FeatureGeometry,
  FeatureTopologyResult,
  Project,
  ProjectCreateInput,
  ProjectFeature,
  ProjectFormField,
  ProjectGeofence,
  ProjectUpdateInput,
  UpdateFeatureInput,
} from "../types";

const API_BASE = "/api/tileserver/api/v1";

export class ProjectsApiError extends Error {
  constructor(message: string, readonly status: number, readonly detail?: unknown) {
    super(message);
    this.name = "ProjectsApiError";
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let detail: unknown;
  let message = `Tileserver merespons ${response.status}.`;
  try {
    const body = (await response.json()) as { detail?: unknown; error?: unknown };
    detail = body.detail ?? body.error;
    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail)) message = detail.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("; ");
    else if (detail && typeof detail === "object" && typeof (detail as { message?: unknown }).message === "string") {
      message = (detail as { message: string }).message;
    }
  } catch {
    // The service can return an empty non-JSON response.
  }
  throw new ProjectsApiError(message, response.status, detail);
}

async function send<T>(path: string, method: string, body?: unknown, signal?: AbortSignal, headers?: HeadersInit): Promise<T> {
  return readJson<T>(
    await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
    }),
  );
}

export async function getProjects(signal?: AbortSignal): Promise<Project[]> {
  return readJson<Project[]>(await fetch(`${API_BASE}/projects`, { signal, cache: "no-store" }));
}

export function createProject(input: ProjectCreateInput): Promise<Project> {
  return send<Project>("/projects", "POST", input);
}

/**
 * Every key is always present in `input`. Tileserver distinguishes "leave unchanged" from
 * "clear" with `model_fields_set`, so omitting a nullable guest field would silently skip it.
 */
export function updateProject(projectId: string, input: ProjectUpdateInput): Promise<Project> {
  return send<Project>(`/projects/${encodeURIComponent(projectId)}`, "PATCH", input);
}

export function replaceProjectSchema(projectId: string, formSchema: ProjectFormField[]): Promise<Project> {
  return send<Project>(`/projects/${encodeURIComponent(projectId)}/schema`, "PUT", { form_schema: formSchema });
}

export async function getProjectGeofence(projectId: string, signal?: AbortSignal): Promise<ProjectGeofence> {
  return readJson<ProjectGeofence>(
    await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/geofence`, { signal, cache: "no-store" }),
  );
}

export function upsertProjectGeofence(projectId: string, geometry: FeatureGeometry): Promise<ProjectGeofence> {
  return send<ProjectGeofence>(`/projects/${encodeURIComponent(projectId)}/geofence`, "PUT", { geometry });
}

export async function deleteProjectGeofence(projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/geofence`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!response.ok) await readJson(response);
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

export function updateProjectFeature(
  projectId: string,
  featureId: string,
  input: UpdateFeatureInput,
): Promise<ProjectFeature> {
  return send<ProjectFeature>(
    `/projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(featureId)}`,
    "PATCH",
    input,
  );
}

export async function deleteProjectFeature(projectId: string, featureId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(featureId)}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!response.ok) await readJson(response);
}

export function projectGeoJsonUrl(projectId: string, revision: number): string {
  return `${API_BASE}/projects/${projectId}/features.geojson?revision=${revision}`;
}

function idempotencyKey(): string {
  return crypto.randomUUID();
}

export function cutProjectFeature(projectId: string, featureId: string, cutter: FeatureGeometry): Promise<FeatureTopologyResult> {
  return send<FeatureTopologyResult>(
    `/projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(featureId)}/cut`,
    "POST",
    { cutter },
    undefined,
    { "Idempotency-Key": idempotencyKey() },
  );
}

export function mergeProjectFeatures(projectId: string, targetFeatureId: string, sourceIds: string[]): Promise<FeatureTopologyResult> {
  return send<FeatureTopologyResult>(
    `/projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(targetFeatureId)}/merge`,
    "POST",
    { source_ids: sourceIds },
    undefined,
    { "Idempotency-Key": idempotencyKey() },
  );
}
