import { parseSlugToFilters } from "@/app/components/urlBuilder";
import { buildSlugFromFilters } from "@/app/components/slugBuilter";
import type { FilterState } from "./StateFilterBar";

const ORDERBY = "default";

/** Builds a pool-listings query string — shared by the client grids (home.tsx)
 * and the server-side generateMetadata fetch (page.tsx) so both hit the exact
 * same filter/lock combination and get back the exact same seo_v2. */
export function buildApiUrl(base: string, filters: FilterState, seed: number, lockCondition?: string): string {
  const params = new URLSearchParams();
  params.set("orderby", ORDERBY);
  params.set("seed", String(seed));
  if (filters.state)              params.set("state",              filters.state);
  if (filters.category)           params.set("category",          filters.category);
  if (filters.make)               params.set("make",               filters.make);
  if (filters.model)              params.set("model",              filters.model);
  if (filters.region)             params.set("region",             filters.region);
  if (filters.suburb)             params.set("suburb",             filters.suburb);
  if (filters.pincode)            params.set("pincode",            filters.pincode);
  if (filters.from_price)         params.set("from_price",         String(filters.from_price));
  if (filters.to_price)           params.set("to_price",           String(filters.to_price));
  if (filters.minKg)              params.set("from_atm",           String(filters.minKg));
  if (filters.maxKg)              params.set("to_atm",             String(filters.maxKg));
  if (filters.from_sleep)         params.set("from_sleep",         String(filters.from_sleep));
  if (filters.to_sleep)           params.set("to_sleep",           String(filters.to_sleep));
  if (filters.acustom_fromyears)  params.set("acustom_fromyears",  String(filters.acustom_fromyears));
  if (filters.acustom_toyears)    params.set("acustom_toyears",    String(filters.acustom_toyears));
  if (filters.from_length)        params.set("from_length",        String(filters.from_length));
  if (filters.to_length)          params.set("to_length",          String(filters.to_length));
  // Backend free-text search only recognizes `search` (see production's
  // fetchListings) — not `keyword`. Sending `keyword` here silently no-ops
  // and the pool call falls back to the full unfiltered listing set.
  if (filters.keyword) {
    const normalized = String(filters.keyword).replace(/\+/g, " ").trim().replace(/\s+/g, " ");
    if (normalized) params.set("search", normalized);
  }
  if (!lockCondition && filters.condition) params.set("condition", filters.condition);
  if (lockCondition) params.set("condition", lockCondition);
  return `${base}&${params.toString()}`;
}

/** demo's FilterState uses `keyword`; the shared slug builder/parser uses `search`. */
export function buildDemoSlug(filters: FilterState): string {
  const { keyword, ...rest } = filters;
  const shared = { ...rest, search: keyword || undefined };
  return buildSlugFromFilters(shared).replace(/^\/listings/, "/demo");
}

/** Real /listings/ URL for a "View all" link — keeps the active filters
 * (e.g. category + state) and optionally locks the condition segment, so
 * the Featured/New/Used sections each link to the matching filtered page. */
export function buildListingsSlug(filters: FilterState, conditionOverride?: string): string {
  const { keyword, condition, ...rest } = filters;
  const shared = { ...rest, search: keyword || undefined, condition: conditionOverride ?? condition };
  const path = buildSlugFromFilters(shared);
  return path.endsWith("/") ? path : `${path}/`;
}

const toTitleCase = (s: string) => s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export interface FilterBreadcrumb {
  label: string;
  /** Direct link to the page for just this one filter dimension (e.g. the
   * category crumb links straight to /listings/luxury-category/), not the
   * combination of every active filter. */
  href: string;
}

/** Priority order for the visible breadcrumb trail — Home > Listings > up to
 * three of these, in this fixed order, regardless of the order the user
 * actually applied the filters in. `label` reads the display text; `hrefFilters`
 * picks out just the filter keys for this dimension so the crumb links to its
 * own dedicated page instead of the full active-filter combination. */
const BREADCRUMB_PRIORITY: Array<{
  label: (f: FilterState) => string | null;
  hrefFilters: (f: FilterState) => FilterState;
}> = [
  {
    label: (f) => {
      const raw = f.suburb || f.region || f.state;
      return raw ? toTitleCase(String(raw)) : null;
    },
    hrefFilters: (f) => ({ state: f.state, region: f.region, suburb: f.suburb, pincode: f.pincode }),
  },
  {
    label: (f) => (f.category ? toTitleCase(String(f.category)) : null),
    hrefFilters: (f) => ({ category: f.category }),
  },
  {
    label: (f) => (f.make ? toTitleCase(String(f.make)) : null),
    hrefFilters: (f) => ({ make: f.make }),
  },
  {
    label: (f) => {
      if (!f.from_price && !f.to_price) return null;
      if (f.from_price && f.to_price) return `$${Number(f.from_price).toLocaleString()} – $${Number(f.to_price).toLocaleString()}`;
      if (f.from_price) return `From $${Number(f.from_price).toLocaleString()}`;
      return `Upto $${Number(f.to_price).toLocaleString()}`;
    },
    hrefFilters: (f) => ({ from_price: f.from_price, to_price: f.to_price }),
  },
  {
    label: (f) => {
      if (!f.minKg && !f.maxKg) return null;
      if (f.minKg && f.maxKg) return `${Number(f.minKg).toLocaleString()} – ${Number(f.maxKg).toLocaleString()} kg`;
      if (f.minKg) return `From ${Number(f.minKg).toLocaleString()} kg`;
      return `Upto ${Number(f.maxKg).toLocaleString()} kg`;
    },
    hrefFilters: (f) => ({ minKg: f.minKg, maxKg: f.maxKg }),
  },
  {
    label: (f) => {
      if (!f.from_sleep && !f.to_sleep) return null;
      if (f.from_sleep && f.to_sleep) return `${f.from_sleep} – ${f.to_sleep} Berths`;
      if (f.from_sleep) return `From ${f.from_sleep} Berths`;
      return `Upto ${f.to_sleep} Berths`;
    },
    hrefFilters: (f) => ({ from_sleep: f.from_sleep, to_sleep: f.to_sleep }),
  },
  {
    label: (f) => {
      if (!f.from_length && !f.to_length) return null;
      if (f.from_length && f.to_length) return `${f.from_length} – ${f.to_length} ft`;
      if (f.from_length) return `From ${f.from_length} ft`;
      return `Upto ${f.to_length} ft`;
    },
    hrefFilters: (f) => ({ from_length: f.from_length, to_length: f.to_length }),
  },
  {
    label: (f) => {
      if (!f.acustom_fromyears && !f.acustom_toyears) return null;
      if (f.acustom_fromyears && f.acustom_toyears) return `${f.acustom_fromyears} – ${f.acustom_toyears}`;
      if (f.acustom_fromyears) return `From ${f.acustom_fromyears}`;
      return `Upto ${f.acustom_toyears}`;
    },
    hrefFilters: (f) => ({ acustom_fromyears: f.acustom_fromyears, acustom_toyears: f.acustom_toyears }),
  },
  {
    label: (f) => (f.condition ? (f.condition.toLowerCase() === "new" ? "New" : "Used") : null),
    hrefFilters: (f) => ({ condition: f.condition }),
  },
];

/** Home > Caravans for Sale > up to 3 active filters — always rendered in
 * BREADCRUMB_PRIORITY order (Location, Type, Make, Price, Weight, Sleeps,
 * Size, Year, Condition) so the trail reads the same regardless of which
 * filters the visitor picked or in what order. Each crumb links straight to
 * its own single-filter page (e.g. clicking "Luxury" goes to
 * /listings/luxury-category/, not the current combined-filter URL). */
export function buildFilterBreadcrumbs(filters: FilterState): FilterBreadcrumb[] {
  const crumbs: FilterBreadcrumb[] = [];
  for (const entry of BREADCRUMB_PRIORITY) {
    const label = entry.label(filters);
    if (label) {
      crumbs.push({ label, href: buildListingsSlug(entry.hrefFilters(filters)) });
    }
    if (crumbs.length === 3) break;
  }
  return crumbs;
}

export function parseDemoFilters(
  slugParts: string[],
  query: Record<string, string | string[] | undefined>
): FilterState {
  const { search, condition, ...rest } = parseSlugToFilters(slugParts, query);
  const filters: FilterState = { ...rest };
  if (search) filters.keyword = search;
  if (condition) filters.condition = condition.toLowerCase();
  return filters;
}
