import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, getUserManagementApiUrl, REFRESH_TOKEN_COOKIE, userManagementAuthPair } from "@/features/auth/lib/oauth";

export const dynamic = "force-dynamic";

const TILESERVER_BASE_URL = (process.env.TILESERVER_API_URL ?? "http://localhost:8050").replace(/\/$/, "");

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: Context): Promise<Response> {
  const { path } = await context.params;

  if (path.length < 2 || path[0] !== "api" || path[1] !== "v1" || path.some((segment) => segment === "." || segment === "..")) {
    return Response.json({ error: "Tileserver path is not allowed." }, { status: 400 });
  }

  const target = new URL(`${TILESERVER_BASE_URL}/${path.map(encodeURIComponent).join("/")}`);
  target.search = new URL(request.url).search;

  const headers = new Headers({ Accept: request.headers.get("accept") ?? "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (path[2] === "analysis-workspace" && !accessToken) {
    return Response.json({ message: "Login diperlukan untuk mengakses workspace analisis." }, { status: 401 });
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const applicationId = process.env.USERMANAGEMENT_APPLICATION_ID;
  if (applicationId) headers.set("X-Application-ID", applicationId);
  for (const header of ["idempotency-key"]) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }

  try {
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
    let upstream = await fetch(target, { method: request.method, headers, body, cache: "no-store" });
    let rotatedRefreshToken: string | null = null;
    let rotatedAccessExpiresIn = 900;
    if (upstream.status === 401 && refreshToken) {
      const tokenResponse = await fetch(getUserManagementApiUrl("auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
      if (tokenResponse.ok) {
        const auth = userManagementAuthPair(await tokenResponse.json());
        if (auth) {
          accessToken = auth.access_token;
          rotatedRefreshToken = auth.refresh_token ?? null;
          rotatedAccessExpiresIn = auth.expires_in ?? 900;
          headers.set("Authorization", `Bearer ${accessToken}`);
          upstream = await fetch(target, { method: request.method, headers, body, cache: "no-store" });
        }
      }
    }

    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("Content-Type", upstreamType);
    responseHeaders.set("Cache-Control", "no-store");

    const response = new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
    if (accessToken && accessToken !== request.cookies.get(ACCESS_TOKEN_COOKIE)?.value) {
      response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: rotatedAccessExpiresIn });
    }
    if (rotatedRefreshToken) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, rotatedRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    } else if (accessToken !== request.cookies.get(ACCESS_TOKEN_COOKIE)?.value) response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  } catch {
    return Response.json(
      { error: "Tileserver tidak dapat dihubungi. Periksa TILESERVER_API_URL dan service port 8050." },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: Context) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: Context) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: Context) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: Context) {
  return proxy(request, context);
}
