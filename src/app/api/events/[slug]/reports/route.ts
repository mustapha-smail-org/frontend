import type { NextRequest } from "next/server";
import { proxyPost } from "@/lib/proxy";

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return proxyPost(request, `/api/v1/events/${encodeURIComponent(slug)}/reports`);
}
