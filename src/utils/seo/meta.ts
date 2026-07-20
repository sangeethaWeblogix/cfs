import { parseSlugToFilters } from "@/app/components/urlBuilder";
import type { Metadata } from "next";
import extraIndexedData from "../../../cfs-paths/extra-indexed.json";
import { INDEXABLE_URLS } from "./indexable-urls";
import {
  PRICE_BANDS_ORDERED,
  ATM_BANDS_ORDERED,
  SLEEP_BANDS_ORDERED,
  LENGTH_BANDS_ORDERED,
  ALLOWED_PRICE_BANDS,
  ALLOWED_ATM_BANDS,
  ALLOWED_SLEEP_BANDS,
  ALLOWED_LENGTH_BANDS,
} from "./band-utils";
export { isAllowedSingleBand } from "./band-utils";

const EXTRA_INDEXED_PATHS = new Set<string>(extraIndexedData.paths);

// ─── Extract all numbers from a slug ───
function allNumbers(slug: string): number[] {
  return (slug.match(/\d+/g) || []).map(Number);
}

// ─── Upper bound of a slug (the value a user is "up to") ───
// "under-40000"               → 40000
// "between-20000-30000"       → 30000
// "over-200000"               → Infinity
// "under-1500-kg-atm"         → 1500
// "between-1500-kg-2500-kg"   → 2500
// "over-4500-kg-atm"          → Infinity
// "under-12-length-in-feet"   → 12
// "between-12-14-length-in-feet" → 14
// "over-24-length-in-feet"    → Infinity
function upperBound(slug: string): number {
  if (slug.startsWith("over-")) return Infinity;
  const nums = allNumbers(slug);
  return nums.length > 0 ? Math.max(...nums) : Infinity;
}

// ─── Lower bound of a slug ───
// "under-X"       → 0
// "between-X-Y"   → X (first / min number)
// "over-X"        → X
function lowerBound(slug: string): number {
  if (slug.startsWith("under-")) return 0;
  const nums = allNumbers(slug);
  return nums.length > 0 ? Math.min(...nums) : 0;
}

/**
 * Given a non-allowed band slug, find the best matching allowed band.
 *
 * Strategy by slug type:
 *
 * ── over-X (e.g. over-70000) ──
 *   X is the lower bound the user typed.
 *   Find the allowed band whose lowerBound == X first.
 *   If not found, find the band that contains X (lo < X <= hi).
 *   Falls back to highest band.
 *
 *   over-70000  → between-70000-100000  ✅  (lo=70000 exact match)
 *   over-300000 → over-200000           ✅  (highest band fallback)
 *
 * ── under-X / between-X-Y ──
 *   Use upperBound as the target.
 *   Find the allowed band whose range contains the target (lo < target <= hi).
 *
 *   under-40000        → between-30000-40000  ✅  (target=40000, 30000<40000<=40000)
 *   under-10000        → under-20000          ✅  (target=10000, 0<10000<=20000)
 *   between-25000-28000 → between-20000-30000 ✅  (target=28000, 20000<28000<=30000)
 */
function nearestAllowedBand(slug: string, orderedBands: string[]): string {
  // ── over-X: match by lower bound ──
  if (slug.startsWith("over-")) {
    const x = lowerBound(slug); // the number after "over-"

    // 1. Exact lower-bound match
    const exact = orderedBands.find(b => lowerBound(b) === x);
    if (exact) return exact;

    // 2. Band that contains X  (lo < x <= hi)
    for (let i = 0; i < orderedBands.length; i++) {
      const lo = lowerBound(orderedBands[i]);
      const hi = upperBound(orderedBands[i]);
      if (x > lo && x <= hi) return orderedBands[i];
    }

    // 3. Fallback: highest band
    return orderedBands[orderedBands.length - 1];
  }

  // ── under-X / between-X-Y: match by upper bound ──
  const target = upperBound(slug);

  // Pass 1: exact range match — lo < target <= hi
  for (let i = 0; i < orderedBands.length; i++) {
    const lo = lowerBound(orderedBands[i]);
    const hi = upperBound(orderedBands[i]);
    if (target > lo && target <= hi) return orderedBands[i];
  }

  // Pass 2: target sits just above a band's hi (e.g. under-18 → hi=17 for between-15-17)
  // Find the band with the largest hi that is still < target
  let bestIdx = -1;
  let bestHi = -1;
  for (let i = 0; i < orderedBands.length; i++) {
    const hi = upperBound(orderedBands[i]);
    if (hi !== Infinity && hi < target && hi > bestHi) {
      bestHi = hi;
      bestIdx = i;
    }
  }
  if (bestIdx !== -1) return orderedBands[bestIdx];

  // Fallback: lowest band
  return orderedBands[0];
}

// ─── Detect band type for a slug segment ───
function isPriceLike(s: string): boolean {
  return /^(under|over)-\d+$/.test(s) || /^between-\d+-\d+$/.test(s);
}
function isAtmLike(s: string): boolean {
  return s.includes("-kg-atm");
}
function isSleepLike(s: string): boolean {
  return s.includes("-people-sleeping-capacity");
}
function isLengthLike(s: string): boolean {
  return s.includes("-length-in-feet");
}

// ─── Band resolution result ───
type BandResult =
  | { hasBand: false }
  | { hasBand: true; slug: string; allowed: boolean; canonical: string };

function resolveBand(
  slugSegments: string[],
  BASE_URL: string
): BandResult {
  const priceSlug  = slugSegments.find(isPriceLike);
  const atmSlug    = slugSegments.find(isAtmLike);
  const sleepSlug  = slugSegments.find(isSleepLike);
  const lengthSlug = slugSegments.find(isLengthLike);

  const bandSlug   = priceSlug ?? atmSlug ?? sleepSlug ?? lengthSlug;
  if (!bandSlug) return { hasBand: false };

  // Determine allowed set + ordered list for this band type
  let allowed = false;
  let resolved = bandSlug; // the canonical band slug to use

  if (priceSlug) {
    allowed = ALLOWED_PRICE_BANDS.has(priceSlug);
    if (!allowed) resolved = nearestAllowedBand(priceSlug, PRICE_BANDS_ORDERED);
  } else if (atmSlug) {
    allowed = ALLOWED_ATM_BANDS.has(atmSlug);
    if (!allowed) resolved = nearestAllowedBand(atmSlug, ATM_BANDS_ORDERED);
  } else if (sleepSlug) {
    allowed = ALLOWED_SLEEP_BANDS.has(sleepSlug);
    if (!allowed) resolved = nearestAllowedBand(sleepSlug, SLEEP_BANDS_ORDERED);
  } else if (lengthSlug) {
    allowed = ALLOWED_LENGTH_BANDS.has(lengthSlug);
    if (!allowed) resolved = nearestAllowedBand(lengthSlug, LENGTH_BANDS_ORDERED);
  }

  // Build canonical URL using the resolved (allowed) band slug
  const canonicalBand = `${BASE_URL}/listings/${resolved}/`;

  return { hasBand: true, slug: bandSlug, allowed, canonical: canonicalBand };
}

// ─── Main robots function ───
function getRobotsFromFilters(
  parsed: ReturnType<typeof parseSlugToFilters>,
  slugSegments: string[] = [],
  BASE_URL: string
): { index: boolean; overrideCanonical?: string } {
  const noindex = { index: false };
  const index   = { index: true };

  // ── Always noindex regardless of other filters ──
  if (parsed.suburb)            return noindex;
  if (parsed.condition)         return noindex;
  if (parsed.acustom_fromyears) return noindex;
  if (parsed.search ?? parsed.keyword) {
    const hasOtherFilters = !!(
      parsed.state    ||
      parsed.make     ||
      parsed.category ||
      parsed.model    ||
      resolveBand(slugSegments, BASE_URL).hasBand
    );
    return hasOtherFilters ? noindex : index;
  }

  // ── Static whitelist: 406 extra indexed paths ──
  const slugPath = slugSegments.join("/") + (slugSegments.length > 0 ? "/" : "");
  if (EXTRA_INDEXED_PATHS.has(slugPath)) return index;

  // ── Band pages (weight / price / sleep / length) ──
  const band = resolveBand(slugSegments, BASE_URL);
  if (band.hasBand) {
    const hasOtherFilters = !!(parsed.make || parsed.model || parsed.state || parsed.region || parsed.category);
    // Single-filter allowed band → index
    if (band.allowed && !hasOtherFilters) return index;
    // Non-allowed band slug with no other filters → noindex but canonical → nearest allowed band
    if (!band.allowed && !hasOtherFilters) return { index: false, overrideCanonical: band.canonical };
    return noindex;
  }

  // ── Non-band pages: explicit whitelist ──
  const hasMake   = !!parsed.make;
  const hasModel  = !!parsed.model;
  const hasState  = !!parsed.state;
  const hasRegion = !!parsed.region;
  const hasCat    = !!parsed.category;
  const dims      = [hasMake, hasModel, hasState, hasRegion, hasCat].filter(Boolean).length;

  // Single filter → index
  if (dims === 1) return index; // state | region | category | make (model alone not a real URL)

  // Make + Model (specific model page) → index
  if (dims === 2 && hasMake && hasModel) return index;

  // Category + State → index
  if (dims === 2 && hasCat && hasState && !hasRegion) return index;

  // State + Region → index
  if (dims === 2 && hasState && hasRegion && !hasCat) return index;

  // Category + State + Region → index
  if (dims === 3 && hasCat && hasState && hasRegion) return index;

  // Everything else → noindex
  return noindex;
}

// ─── Title generation from parsed filters (no API call needed) ───
const STATE_NAMES: Record<string, string> = {
  "victoria": "Victoria",
  "new-south-wales": "New South Wales",
  "queensland": "Queensland",
  "south-australia": "South Australia",
  "western-australia": "Western Australia",
  "tasmania": "Tasmania",
  "northern-territory": "Northern Territory",
  "australian-capital-territory": "Australian Capital Territory",
};

function titleCase(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtPrice(n: string): string {
  return `$${parseInt(n, 10).toLocaleString("en-AU")}`;
}

function fmtKg(n: string): string {
  return `${parseInt(n, 10).toLocaleString("en-AU")}kg`;
}

function getBandText(parsed: ReturnType<typeof parseSlugToFilters>): string {
  // ATM (weight)
  const minKg = parsed.minKg ? String(parsed.minKg) : null;
  const maxKg = parsed.maxKg ? String(parsed.maxKg) : null;
  let atmPart = "";
  if (minKg && maxKg) atmPart = `${fmtKg(minKg)} - ${fmtKg(maxKg)} ATM`;
  else if (maxKg)     atmPart = `Under ${fmtKg(maxKg)} ATM`;
  else if (minKg)     atmPart = `Over ${fmtKg(minKg)} ATM`;

  // Price
  const from = parsed.from_price ? String(parsed.from_price) : null;
  const to   = parsed.to_price   ? String(parsed.to_price)   : null;
  let pricePart = "";
  if (from && to) pricePart = `${fmtPrice(from)} - ${fmtPrice(to)}`;
  else if (to)    pricePart = `Under ${fmtPrice(to)}`;
  else if (from)  pricePart = `Over ${fmtPrice(from)}`;

  // Sleep (berths)
  const fromSleep = parsed.from_sleep ? String(parsed.from_sleep) : null;
  const toSleep   = parsed.to_sleep   ? String(parsed.to_sleep)   : null;
  let sleepPart = "";
  if (fromSleep && toSleep) sleepPart = `Sleeping ${fromSleep}-${toSleep} Berths`;
  else if (toSleep)         sleepPart = `Sleeping Up to ${toSleep} Berths`;
  else if (fromSleep)       sleepPart = `Sleeping ${fromSleep}+ Berths`;

  // Length (feet)
  const fromLen = parsed.from_length ? String(parsed.from_length) : null;
  const toLen   = parsed.to_length   ? String(parsed.to_length)   : null;
  let lengthPart = "";
  if (fromLen && toLen) lengthPart = `${fromLen}ft - ${toLen}ft`;
  else if (toLen)       lengthPart = `Under ${toLen}ft`;
  else if (fromLen)     lengthPart = `Over ${fromLen}ft`;

  // Combine all parts — ATM before price, matching API seo_v2.h1 format
  return [atmPart, pricePart, sleepPart, lengthPart].filter(Boolean).join(" ");
}

export function generateTitleFromFilters(
  parsed: ReturnType<typeof parseSlugToFilters>
): string {
  // Build location suffix (shared)
  const locationSuffix = parsed.state
    ? (() => {
        const sk = parsed.state.toLowerCase().replace(/\s+/g, "-");
        const sn = STATE_NAMES[sk] ?? titleCase(parsed.state);
        return parsed.region
          ? ` in ${titleCase(parsed.region)}, ${sn}`
          : ` in ${sn}, Australia`;
      })()
    : " in Australia";

  // Keyword search: treat search term as the primary noun
  if (parsed.search) {
    const kw = titleCase(parsed.search);
    const noun = /caravans?$/i.test(kw) ? kw : `${kw} Caravans`;
    return `${noun} for Sale${locationSuffix}`;
  }

  const parts: string[] = [];

  // Year prefix
  if (parsed.acustom_fromyears) parts.push(String(parsed.acustom_fromyears));

  if (parsed.condition === "New" || parsed.condition === "new") parts.push("New");
  else if (parsed.condition === "Used" || parsed.condition === "used") parts.push("Used");

  if (parsed.make) parts.push(titleCase(parsed.make));
  if (parsed.model) parts.push(titleCase(parsed.model));
  if (parsed.category) parts.push(titleCase(parsed.category));

  const baseNoun = parts.length > 0 ? `${parts.join(" ")} Caravans` : "Caravans";
  const band = getBandText(parsed);
  const bandPart = band ? ` ${band}` : "";

  return `${baseNoun} for Sale${bandPart}${locationSuffix}`;
}

export async function metaFromSlug(
  filters: string[] = [],
  searchParams: Record<string, string | string[] | undefined> = {}
): Promise<Metadata> {
  const BASE_URL = "https://www.caravansforsale.com.au";

  const parsed = parseSlugToFilters(filters, searchParams);

  const slugPath = filters.length > 0 ? filters.join("/") : "";
  const canonicalUrl = `${BASE_URL}/listings/${slugPath ? slugPath + "/" : ""}`;
  const urlPath = `/listings/${slugPath ? slugPath + "/" : ""}`;
  const robotsResult = { index: INDEXABLE_URLS.has(urlPath) };

  // ── suburb canonical fix ──
  let canonical = canonicalUrl;
  if (parsed.suburb) {
    const locationSegments = filters.filter(
      (seg) =>
        seg.endsWith("-state") ||
        seg.endsWith("-region") ||
        seg.endsWith("-suburb")
    );
    canonical = `${BASE_URL}/listings/${locationSegments.join("/")}/`;
  }

  // ── keyword combination canonical fix ──
  // For /listings/victoria-state/.../keyword-search/ → canonical = /listings/keyword-search/
  const searchSeg = (parsed.search ?? parsed.keyword)
    ? filters.find((seg) => seg.endsWith("-search"))
    : null;
  if (searchSeg && !robotsResult.index) {
    canonical = `${BASE_URL}/listings/${searchSeg}/`;
  }

  // Append searchParams (except page=1 and shuffle_seed)
  const spEntries = Object.entries(searchParams).filter(([k, v]) => {
    if (k === "page" && String(v) === "1") return false;
    if (k === "shuffle_seed") return false;
    return true;
  });
  if (spEntries.length > 0) {
    const qs = spEntries
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v[0] : v}`)
      .join("&");
    canonical += `?${qs}`;
  }

  const title = generateTitleFromFilters(parsed);
  const description =
    "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.";

  return {
    title: { absolute: title },
    description,
    robots: { index: robotsResult.index },
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
    },
    alternates: { canonical, languages: {}, media: {} },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [
        {
          url: "https://www.caravansforsale.com.au/images/cfs-logo.png",
          width: 800,
          height: 600,
          alt: "Caravans for Sale Australia",
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}