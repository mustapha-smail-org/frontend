import { describe, expect, it } from "vitest";
import { eventFacetsSchema, eventReportPageSchema, eventSummarySchema, feedbackPageSchema } from "@/lib/contracts";

describe("catalog contract", () => {
  it("rejects responses missing corrected schedule fields", () => {
    const result = eventSummarySchema.safeParse({ id:"1",slug:"event-1",title:"Event",summary:null,categories:[],pricing:"FREE",arrondissement:null,venue:null,startAt:null,endAt:null,officialUrl:null,imageUrl:null,imageAlt:null,imageCredit:null,sourceUpdatedAt:null });
    expect(result.success).toBe(false);
  });
  it("parses facet counts and rejects a non-numeric count", () => {
    expect(eventFacetsSchema.safeParse({ categories: [{ value: "Concerts", count: 3 }], arrondissements: [] }).success).toBe(true);
    expect(eventFacetsSchema.safeParse({ categories: [{ value: "x", count: "3" }], arrondissements: [] }).success).toBe(false);
  });
  it("parses a feedback page and rejects an unknown feedback type", () => {
    const base = { id: "1", message: "Merci", email: null, status: "OPEN", createdAt: "2026-08-20T10:00:00Z", processedAt: null, internalNote: null };
    expect(feedbackPageSchema.safeParse({ items: [{ ...base, type: "BUG" }], nextCursor: "1", hasNext: true }).success).toBe(true);
    expect(feedbackPageSchema.safeParse({ items: [{ ...base, type: "SPAM" }], nextCursor: null, hasNext: false }).success).toBe(false);
  });
  it("parses an event report page with its event snapshot", () => {
    const item = { id: "9", eventId: "event-42", eventSlug: "open-air-cinema", eventTitle: "Open Air Cinema", type: "BROKEN_LINK", message: null, email: "a@b.co", status: "OPEN", createdAt: null, processedAt: null, internalNote: null };
    expect(eventReportPageSchema.safeParse({ items: [item], nextCursor: null, hasNext: false }).success).toBe(true);
    expect(eventReportPageSchema.safeParse({ items: [{ ...item, eventTitle: undefined }], nextCursor: null, hasNext: false }).success).toBe(false);
  });
});
