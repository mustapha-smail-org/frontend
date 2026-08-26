import { describe, expect, it } from "vitest";
import { arrondissementLabel, formatDateRange, formatEventDate, formatSchedule, priceLabel } from "@/lib/format";

describe("formatSchedule", () => {
  it("uses the next display occurrence instead of a historical source start", () => {
    expect(formatSchedule({ startAt: "2023-01-01T10:00:00+01:00", displayStartAt: "2026-08-22T20:00:00+02:00", ongoing: false })).toContain("samedi 22 août");
  });
  it("labels a continuous event by its end date", () => {
    expect(formatSchedule({ startAt: "2023-01-01T10:00:00+01:00", displayEndAt: "2026-08-31T23:00:00+02:00", ongoing: true })).toBe("Jusqu’au lundi 31 août");
  });
  it("falls back to the source start, then the label, then a placeholder", () => {
    expect(formatSchedule({ startAt: "2026-08-22T20:00:00+02:00" })).toContain("samedi 22 août");
    expect(formatSchedule({ scheduleLabel: "Tous les jeudis" })).toBe("Tous les jeudis");
    expect(formatSchedule({})).toBe("Date à confirmer");
  });
});

describe("date and pricing labels", () => {
  it("formats a single event date and guards against invalid input", () => {
    expect(formatEventDate("2026-08-22T20:00:00+02:00")).toContain("samedi 22 août");
    expect(formatEventDate(null)).toBe("Date à confirmer");
  });
  it("renders a start/end range, a lone start, and a missing start", () => {
    expect(formatDateRange("2026-08-22T20:00:00+02:00", "2026-08-24T20:00:00+02:00")).toContain(" - ");
    expect(formatDateRange("2026-08-22T20:00:00+02:00", null)).toContain("samedi 22 août");
    expect(formatDateRange(null, null)).toBe("Horaire à confirmer");
  });
  it("normalizes pricing and arrondissement labels", () => {
    expect(priceLabel("gratuit")).toBe("Gratuit"); expect(priceLabel("PAID")).toBe("Payant"); expect(priceLabel(null)).toBe("Tarif à confirmer");
    expect(priceLabel("FREE_CONDITIONAL")).toBe("Gratuit sous condition");
    expect(arrondissementLabel(11)).toBe("Paris 11e"); expect(arrondissementLabel(null)).toBe("Paris");
  });
});
