import { createHash, randomBytes } from "node:crypto";

export const ACCESS_TOKEN_COOKIE = "map_editor_access";
export const REFRESH_TOKEN_COOKIE = "map_editor_refresh";
export const OAUTH_STATE_COOKIE = "map_editor_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "map_editor_oauth_verifier";

export function getUserManagementApiUrl(path: string): URL {
  const baseUrl = process.env.USERMANAGEMENT_API_URL;
  if (!baseUrl) throw new Error("USERMANAGEMENT_API_URL belum dikonfigurasi.");
  return new URL(`${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);
}

export function oauthClientId(): string {
  const value = process.env.USERMANAGEMENT_OAUTH_CLIENT_ID;
  if (!value) throw new Error("USERMANAGEMENT_OAUTH_CLIENT_ID belum dikonfigurasi.");
  return value;
}

export function callbackUrl(requestUrl: string): string {
  const configuredOrigin = process.env.MAP_EDITOR_PUBLIC_URL?.replace(/\/$/, "");
  const origin = configuredOrigin ?? new URL(requestUrl).origin;
  return `${origin}/api/auth/callback`;
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function createOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export type UserManagementAuthPair = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export function userManagementAuthPair(payload: unknown): UserManagementAuthPair | null {
  if (!payload || typeof payload !== "object") return null;
  const envelope = payload as { data?: unknown };
  if (!envelope.data || typeof envelope.data !== "object") return null;
  const data = envelope.data as { auth?: unknown };
  if (!data.auth || typeof data.auth !== "object") return null;
  const auth = data.auth as Record<string, unknown>;
  if (typeof auth.access_token !== "string" || !auth.access_token) return null;
  return {
    access_token: auth.access_token,
    ...(typeof auth.refresh_token === "string" ? { refresh_token: auth.refresh_token } : {}),
    ...(typeof auth.expires_in === "number" ? { expires_in: auth.expires_in } : {}),
  };
}
