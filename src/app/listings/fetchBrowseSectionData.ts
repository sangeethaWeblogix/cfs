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
export async function fetchGroupCountsServer(
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

/**
 * Band count for all pages — KV first (total_products if warmer stores it),
 * then product_exists_check live fallback which returns { count, exists }.
 * Replaces both the old pool_test (indexed) and exists-only (noindex) paths.
 */
async function fetchBandCountServer(scope: Record<string, string>, query: string): Promise<number> {
  // 1. Try KV cache (warmer may store total_products for non-group_by combos)
  const bandParams: Record<string, string> = { ...scope };
  new URLSearchParams(query).forEach((v, k) => { bandParams[k] = v; });
  const kv = await fetchParamsCountFromKV(bandParams);
  if (kv?.total_products != null) return kv.total_products;

  // 2. Live fallback — product_exists_check returns { success, exists, count }
  try {
    const qs = new URLSearchParams(bandParams);
    console.warn(`[band] KV miss — calling product_exists_check | params="${qs.toString()}"`);
    const res = await fetch(`${API_BASE}/product_exists_check?${qs.toString()}`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return json?.count ?? (json?.exists ? 1 : 0);
  } catch {
    return 0;
  }
}

async function fetchAllBandCountsServer(scope: Record<string, string>) {
  const [price, atm, length, sleep] = await Promise.all([
    Promise.all(PRICE_BANDS.map((b) => fetchBandCountServer(scope, b.query))),
    Promise.all(ATM_BANDS.map((b) => fetchBandCountServer(scope, b.query))),
    Promise.all(LENGTH_BANDS.map((b) => fetchBandCountServer(scope, b.query))),
    Promise.all(SLEEP_BANDS.map((b) => fetchBandCountServer(scope, b.query))),
  ]);
  return { price, atm, length, sleep };
}

/** Server-side mirror of StateBrowseSection's four client-fetch modes — run
 * during SSR/ISR so the section's links land in the initial HTML instead of
 * only appearing after the client's useEffect fetches finish.
 *
 * Band counts use KV cache first, falling back to product_exists_check live API
 * (returns { count, exists }) — same path for both indexed and noindex pages.
 */
export async function fetchBrowseSectionData(
  filters: { state?: string; region?: string; category?: string },
): Promise<BrowseSectionData> {
  const { state, region, category } = filters;
  const hasState = !!state;
  const hasRegion = !!region;
  const hasCategory = !!category;

  const categoryOnly            = !hasState && hasCategory;
  const stateRegionMode         = hasState && hasRegion && !hasCategory;
  const categoryStateMode       = hasState && hasCategory && !hasRegion;
  const categoryStateRegionMode = hasState && hasCategory && hasRegion;

  if (categoryOnly) {
    const scope = { category: category! };
    const [makeCounts, stateCounts, regionCounts, priceCounts] = await Promise.all([
      fetchGroupCountsServer("make", scope),
      fetchGroupCountsServer("state", scope),
      fetchGroupCountsServer("region", scope),
      Promise.all(PRICE_BANDS.map((b) => fetchBandCountServer(scope, b.query))),
    ]);
    return { makeCounts, stateCounts, regionCounts, priceCounts };
  }

  if (stateRegionMode) {
    const scope = { state: state!, region: region! };
    const [makeCounts, categoryCounts, priceCounts, atmCounts, sleepCounts] = await Promise.all([
      fetchGroupCountsServer("make", scope),
      fetchGroupCountsServer("category", scope),
      Promise.all(PRICE_BANDS.map((b) => fetchBandCountServer(scope, b.query))),
      Promise.all(ATM_BANDS.map((b) => fetchBandCountServer(scope, b.query))),
      Promise.all(SLEEP_BANDS.map((b) => fetchBandCountServer(scope, b.query))),
    ]);
    return { makeCounts, categoryCounts, priceCounts, atmCounts, sleepCounts };
  }

  if (categoryStateMode) {
    const scope = { category: category!, state: state! };
    const [regionCounts, makeCounts, bands] = await Promise.all([
      fetchGroupCountsServer("region", scope),
      fetchGroupCountsServer("make", scope),
      fetchAllBandCountsServer(scope),
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
      fetchAllBandCountsServer(scope),
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
