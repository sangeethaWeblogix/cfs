import { buildApiUrl } from "./urlUtils";
import type { FilterState } from "./StateFilterBar";
import type { SeoV2 } from "./StateListingGrid";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

/** Server-side counterpart to the shared pool's client fetch — same params,
 * so generateMetadata's title/description (and page source) match what the
 * client later patches document.title to. */
export async function fetchDemoSeo(filters: FilterState): Promise<SeoV2 | null> {
  try {
    const qs = buildApiUrl("?per_page=1", filters, 1);
    const res = await fetch(`${API_BASE}/pool_test${qs}`, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const data = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);
    return data?.data?.seo_v2 ?? data?.seo_v2 ?? null;
  } catch {
    return null;
  }
}
