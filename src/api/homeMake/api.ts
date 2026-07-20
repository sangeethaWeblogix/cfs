// src/api/products/fetchRangeFeaturedCategories.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export interface RangeFeaturedCategory {
  term_id: number;
  name: string;
  slug?: string;
  description?: string; // cleaned (tags stripped, entities decoded)
  custom_link?: string | null;
  caravan_type?: string | null;
  logo_url?: string | null;
  is_top?: boolean | null; // some APIs send 0/1/bool; we’ll normalize to boolean/null
  [k: string]: unknown; // keep extra fields without breaking
}

// minimal HTML clean: strip tags + decode common entities
function cleanHtmlToText(input: unknown): string | undefined {
  if (input == null) return undefined;
  const s = String(input);
  const noTags = s.replace(/<[^>]*>/g, " "); // remove tags
  return noTags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const fetchRangeFeaturedCategories = async (): Promise<
  RangeFeaturedCategory[]
> => {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");

  const url = `${API_BASE}/range-featured-categories`; // ✅ new endpoint
  // if (typeof window !== "undefined") console.log("[Products API] GET", url);

  try {
const res = await fetch(url, {
  cache: "no-store",
  headers: {
    Accept: "application/json",
    ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Missing — add this
  },
});
    if (!res.ok)
      throw new Error(`Products API failed: ${res.status} ${res.statusText}`);

    const raw = await res.json();

    // Expect an array; if not, return empty array safely
    if (!Array.isArray(raw)) {
      console.warn("[Products API] Unexpected payload (not array):", raw);
      return [];
    }

    // Normalize/clean each item
    const items: RangeFeaturedCategory[] = raw.map((it: unknown) => {
      const obj = it as Record<string, unknown>; // safe cast for property access
      const term_id = Number(obj.term_id);

      return {
        term_id: Number.isFinite(term_id) ? term_id : -1,
        name: String(obj?.name ?? "").trim(),
        slug: obj?.slug ? String(obj.slug) : undefined,
        description: cleanHtmlToText(obj?.description),
        custom_link: obj?.custom_link ? String(obj.custom_link) : null,
        caravan_type: obj?.caravan_type ? String(obj.caravan_type) : null,
        logo_url: obj?.logo_url ? String(obj.logo_url) : null,
        is_top:
          typeof obj?.is_top === "boolean"
            ? obj.is_top
            : obj?.is_top == null
            ? null
            : String(obj.is_top) === "1",
        ...obj, // keep extra fields
      };
    });
    // Optional: filter out invalid rows
    return items.filter((x) => x.term_id !== -1 && x.name);
  } catch (err) {
    console.error("fetchRangeFeaturedCategories error:", err);
    return [];
  }
};
