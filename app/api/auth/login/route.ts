import { NextResponse } from "next/server";
import { callbackUrl, cookieOptions, createOAuthState, createPkcePair, getUserManagementApiUrl, oauthClientId, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/features/auth/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const redirectUri = callbackUrl(request.url);
    const state = createOAuthState();
    const { verifier, challenge } = createPkcePair();
    const authorizationUrl = getUserManagementApiUrl("oauth/authorize");
    const params = new URLSearchParams({
      client_id: oauthClientId(),
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    if (process.env.USERMANAGEMENT_OAUTH_SCOPES) params.set("scope", process.env.USERMANAGEMENT_OAUTH_SCOPES);
    authorizationUrl.search = params.toString();

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions(600));
    response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, cookieOptions(600));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan UserManagement belum dikonfigurasi.";
    return NextResponse.json({ message }, { status: 503 });
  }
}
