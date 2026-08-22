import { describe, expect, it } from "vitest";
import { cartoTileUrl } from "@/lib/mapTiles";

describe("cartoTileUrl", () => {
  it("selects the dark or light CARTO basemap by theme", () => {
    expect(cartoTileUrl(true)).toContain("/dark_all/");
    expect(cartoTileUrl(false)).toContain("/light_all/");
    expect(cartoTileUrl(false)).toMatch(/^https:\/\/\{s\}\.basemaps\.cartocdn\.com\//);
  });
});
