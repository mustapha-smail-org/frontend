import { describe, expect, it } from "vitest";
import { eventFacetsSchema, eventSummarySchema } from "@/lib/contracts";

describe("catalog contract", () => {
  it("rejects responses missing corrected schedule fields", () => {
    const result = eventSummarySchema.safeParse({ id:"1",slug:"event-1",title:"Event",summary:null,categories:[],pricing:"FREE",arrondissement:null,venue:null,startAt:null,endAt:null,officialUrl:null,imageUrl:null,imageAlt:null,imageCredit:null,sourceUpdatedAt:null });
    expect(result.success).toBe(false);
  });
  it("parses facet counts and rejects a non-numeric count", () => {
    expect(eventFacetsSchema.safeParse({ categories: [{ value: "Concerts", count: 3 }], arrondissements: [] }).success).toBe(true);
    expect(eventFacetsSchema.safeParse({ categories: [{ value: "x", count: "3" }], arrondissements: [] }).success).toBe(false);
  });
});
