import type { NextRequest } from "next/server";

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

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("Content-Type", upstreamType);
    responseHeaders.set("Cache-Control", "no-store");

    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
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
