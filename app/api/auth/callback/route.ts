import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, callbackUrl, cookieOptions, getUserManagementApiUrl, oauthClientId, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, REFRESH_TOKEN_COOKIE, userManagementAuthPair } from "@/features/auth/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value;
  const failure = (message: string) => {
    const response = NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(message)}`, request.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_VERIFIER_COOKIE);
    return response;
  };

  if (error) return failure("Login dibatalkan atau ditolak oleh UserManagement.");
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return failure("Sesi login tidak valid atau sudah kedaluwarsa. Silakan coba lagi.");
  }

  try {
    const tokenUrl = getUserManagementApiUrl("oauth/token");
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: oauthClientId(),
      code,
      redirect_uri: callbackUrl(request.url),
      code_verifier: verifier,
    });
    if (process.env.USERMANAGEMENT_OAUTH_CLIENT_SECRET) {
      body.set("client_secret", process.env.USERMANAGEMENT_OAUTH_CLIENT_SECRET);
    }
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      cache: "no-store",
    });
    if (!tokenResponse.ok) return failure("UserManagement tidak menerima sesi login ini. Silakan coba lagi.");

    const oauthTokens = await tokenResponse.json() as { access_token?: unknown };
    if (typeof oauthTokens.access_token !== "string" || !oauthTokens.access_token) return failure("UserManagement tidak mengembalikan kode sesi OAuth yang valid.");
    console.log("oauth token", oauthTokens)
    const exchangeResponse = await fetch(getUserManagementApiUrl("auth/oauth-exchange"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_token: oauthTokens.access_token }),
      cache: "no-store",
    });
    console.log(exchangeResponse);
    if (!exchangeResponse.ok) return failure("UserManagement tidak dapat membuat sesi Map Editor.");
    const auth = userManagementAuthPair(await exchangeResponse.json());
    if (!auth) return failure("UserManagement tidak mengembalikan sesi JWT yang valid.");

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(ACCESS_TOKEN_COOKIE, auth.access_token, cookieOptions(auth.expires_in ?? 900));
    if (auth.refresh_token) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, auth.refresh_token, cookieOptions(60 * 60 * 24 * 30));
    }
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_VERIFIER_COOKIE);
    return response;
  } catch {
    return failure("Layanan UserManagement tidak dapat dihubungi. Silakan coba lagi.");
  }
}
