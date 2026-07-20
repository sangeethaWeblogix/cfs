/**
 * Server-side fetch of initial pool data for SSR/ISR.
 *
 * Priority:
 *  1. Cloudflare KV REST API (pre-warmed by WP admin warmer) — fast, no WP needed
 *  2. WordPress pool_test directly (when seed > 0) — bypasses Cloudflare's pool cache
 *     which strips `seed` from its cache key, returning the same pool for all seeds.
 *  3. /api/pool-listings/ — live fetch through Cloudflare → WP (seed=0 fallback)
 *
 * The parsed result is passed as `initialPool` to StateHome so the SSR HTML
 * contains real product listings from the first byte.
 */

import { Listing, SeoV2, buildFeaturedOrder } from "./listingShared";
import type { InitialPool } from "./home";
import type { FilterState } from "./StateFilterBar";

const CF_ACCOUNT_ID   = process.env.CF_ACCOUNT_ID;
const CF_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN    = process.env.CF_API_TOKEN;
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL || "https://www.caravansforsale.com.au";
// Direct WP API — used when seed > 0 to bypass Cloudflare's pool cache (which strips seed).
const WP_API_BASE     = process.env.NEXT_PUBLIC_CFS_API_BASE;
const WP_API_KEY      = process.env.CFS_API_KEY;

/**
 * Build the canonical KV key for pool data — must match worker.js buildPoolCacheKey().
 * Only state/region/category/condition are part of the KV key (the worker only caches
 * these combinations). All other filters (sleeping capacity, ATM, length, make, etc.)
 * are NOT in the KV key because those pages aren't pre-cached in json:pool: KV.
 */
function buildPoolKvKey(filters: FilterState): string {
  const params: Record<string, string> = {};
  if (filters.state)     params.state     = String(filters.state);
  if (filters.region)    params.region    = String(filters.region);
  if (filters.category)  params.category  = String(filters.category);
  if (filters.condition) params.condition = String(filters.condition);

  // If there are non-cacheable filters present, skip KV entirely — no point
  // looking up json:pool:_root for a sleeping-capacity or ATM page.
  const hasNonCacheable = !!(
    filters.from_sleep || filters.to_sleep ||
    filters.minKg || filters.maxKg ||
    filters.from_length || filters.to_length ||
    filters.from_price || filters.to_price ||
    filters.make || filters.model ||
    filters.suburb || filters.pincode ||
    filters.acustom_fromyears || filters.acustom_toyears ||
    filters.keyword
  );
  if (hasNonCacheable) return "";   // empty string = skip KV lookup

  const sorted = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  return `json:pool:${sorted || "_root"}`;
}

/** Build the /api/pool-listings/ query string from the full FilterState. */
function buildApiParams(filters: FilterState, seed: number): URLSearchParams {
  const params = new URLSearchParams({ orderby: "default", per_page: "24", page: "1", seed: String(seed || 1) });
  if (filters.state)              params.set("state",             String(filters.state));
  if (filters.region)             params.set("region",            String(filters.region));
  if (filters.category)           params.set("category",          String(filters.category));
  if (filters.condition)          params.set("condition",         String(filters.condition));
  if (filters.make)               params.set("make",              String(filters.make));
  if (filters.model)              params.set("model",             String(filters.model));
  if (filters.suburb)             params.set("suburb",            String(filters.suburb));
  if (filters.pincode)            params.set("pincode",           String(filters.pincode));
  if (filters.from_price)         params.set("from_price",        String(filters.from_price));
  if (filters.to_price)           params.set("to_price",          String(filters.to_price));
  if (filters.minKg)              params.set("from_atm",          String(filters.minKg));
  if (filters.maxKg)              params.set("to_atm",            String(filters.maxKg));
  if (filters.from_sleep)         params.set("from_sleep",        String(filters.from_sleep));
  if (filters.to_sleep)           params.set("to_sleep",          String(filters.to_sleep));
  if (filters.from_length)        params.set("from_length",       String(filters.from_length));
  if (filters.to_length)          params.set("to_length",         String(filters.to_length));
  if (filters.acustom_fromyears)  params.set("acustom_fromyears", String(filters.acustom_fromyears));
  if (filters.acustom_toyears)    params.set("acustom_toyears",   String(filters.acustom_toyears));
  if (filters.keyword) {
    const kw = String(filters.keyword).replace(/\+/g, " ").trim().replace(/\s+/g, " ");
    if (kw) params.set("search", kw);
  }
  return params;
}

/** Parse a raw pool_test JSON response into the InitialPool shape. */
function parsePoolJson(json: any, isIndexed: boolean): InitialPool | null {
  const seo: SeoV2 | null = json?.data?.seo_v2 ?? json?.seo_v2 ?? null;
  const products: Listing[]         = json?.data?.products         ?? json?.products         ?? [];
  const premiumsRaw: Listing[]      = json?.data?.premium_products  ?? json?.premium_products  ?? [];
  const exclusivesRaw: Listing[]    = json?.data?.exclusive_products ?? json?.exclusive_products ?? [];
  const empExclusivesRaw: Listing[] = json?.data?.emp_exclusive_products ?? json?.emp_exclusive_products ?? [];
  const totalCount: number          = json?.data?.counts?.total_count ?? json?.counts?.total_count ?? products.length;

  if (!products.length && !premiumsRaw.length) return null;

  const totalProducts = json?.data?.pagination?.total_products ?? json?.pagination?.total_products ?? totalCount;
  const perPage = 24;
  const maxPages = Math.max(1, Math.ceil(totalProducts / perPage));

  let featured: Listing[] = [];
  let newItems: Listing[]  = [];
  let usedItems: Listing[] = [];

  if (isIndexed) {
    const featuredSource = products.filter((p) => p.slot_bucket === "featured");
    featured = buildFeaturedOrder(featuredSource, premiumsRaw, exclusivesRaw);
    const featuredIds = new Set(featured.map((p) => p.id));
    newItems  = products.filter((p) => p.slot_bucket === "new"  && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
    usedItems = products.filter((p) => p.slot_bucket === "used" && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
  } else {
    // Non-indexed: combined grid, no slot splitting
    const totalC = totalCount === 0 && empExclusivesRaw.length > 0;
    featured = totalC
      ? empExclusivesRaw
      : buildFeaturedOrder(products, premiumsRaw, exclusivesRaw);
    newItems  = [];
    usedItems = [];
  }

  return { seo, featured, new: newItems, used: usedItems, maxPages, isIndexed };
}

/** Try reading pool data from Cloudflare KV REST API. */
async function fetchFromKV(kvKey: string): Promise<any | null> {
  if (!CF_ACCOUNT_ID || !CF_NAMESPACE_ID || !CF_API_TOKEN) return null;
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}` +
    `/storage/kv/namespaces/${CF_NAMESPACE_ID}/values/${encodeURIComponent(kvKey)}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
      next: { revalidate: 300 }, // edge-cache the KV read for 5 min
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Live fetch — two paths:
 *  - seed > 0: call WordPress pool_test directly (bypasses Cloudflare pool cache
 *    which strips `seed` from its key, so all seeds would hit the same entry).
 *  - seed = 0: call via /api/pool-listings/ through Cloudflare (normal fallback).
 */
async function fetchFromApi(filters: FilterState, seed: number): Promise<any | null> {
  const params = buildApiParams(filters, seed);

  // When a specific seed is requested, the Cloudflare Worker's pool cache must be
  // bypassed — it normalises its cache key by deleting `seed`, so every seed would
  // return the same cached pool. Call WordPress directly instead.
  if (seed > 0 && WP_API_BASE) {
    const hasRealFilter = !!(
      filters.state || filters.region || filters.category || filters.condition ||
      filters.make || filters.model || filters.suburb || filters.pincode ||
      filters.from_price || filters.to_price || filters.minKg || filters.maxKg ||
      filters.from_sleep || filters.to_sleep || filters.from_length || filters.to_length ||
      filters.acustom_fromyears || filters.acustom_toyears || filters.keyword
    );
    if (hasRealFilter) params.set("engine", "typesense");
    try {
      const res = await fetch(`${WP_API_BASE}/pool_test?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          ...(WP_API_KEY && { "X-API-Key": WP_API_KEY }),
        },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const raw = await res.text();
      const jsonStart = raw.indexOf("{");
      return jsonStart >= 0 ? JSON.parse(raw.substring(jsonStart)) : null;
    } catch {
      return null;
    }
  }

  // Default: go through /api/pool-listings/ (Cloudflare orange-cloud → WP).
  try {
    const res = await fetch(`${APP_URL}/api/pool-listings/?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch the initial pool for SSR/ISR rendering.
 *
 * @param seed  When non-zero, skip the KV json:pool: cache (which is seed-agnostic)
 *              and go straight to the live API with this seed. Used by the HTML cache
 *              warmer which passes ?shuffle_seed=N so each KV HTML variant gets a
 *              genuinely different product pool.
 */
export async function fetchInitialPool(
  filters: FilterState,
  isIndexed = true,
  seed = 0
): Promise<InitialPool | null> {
  const kvKey = buildPoolKvKey(filters);

  // 1. Try KV first — only for state/region/category/condition combinations
  //    (other filter types aren't pre-cached in json:pool: KV).
  //    Skip KV when a specific seed is requested: the json:pool: cache is
  //    seed-agnostic and would return the same pool for all 7 variants.
  if (kvKey && !seed) {
    const kvJson = await fetchFromKV(kvKey);
    if (kvJson) {
      const parsed = parsePoolJson(kvJson, isIndexed);
      if (parsed) {
        console.log(`[fetchInitialPool] KV HIT: ${kvKey} (${parsed.featured.length + parsed.new.length + parsed.used.length} products)`);
        return parsed;
      }
    }
    console.log(`[fetchInitialPool] KV MISS: ${kvKey}`);
  } else if (!kvKey) {
    console.log(`[fetchInitialPool] KV skipped (non-cacheable filters)`);
  } else {
    console.log(`[fetchInitialPool] KV skipped (seed=${seed} requested, using live API)`);
  }

  // 2. Fall back to live API (goes through Cloudflare orange-cloud → WP)
  const apiJson = await fetchFromApi(filters, seed);
  if (apiJson) {
    const parsed = parsePoolJson(apiJson, isIndexed);
    if (parsed) {
      console.log(`[fetchInitialPool] API OK seed=${seed} (${parsed.featured.length + parsed.new.length + parsed.used.length} products)`);
      return parsed;
    }
  }

  console.log(`[fetchInitialPool] both KV and API failed for filters: ${JSON.stringify(filters)}`);
  return null;
}
