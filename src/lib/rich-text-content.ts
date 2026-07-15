import sanitizeHtml from "sanitize-html";

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "h2", "h3", "strong", "em", "u", "ul", "ol", "li", "a"],
  allowedAttributes: { a: ["href"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (_tagName, attributes) => {
      const attribs: sanitizeHtml.Attributes = {};
      if (attributes.href && isSafeRichTextHref(attributes.href)) {
        attribs.href = attributes.href;
      }

      return { tagName: "a", attribs };
    },
  },
};

export function isSafeRichTextHref(href: string): boolean {
  const value = href.trim();
  if (!value || value.startsWith("//")) return false;
  if (value.startsWith("/") || value.startsWith("#") || value.startsWith("?")) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function normalizeRichText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const candidate = looksLikeMarkup(trimmed) ? trimmed : plainTextToMarkup(trimmed);
  const cleaned = sanitizeHtml(candidate, sanitizeOptions);
  return hasVisibleContent(cleaned) ? cleaned : "";
}

export function richTextToPlainText(value: string): string {
  const withBreaks = normalizeRichText(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(h2|h3|p|li)>/gi, "\n");

  return sanitizeHtml(withBreaks, { allowedTags: [], allowedAttributes: {} })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeMarkup(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value);
}

function plainTextToMarkup(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeText(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hasVisibleContent(value: string): boolean {
  return (
    sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
      .replace(/&nbsp;/g, " ")
      .trim().length > 0
  );
}
