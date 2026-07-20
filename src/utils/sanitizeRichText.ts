/**
 * Cleans up HTML that was pasted into the CMS from Google Sheets/Docs.
 * Strips the inline style/font junk (color, font-size, font-family,
 * data-sheets-root, etc.) and turns \r\n line breaks into real paragraphs,
 * so the content renders using the site's own typography instead of
 * whatever formatting was copied in.
 */
export function sanitizeRichText(html?: string | null): string {
  if (!html) return "";

  const withoutJunkAttrs = html
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sdata-sheets-[a-z-]*="[^"]*"/gi, "")
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    // CMS content often has only a single line break after a heading
    // (not a blank line) — force a paragraph break there so the body
    // text doesn't get merged into the same block as the heading.
    .replace(/(<\/h[1-6]>)\s*?\r?\n(?!\r?\n)/gi, "$1\n\n");

  const paragraphs = withoutJunkAttrs
    .split(/\r\n\r\n|\n\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (/^<h[1-6]>/i.test(p) ? p : `<p>${p.replace(/\r\n|\n/g, "<br/>")}</p>`));

  return paragraphs.join("");
}
