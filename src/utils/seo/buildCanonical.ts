// utils/seo/buildCanonical.ts
export function buildCanonicalUrl(
  basePath: string,
  slugSegments: string[] = [],
  filters: Record<string, string | number | undefined> = {}
): string {
  // Build path
  let path = slugSegments.length
    ? `${basePath}/${slugSegments.join("/")}`
    : basePath;

  // 🔑 Normalize: strip trailing slash
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  // ✅ Only keep "page" in canonical if > 1
  const qs = new URLSearchParams();
  if (filters.page && typeof filters.page === "number" && filters.page > 1) {
    qs.append("page", String(filters.page));
  }

  const qstr = qs.toString();
  return qstr ? `${path}?${qstr}` : path;
}
