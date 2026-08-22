import { NextRequest, NextResponse } from "next/server";
import { serverApiBase } from "@/lib/api";

export async function proxyGet(request: NextRequest, upstreamPath: string) {
  const response = await fetch(`${serverApiBase}${upstreamPath}${request.nextUrl.search}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function proxyPost(request: NextRequest, upstreamPath: string) {
  const response = await fetch(`${serverApiBase}${upstreamPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: await request.text(),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}
