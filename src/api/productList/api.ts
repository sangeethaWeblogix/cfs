import { fetchParamsCountFromKV } from "@/lib/paramsCountKv";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;

/** Shared headers for every WP API call. */
const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

// ---------------------------------------------------------------------------
// fetchMakeDetails
// make_details is not pre-warmed in KV — rely on Next.js 24h fetch cache.
// ---------------------------------------------------------------------------
export const fetchMakeDetails = async () => {
  const res = await fetch(`${API_BASE}/make_details`, {
    headers: wpHeaders(),
    next: { revalidate: 86400 },
  });
  const json = await res.json();
  return json?.data?.make_options || [];
};

// ---------------------------------------------------------------------------
// fetchModelCounts — KV first (params-count:group_by=model&make={slug})
// Pre-warmed for every indexed make by cfs-params-cache-warmer.php.
// ---------------------------------------------------------------------------
export const fetchModelCounts = async (
  make: string
): Promise<{ name: string; slug: string; count: number }[]> => {
  // 1. KV lookup (pre-warmed key: params-count:group_by=model&make={slug})
  const kvResult = await fetchParamsCountFromKV({ group_by: "model", make });
  if (kvResult) return kvResult.data as { name: string; slug: string; count: number }[];

  // 2. KV miss — fall back to WP with a 1h Next.js fetch cache
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `${API_BASE}/params_count?group_by=model&make=${encodeURIComponent(make)}`,
      {
        headers: wpHeaders(),
        next: { revalidate: 3600 },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data ?? [];
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
};

/** Remove duplicate makes by slug (WP taxonomy can register the same make twice). */
function dedupBySlug<T extends { slug: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((m) => {
    if (seen.has(m.slug)) return false;
    seen.add(m.slug);
    return true;
  });
}

// ---------------------------------------------------------------------------
// fetchMakeCounts — KV first (params-count:group_by=make)
// Pre-warmed as a global combo by cfs-params-cache-warmer.php.
// ---------------------------------------------------------------------------
export const fetchMakeCounts = async (): Promise<
  { name: string; slug: string; count: number }[]
> => {
  // 1. KV lookup
  const kvResult = await fetchParamsCountFromKV({ group_by: "make" });
  if (kvResult)
    return dedupBySlug(kvResult.data as { name: string; slug: string; count: number }[]);

  // 2. KV miss — WP fallback
  try {
    const res = await fetch(`${API_BASE}/params_count?group_by=make`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return dedupBySlug(data?.data ?? []);
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// fetchCategoryCounts — KV first (params-count:group_by=category)
// Pre-warmed as a global combo by cfs-params-cache-warmer.php.
// ---------------------------------------------------------------------------
export const fetchCategoryCounts = async (): Promise<
  { name: string; slug: string; count: number }[]
> => {
  // 1. KV lookup
  const kvResult = await fetchParamsCountFromKV({ group_by: "category" });
  if (kvResult) {
    return (kvResult.data as { name: string; slug: string; count: number }[]).map(
      (c) => ({ ...c, slug: c.slug.replace(/-category$/, "") })
    );
  }

  // 2. KV miss — WP fallback
  try {
    const res = await fetch(`${API_BASE}/params_count?group_by=category`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? []).map(
      (c: { name: string; slug: string; count: number }) => ({
        ...c,
        slug: c.slug.replace(/-category$/, ""),
      })
    );
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// fetchProductList — not pre-warmed in KV; Next.js 1h fetch cache.
// ---------------------------------------------------------------------------
export const fetchProductList = async () => {
  try {
    const res = await fetch(`${API_BASE}/params-product-list`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch product list");
    return await res.json();
  } catch (error) {
    console.error("fetchProductList error:", error);
    return null;
  }
};
