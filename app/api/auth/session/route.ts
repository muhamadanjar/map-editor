import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, cookieOptions, getUserManagementApiUrl, REFRESH_TOKEN_COOKIE, userManagementAuthPair } from "@/features/auth/lib/oauth";

export const dynamic = "force-dynamic";

async function userInfo(accessToken: string): Promise<Response> {
  const headers = new Headers({ Authorization: `Bearer ${accessToken}`, Accept: "application/json" });
  if (process.env.USERMANAGEMENT_APPLICATION_ID) headers.set("X-Application-ID", process.env.USERMANAGEMENT_APPLICATION_ID);
  return fetch(getUserManagementApiUrl("auth/info"), {
    headers,
    cache: "no-store",
  });
}

function accountProfile(payload: unknown) {
  if (!payload || typeof payload !== "object") return { name: null, email: null };
  const envelope = payload as Record<string, unknown>;
  const data = envelope.data && typeof envelope.data === "object"
    ? envelope.data as Record<string, unknown>
    : envelope;
  const user = data.data && typeof data.data === "object"
    ? data.data as Record<string, unknown>
    : data.user && typeof data.user === "object"
      ? data.user as Record<string, unknown>
      : data;
  return {
    name: typeof user.name === "string" ? user.name : null,
    email: typeof user.email === "string" ? user.email : null,
  };
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return NextResponse.json({ authenticated: false }, { status: 401 });

  try {
    let response = await userInfo(accessToken);
    let refreshedAccessToken: string | null = null;
    let refreshedRefreshToken: string | null = null;
    let refreshedAccessExpiresIn = 900;
    if (response.status === 401) {
      const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
      if (!refreshToken) return NextResponse.json({ authenticated: false }, { status: 401 });
      const tokenResponse = await fetch(getUserManagementApiUrl("auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
      if (!tokenResponse.ok) return NextResponse.json({ authenticated: false }, { status: 401 });
      const auth = userManagementAuthPair(await tokenResponse.json());
      if (!auth) return NextResponse.json({ authenticated: false }, { status: 401 });
      refreshedAccessToken = auth.access_token;
      refreshedRefreshToken = auth.refresh_token ?? null;
      refreshedAccessExpiresIn = auth.expires_in ?? 900;
      response = await userInfo(refreshedAccessToken);
    }
    if (!response.ok) return NextResponse.json({ authenticated: false }, { status: 401 });

    const result = NextResponse.json({ authenticated: true, account: accountProfile(await response.json()) }, {
      headers: { "Cache-Control": "no-store" },
    });
    if (refreshedAccessToken) {
      result.cookies.set(ACCESS_TOKEN_COOKIE, refreshedAccessToken, cookieOptions(refreshedAccessExpiresIn));
      if (refreshedRefreshToken) result.cookies.set(REFRESH_TOKEN_COOKIE, refreshedRefreshToken, cookieOptions(60 * 60 * 24 * 30));
      else result.cookies.delete(REFRESH_TOKEN_COOKIE);
    }
    return result;
  } catch {
    return NextResponse.json({ authenticated: false, message: "UserManagement tidak dapat dihubungi." }, { status: 503 });
  }
}
