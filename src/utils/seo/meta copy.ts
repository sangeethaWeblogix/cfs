 import { fetchListings } from "@/api/listings/api";
 import { parseSlugToFilters } from "@/app/components/urlBuilder";
 import type { Metadata } from "next";
  
 type RobotsResult = { index: boolean };

 export async function metaFromSlug(
  filters: string[] = [],
  searchParams: Record<string, string | string[] | undefined> = {}
): Promise<Metadata> {

  // ─── Allowed bands ───
const ALLOWED_PRICE_BANDS = new Set([
  "under-20000", "between-20000-30000", "between-30000-40000",
  "between-40000-50000", "between-50000-70000", "between-70000-100000",
  "between-100000-150000", "between-150000-200000", "over-200000",
]);

const ALLOWED_ATM_BANDS = new Set([
  "under-1500-kg-atm", "between-1500-kg-2500-kg-atm",
  "between-2500-kg-3500-kg-atm", "between-3500-kg-4500-kg-atm",
  "over-4500-kg-atm",
]);

const ALLOWED_SLEEP_BANDS = new Set([
  "between-1-2-people-sleeping-capacity", "between-3-4-people-sleeping-capacity",
  "between-4-6-people-sleeping-capacity", "over-6-people-sleeping-capacity",
]);

const ALLOWED_LENGTH_BANDS = new Set([
  "under-12-length-in-feet", "between-12-14-length-in-feet",
  "between-15-17-length-in-feet", "between-18-20-length-in-feet",
  "between-21-23-length-in-feet", "over-24-length-in-feet",
]);

// ─── Main robots function ───
 function getRobotsFromFilters(
  parsed: ReturnType<typeof parseSlugToFilters>,
  slugSegments: string[] = []
): { index: boolean } {
  const noindex = { index: false };
  const index   = { index: true };

  // ── Always noindex ──
  if (parsed.model)     return noindex;
  if (parsed.suburb)    return noindex;
  if (parsed.condition) return noindex;
  if (parsed.acustom_fromyears) return noindex;

  // ── Detect band filters ──
  const priceSlug  = slugSegments.find(s => isPriceLike(s));
  const atmSlug    = slugSegments.find(s => s.includes("-kg-atm"));
  const sleepSlug  = slugSegments.find(s => s.includes("-people-sleeping-capacity"));
  const lengthSlug = slugSegments.find(s => s.includes("-length-in-feet"));

  const hasBand = !!(priceSlug || atmSlug || sleepSlug || lengthSlug);

  // ── Validate allowed bands ──
  if (priceSlug  && !ALLOWED_PRICE_BANDS.has(priceSlug))   return noindex;
  if (atmSlug    && !ALLOWED_ATM_BANDS.has(atmSlug))       return noindex;
  if (sleepSlug  && !ALLOWED_SLEEP_BANDS.has(sleepSlug))   return noindex;
  if (lengthSlug && !ALLOWED_LENGTH_BANDS.has(lengthSlug)) return noindex;

  // ── If band present → noindex (PHP: only alone = index) ──
  if (hasBand) {
    // band alone = index, band + anything = noindex
    const hasOtherFilters = !!(parsed.state || parsed.make || parsed.category);
    if (hasOtherFilters) return noindex;
    return index;
  }
  if (parsed.category && parsed.make) return noindex;

  // ── No band filter — count remaining filters ──
  let filterCount = 0;
  if (parsed.state)    filterCount += 1; // region grouped, no extra
  // if (parsed.make)     filterCount += 1;
  if (parsed.category) filterCount += 1;

  if (filterCount > 2) return noindex;

  return index;
}

// helper: detect any price-like slug (even non-allowed ones like "under-10000")
function isPriceLike(s: string): boolean {
  return /^(under|over)-\d+$/.test(s) || /^between-\d+-\d+$/.test(s);
}
  const parsed = parseSlugToFilters(filters, searchParams);

  const page = parsed.page ? Number(parsed.page) : 1;
  const finalFilters = { ...parsed, page };

  const res = await fetchListings(finalFilters);

  // ─── Build canonical from slug + searchParams ───
  const BASE_URL = "https://www.caravansforsale.com.au";
  
   // ─── Build canonical from slug + searchParams ───
 
let canonicalUrl = "";

 

if (parsed.suburb) {

  const locationSegments = filters.filter(
    (seg) =>
      seg.endsWith("-state") ||
      seg.endsWith("-region") ||
      seg.endsWith("-suburb")
  );

  canonicalUrl = `${BASE_URL}/listings/${locationSegments.join("/")}/`;

} else {

  const slugPath = filters.length > 0 ? filters.join("/") : "";
  canonicalUrl = `${BASE_URL}/listings/${slugPath ? slugPath + "/" : ""}`;
}

  // append searchParams (except page=1)
  const spEntries = Object.entries(searchParams).filter(([k, v]) => {
    if (k === "page" && String(v) === "1") return false;
  });

  if (spEntries.length > 0) {
    const qs = spEntries
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v[0] : v}`)
      .join("&");
    canonicalUrl += `?${qs}`;
  }

  // ─── Fallback: API canonical (only if you trust API) ───
  // const canonical = res?.seo_v2?.canonical || canonicalUrl;
  const canonical = canonicalUrl; // ✅ always use actual URL

  const rawTitle =
    res?.seo_v2?.meta_title?.trim() ||
    "Caravans for Sale in Australia - Find Exclusive Deals";
  const title = rawTitle.trim();
  const description =   res?.seo_v2?.meta_description?.trim(); 

  const robots = getRobotsFromFilters(parsed, filters); // filters = slug segments array

  return {
    title: { absolute: title },
    description,
    robots,
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
    },
    alternates: {
      canonical,
      languages: {},
      media: {},
    },
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
  };
}