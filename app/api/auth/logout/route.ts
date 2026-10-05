import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getUserManagementApiUrl, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, REFRESH_TOKEN_COOKIE } from "@/features/auth/lib/oauth";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    try {
      const headers = new Headers({ Authorization: `Bearer ${accessToken}`, Accept: "application/json" });
      if (process.env.USERMANAGEMENT_APPLICATION_ID) headers.set("X-Application-ID", process.env.USERMANAGEMENT_APPLICATION_ID);
      await fetch(getUserManagementApiUrl("auth/logout"), {
        method: "POST",
        headers,
        cache: "no-store",
      });
    } catch {
      // Local sign-out still clears the browser session when UserManagement is unavailable.
    }
  }
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE]) {
    response.cookies.delete(name);
  }
  return response;
}
