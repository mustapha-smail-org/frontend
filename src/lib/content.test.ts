import { describe, expect, it } from "vitest";
import { cleanRichText, plainText, safeExternalUrl } from "@/lib/content";

describe("source content", () => {
  it("removes scripts and unsafe attributes while retaining useful structure", () => {
    const result = cleanRichText('<p onclick="bad()">Bonjour <strong>Paris</strong></p><script>alert(1)</script>');
    expect(result).toBe("<p>Bonjour <strong>Paris</strong></p>");
  });
  it("forces safe link attributes and drops hrefless anchors", () => {
    expect(cleanRichText('<a href="https://paris.fr">Site</a>')).toBe('<a href="https://paris.fr" target="_blank" rel="noopener noreferrer">Site</a>');
    expect(cleanRichText("<a>orphan</a>")).toBe("");
  });
  it("produces plain text without markup or entities, with a fallback", () => {
    expect(plainText("<p>Expo&nbsp;<b>ouverte</b></p>")).toBe("Expo ouverte");
    expect(plainText(null, "N/A")).toBe("N/A");
  });
  it("keeps web URLs and rejects everything else", () => {
    expect(safeExternalUrl("https://paris.fr/")).toBe("https://paris.fr/");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
  });
});
