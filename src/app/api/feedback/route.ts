import type { NextRequest } from "next/server";
import { proxyPost } from "@/lib/proxy";

export function POST(request: NextRequest) { return proxyPost(request, "/api/v1/feedback"); }
