const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;
const SERVER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

export const TYPE_CATEGORIES = ["off-road", "luxury", "hybrid", "pop-top", "touring", "family"] as const;
export type TypeCategory = (typeof TYPE_CATEGORIES)[number];
export type TypeCounts = Partial<Record<TypeCategory, number>>;

async function fetchCategoryCount(category: TypeCategory): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/product_exists_check?category=${category}`, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
        "User-Agent": SERVER_UA,
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
    });
    if (!res.ok) return 0;
    const raw = await res.text();
    if (raw.includes("sgcaptcha") || raw.includes("well-known") || !raw.includes("{")) return 0;
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return json?.count ?? (json?.exists ? 1 : 0);
  } catch {
    return 0;
  }
}

export async function fetchTypeCounts(): Promise<TypeCounts> {
  const counts = await Promise.all(TYPE_CATEGORIES.map(fetchCategoryCount));
  const result: TypeCounts = {};
  TYPE_CATEGORIES.forEach((category, i) => {
    result[category] = counts[i];
  });
  return result;
}
