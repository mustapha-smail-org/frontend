import sanitizeHtml from "sanitize-html";

export function cleanRichText(value: string | null) {
  return sanitizeHtml(value?.replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>") ?? "", {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "h2", "h3", "blockquote", "a"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_tagName, attributes) => ({ tagName: "a", attribs: { ...attributes, target: "_blank", rel: "noopener noreferrer" } }),
    },
    exclusiveFilter: (frame) => frame.tag === "a" && !frame.attribs.href,
  }).trim();
}

export function plainText(value: string | null, fallback = "") {
  const text = sanitizeHtml(value ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text || fallback;
}

export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch { return null; }
}
