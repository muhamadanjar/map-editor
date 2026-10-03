import type { GuestIdentity, GuestProject, GuestSession, GuestSubmission, GuestSubmissionInput } from "../types";

const API_BASE = "/api/tileserver/api/v1/guest";

export class GuestApiError extends Error {
  constructor(message: string, readonly status: number, readonly detail?: unknown) {
    super(message);
    this.name = "GuestApiError";
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;

  let detail: unknown;
  try {
    detail = (await response.json() as { detail?: unknown; error?: unknown }).detail;
  } catch {
    // An upstream service may respond without JSON.
  }
  const message = typeof detail === "string" ? detail : `Permintaan tidak dapat diproses (${response.status}).`;
  throw new GuestApiError(message, response.status, detail);
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  }).then(readJson<T>);
}

export function getGuestProject(slug: string): Promise<GuestProject> {
  return fetch(`${API_BASE}/projects/${encodeURIComponent(slug)}`, { cache: "no-store" }).then(readJson<GuestProject>);
}

export function createGuestSession(slug: string, identity: GuestIdentity): Promise<GuestSession> {
  return post<GuestSession>(`/projects/${encodeURIComponent(slug)}/sessions`, identity);
}

export function requestGuestOtp(sessionToken: string): Promise<{ otp_required: boolean; expires_at?: string }> {
  return post(`/sessions/${encodeURIComponent(sessionToken)}/otp/request`);
}

export function verifyGuestOtp(sessionToken: string, code: string): Promise<{ verified: boolean; otp_required: boolean }> {
  return post(`/sessions/${encodeURIComponent(sessionToken)}/otp/verify`, { code });
}

export function submitGuestSubmission(sessionToken: string, input: GuestSubmissionInput): Promise<GuestSubmission> {
  return post<GuestSubmission>(`/sessions/${encodeURIComponent(sessionToken)}/submissions`, input);
}
