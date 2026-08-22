import { describe, expect, it } from "vitest";
import { eventSummarySchema } from "@/lib/contracts";

describe("catalog contract", () => {
  it("rejects responses missing corrected schedule fields", () => {
    const result = eventSummarySchema.safeParse({ id:"1",slug:"event-1",title:"Event",summary:null,categories:[],pricing:"FREE",arrondissement:null,venue:null,startAt:null,endAt:null,officialUrl:null,imageUrl:null,imageAlt:null,imageCredit:null,sourceUpdatedAt:null });
    expect(result.success).toBe(false);
  });
});
