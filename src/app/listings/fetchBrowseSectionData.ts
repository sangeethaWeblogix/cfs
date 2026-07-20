import { fetchParamsCountFromKV } from "@/lib/paramsCountKv";
import {
  PRICE_BANDS,
  ATM_BANDS,
  LENGTH_BANDS,
  SLEEP_BANDS,
  type CountItem,
  type BrowseSectionData,
} from "./browseSectionShared";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

/** KV first (shared pre-warmed cache), WP params_count fallback. */
async function fetchGroupCountsServer(
  groupBy: string,
  scope: Record<string, string>
): Promise<CountItem[]> {
  const kv = await fetchParamsCountFromKV({ group_by: groupBy, ...scope });
  if (kv) return kv.data as CountItem[];

  try {
    const qs = new URLSearchParams({ group_by: groupBy, ...scope });
    const res = await fetch(`${API_BASE}/params_count?${qs.toString()}`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

/** Same pool_test endpoint used for SEO head data — just needs total_products. */
async function fetchBandCountServer(scope: Record<string, string>, query: string): Promise<number> {
  try {
    const qs = new URLSearchParams({ per_page: "1", ...scope });
    const res = await fetch(`${API_BASE}/pool_test?${qs.toString()}&${query}&engine=typesense`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return json?.data?.pagination?.total_products ?? json?.pagination?.total_products ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Lightweight exists-check for noindex pages — avoids the full pool_test
 * overhead. Returns 1 if at least one listing matches, 0 otherwise.
 * Used instead of fetchBandCountServer on pages that are not in the indexed set.
 */
async function fetchBandExistsServer(scope: Record<string, string>, query: string): Promise<number> {
  try {
    const qs = new URLSearchParams({ ...scope });
    new URLSearchParams(query).forEach((v, k) => qs.set(k, v));
    const res = await fetch(`${API_BASE}/product_exists_check?${qs.toString()}`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return json?.exists ? 1 : 0;
  } catch {
    return 0;
  }
}

async function fetchAllBandCountsServer(scope: Record<string, string>, isIndexed: boolean) {
  const fetchBand = isIndexed ? fetchBandCountServer : fetchBandExistsServer;
  const [price, atm, length, sleep] = await Promise.all([
    Promise.all(PRICE_BANDS.map((b) => fetchBand(scope, b.query))),
    Promise.all(ATM_BANDS.map((b) => fetchBand(scope, b.query))),
    Promise.all(LENGTH_BANDS.map((b) => fetchBand(scope, b.query))),
    Promise.all(SLEEP_BANDS.map((b) => fetchBand(scope, b.query))),
  ]);
  return { price, atm, length, sleep };
}

/** Server-side mirror of StateBrowseSection's four client-fetch modes — run
 * during SSR/ISR so the section's links land in the initial HTML instead of
 * only appearing after the client's useEffect fetches finish.
 *
 * isIndexed controls which band-count strategy is used:
 *   true  → pool_test (full count, used for indexed/SEO pages)
 *   false → product_exists_check (boolean, lightweight — used for noindex pages)
 */
export async function fetchBrowseSectionData(
  filters: { state?: string; region?: string; category?: string },
  isIndexed = true,
): Promise<BrowseSectionData> {
  const { state, region, category } = filters;
  const hasState = !!state;
  const hasRegion = !!region;
  const hasCategory = !!category;

  const categoryOnly            = !hasState && hasCategory;
  const stateRegionMode         = hasState && hasRegion && !hasCategory;
  const categoryStateMode       = hasState && hasCategory && !hasRegion;
  const categoryStateRegionMode = hasState && hasCategory && hasRegion;

  // Choose band-count fetcher based on whether this page is indexed
  const fetchBand = isIndexed ? fetchBandCountServer : fetchBandExistsServer;

  if (categoryOnly) {
    const scope = { category: category! };
    const [makeCounts, stateCounts, regionCounts, priceCounts] = await Promise.all([
      fetchGroupCountsServer("make", scope),
      fetchGroupCountsServer("state", scope),
      fetchGroupCountsServer("region", scope),
      Promise.all(PRICE_BANDS.map((b) => fetchBand(scope, b.query))),
    ]);
    return { makeCounts, stateCounts, regionCounts, priceCounts };
  }

  if (stateRegionMode) {
    const scope = { state: state!, region: region! };
    const [makeCounts, categoryCounts, priceCounts, atmCounts, sleepCounts] = await Promise.all([
      fetchGroupCountsServer("make", scope),
      fetchGroupCountsServer("category", scope),
      Promise.all(PRICE_BANDS.map((b) => fetchBand(scope, b.query))),
      Promise.all(ATM_BANDS.map((b) => fetchBand(scope, b.query))),
      Promise.all(SLEEP_BANDS.map((b) => fetchBand(scope, b.query))),
    ]);
    return { makeCounts, categoryCounts, priceCounts, atmCounts, sleepCounts };
  }

  if (categoryStateMode) {
    const scope = { category: category!, state: state! };
    const [regionCounts, makeCounts, bands] = await Promise.all([
      fetchGroupCountsServer("region", scope),
      fetchGroupCountsServer("make", scope),
      fetchAllBandCountsServer(scope, isIndexed),
    ]);
    return {
      regionCounts,
      makeCounts,
      priceCounts: bands.price,
      atmCounts: bands.atm,
      lengthCounts: bands.length,
      sleepCounts: bands.sleep,
    };
  }

  if (categoryStateRegionMode) {
    const scope = { category: category!, state: state!, region: region! };
    const [makeCounts, bands] = await Promise.all([
      fetchGroupCountsServer("make", scope),
      fetchAllBandCountsServer(scope, isIndexed),
    ]);
    return {
      makeCounts,
      priceCounts: bands.price,
      atmCounts: bands.atm,
      lengthCounts: bands.length,
      sleepCounts: bands.sleep,
    };
  }

  // Default mode (no state/category, or state-only) — the pills rendered
  // here are static (STATES/TYPES_NO_STATE/FILTERS_NO_STATE) or come from
  // getRegionsByState, none of which need count data at all.
  return {};
}
