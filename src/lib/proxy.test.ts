import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxyGet, proxyPost } from "@/lib/proxy";

function upstream(body: string, status = 200, contentType: string | null = "application/json") {
  return { status, text: async () => body, headers: { get: (_: string) => contentType } } as unknown as Response;
}

describe("BFF proxy", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("forwards the query string on GET and passes the upstream status through", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(upstream('{"items":[]}', 200));
    const res = await proxyGet(new NextRequest("http://localhost/api/events?limit=5"), "/api/v1/events");
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/v1/events?limit=5");
    expect(res.status).toBe(200); expect(await res.text()).toBe('{"items":[]}');
  });
  it("falls back to a JSON content-type when the upstream omits one", async () => {
    vi.mocked(fetch).mockResolvedValue(upstream("{}", 200, null));
    const res = await proxyGet(new NextRequest("http://localhost/api/categories"), "/api/v1/categories");
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });
  it("relays the request body and status on POST", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(upstream('{"id":"1"}', 201));
    const req = new NextRequest("http://localhost/api/feedback", { method: "POST", body: '{"type":"BUG"}' });
    const res = await proxyPost(req, "/api/v1/feedback");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", body: '{"type":"BUG"}' });
    expect(res.status).toBe(201);
  });
});
