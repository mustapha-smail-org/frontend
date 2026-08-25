import type { NextRequest } from "next/server";
import { proxyGet } from "@/lib/proxy";

export function GET(request: NextRequest) {
  const token = request.headers.get("x-admin-token") ?? "";
  return proxyGet(request, "/api/v1/feedback", { "X-Admin-Token": token });
}
