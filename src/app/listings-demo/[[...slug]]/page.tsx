// app/(listings)/[[...slug]]/page.tsx
import type { Metadata } from "next";
import ListingsPage from "@/app/components/ListContent/Listings";
import { parseSlugToFilters } from "../../components/urlBuilder";
import { getCachedListings } from "@/api/listings/api";
import { redirect, notFound } from "next/navigation";
import "../../components/ListContent/newList.css";
import "../listings.css";
// import { fetchMakeDetails } from "@/api/make-new/api";
import { fetchLinksData } from "@/api/link/api";
import { buildSlugFromFilters } from "@/app/components/slugBuilter";
import {
  buildStaticLinks,
  buildStaticLinkUrl,
  SECTION_TITLES,
} from "@/app/components/ListContent/StaticLinksUtils";
import { fetchProductList, fetchCategoryCounts, fetchMakeCounts, fetchModelCounts } from "@/api/productList/api";
import { calculateDistances } from "@/utils/postcodeCoords";
import { reportGitHubIssue } from "@/lib/reportGitHubIssue";
import { metaFromSlug } from "@/utils/seo/meta";
import { unstable_cache } from "next/cache";
import statesData from "../../../../cfs-paths/states.json";
import regionsData from "../../../../cfs-paths/regions.json";
import categoriesData from "../../../../cfs-paths/categories.json";
import makesData from "../../../../cfs-paths/makes.json";
import catStateData from "../../../../cfs-paths/cat-state.json";
import priceData from "../../../../cfs-paths/price.json";
import sleepData from "../../../../cfs-paths/sleep.json";
import lengthData from "../../../../cfs-paths/length.json";
import atmData from "../../../../cfs-paths/atm.json";
import bossUrlsData from "../../../../cfs-paths/boss-urls.json";

export const revalidate = 86400;

// Stale-on-error cache: if API throws during revalidation, unstable_cache returns
// last-good data so users see the cached page instead of an error.
// Tagged 'listings' so revalidateTag('listings') from the webhook marks it stale
// without purging it — Next.js keeps old data until a fresh fetch succeeds.
const _LISTING_API_CALLS = [
  "getCachedListings",
  "fetchLinksData",
  "fetchProductList",
  "fetchCategoryCounts",
  "fetchMakeCounts",
] as const;

const _makeFetchListingsData = (filtersJson: string, page: number) =>
  unstable_cache(
    async () => {
    const filters = JSON.parse(filtersJson);
    const _t = Date.now();

    // Use allSettled so we can report EXACTLY which API call(s) failed before re-throwing
    const settled = await Promise.allSettled([
      getCachedListings({ ...filters, page }),
      fetchLinksData(filters),
      fetchProductList(),
      fetchCategoryCounts(),
      fetchMakeCounts(),
    ]);
    console.log(`[PERF] allSettled total: ${Date.now() - _t}ms`);

    // Collect failures with API name + error message
    const failures = settled
      .map((r, i) =>
        r.status === "rejected"
          ? { api: _LISTING_API_CALLS[i], error: r.reason instanceof Error ? r.reason.message : String(r.reason) }
          : null
      )
      .filter(Boolean) as { api: string; error: string }[];

    if (failures.length > 0) {
      // Build a readable filter string for the GitHub issue (shows which page failed)
      const filtersDisplay =
        Object.entries(filters as Record<string, unknown>)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${k}=${v}`)
          .join(" | ") || "(root /listings)";

      const firstError = failures[0].error;
      const isBackend =
        firstError.startsWith("API no response") ||
        firstError.startsWith("Backend server error") ||
        firstError.startsWith("Missing or invalid API key") ||
        firstError.startsWith("API endpoint not found") ||
        firstError.startsWith("Invalid API response") ||
        firstError.startsWith("API failed:");

      const detailMsg = [
        `ISR cache revalidation failed — cache NOT updated, serving last-good data to users`,
        `File: src/app/listings/[[...slug]]/page.tsx → _fetchListingsData (unstable_cache)`,
        `Filters: ${filtersDisplay}`,
        `Page param: ${page}`,
        ``,
        `Failed API calls (${failures.length} / ${_LISTING_API_CALLS.length}):`,
        ...failures.map(f => `  • ${f.api}: ${f.error}`),
        ``,
        `Passed API calls: ${settled.filter(r => r.status === "fulfilled").map((_, i) => _LISTING_API_CALLS[i]).join(", ") || "none"}`,
        ``,
        `unstable_cache will return last-good cached data — no error shown to users.`,
      ].join("\n");

      console.error(`[CACHE SET FAILED]\n${detailMsg}`);

      reportGitHubIssue({
        errorSource: isBackend ? "BACKEND" : "BACKEND",
        errorType: firstError,
        message: detailMsg,
      }).catch(() => {});

      throw new Error(firstError);
    }

    const [response, linksData, productListRes, initialCategoryCounts, initialMakeCounts] =
      (settled as PromiseFulfilledResult<any>[]).map(r => r.value);

    // Empty results → throw so unstable_cache keeps last-good data (not the 0-product state)
    if (!response?.data || !Array.isArray(response.data.products) || response.data.products.length === 0) {
      const hasEmpExclusive = Array.isArray(response?.data?.emp_exclusive_products) && response.data.emp_exclusive_products.length > 0;
      if (!hasEmpExclusive) {
        throw new Error("No products — unstable_cache keeps last-good data");
      }
    }

    return { response, linksData, productListRes, initialCategoryCounts, initialMakeCounts } as {
      response: Awaited<ReturnType<typeof getCachedListings>>;
      linksData: Awaited<ReturnType<typeof fetchLinksData>>;
      productListRes: Awaited<ReturnType<typeof fetchProductList>>;
      initialCategoryCounts: Awaited<ReturnType<typeof fetchCategoryCounts>>;
      initialMakeCounts: Awaited<ReturnType<typeof fetchMakeCounts>>;
    };
  },
  ["listings-page-data", filtersJson, String(page)],
  { revalidate: 86400, tags: ["listings"] }
  );


export async function generateStaticParams() {
  const allFiles = [
    statesData, regionsData, categoriesData, makesData,
    catStateData, priceData, sleepData, lengthData, atmData,
    bossUrlsData,
  ];
  const seen = new Set<string>();
  const result: { slug: string[] }[] = [];
  for (const file of allFiles) {
    for (const path of (file.paths as string[])) {
      const slug = path.split('/').filter(Boolean);
      const key = slug.join('/');
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ slug });
      }
    }
  }
  return result;
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  const meta = await metaFromSlug(slug, {});
  // listings-demo is a reference/backup copy of the old system, not meant to
  // be crawled — force noindex regardless of what metaFromSlug computes for
  // this slug (middleware also sets X-Robots-Tag: noindex, nofollow).
  return { ...meta, robots: { index: false, follow: false } };
}

function normalizeSlug(v: string = "") {
  return decodeURIComponent(v)
    .replace(/\s+/g, "+") // convert spaces back to +
    .trim()
    .toLowerCase();
}
// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;


type SegmentType =
  | "make"
  | "model"
  | "condition"
  | "category"
  | "state"
  | "region"
  | "suburb"
  | "price"
  | "weight"
  | "length"
  | "sleeps"
  | "year"
  | "search";

const FLEXIBLE_TYPES: SegmentType[] = ["price", "year", "search"];
const STRICT_ORDER: SegmentType[] = [
  "make",
  "model",
  "condition",
  "category",
  "state",
  "region",
  "suburb",
  "weight",
  "length",
  "sleeps",
];

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default async function Listings({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const slug = resolvedParams.slug || [];

  // ───── Block any "acustom" usage ─────

  // Validate REAL make/model from API
  // ───── Validate MAKE & MODEL using API data ─────
  // helper: check if slug is a typed value (category, state, year, price, etc)
  function isTypedFilter(slug: string) {
    // 🔧 FIX: Add null/undefined check

    return (
      slug.endsWith("-category") ||
      slug.endsWith("-condition") ||
      slug.endsWith("-state") ||
      slug.endsWith("-region") ||
      slug.includes("-suburb") ||
      slug.includes("-kg-atm") ||
      slug.includes("-length-in-feet") ||
      slug.includes("-people-sleeping-capacity") ||
      slug.endsWith("-search") ||
      /^over-\d+$/.test(slug) ||
      /^under-\d+$/.test(slug) ||
      /^between-\d+-\d+$/.test(slug) ||
      /^\d{4}-\d{4}-caravans-range$/.test(slug) ||
      /^year-from-\d{4}-caravans-range$/.test(slug) ||
      /^year-to-\d{4}-caravans-range$/.test(slug) ||
      /\d{4}(-caravans-range)?$/.test(slug)
    );
  }

  // ───── Validate MAKE & MODEL only if NOT typed filter ─────
  // const makesData = await fetchMakeDetails();

  // if (slug.length >= 1 && !isTypedFilter(slug[0])) {
  //   const makeSlug = normalizeSlug(slug[0]);

  //   const matchedMake = makesData.find(
  //     (m) => normalizeSlug(m.slug) === makeSlug,
  //   );

  //   if (!matchedMake) redirect("/404");

  //   if (slug.length >= 2 && !isTypedFilter(slug[1])) {
  //     const modelSlug = normalizeSlug(slug[1]);

  //     const matchedModel = matchedMake.models?.some(
  //       (mod) => normalizeSlug(mod.slug) === modelSlug,
  //     );

  //     if (!matchedModel) redirect("/404");
  //   }
  // }

  // Block page/feed keywords
  // 🚫 Fully block "page" or "feed" in URL
  const forbiddenPattern = /(page|feed)/i;

  if (
    slug.some((s) => forbiddenPattern.test(s)) ||
    Object.keys(resolvedSearchParams).some((k) => forbiddenPattern.test(k)) ||
    Object.values(resolvedSearchParams).some((v) =>
      forbiddenPattern.test(String(v)),
    )
  ) {
    return redirect('/404');
  }

  // Reject gibberish / pin-code spam
  const hasGibberish = slug.some((part) => {
    // 🔧 FIX #2: Add null/undefined check for part

    const lower = part.toLowerCase();
    const isPureNumber = /^[0-9]{5,}$/.test(lower);
    const isWeirdSymbols = /^[^a-z0-9-]+$/.test(lower);
    const allowed = [
      /^over-\d+$/,
      /^under-\d+$/,
      /^between-\d+-\d+$/,
      /^\d{4}-\d{4}-caravans-range$/,
      /^year-from-\d{4}-caravans-range$/,
      /^year-to-\d{4}-caravans-range$/,
      /\d{4}(-caravans-range)?$/,
      /-state$/,
      /-region$/,
      /-suburb$/,
      /-condition$/,
      /-category$/,
      /-search$/,
      /-kg-atm$/,
      /-length-in-feet$/,
      /-people-sleeping-capacity$/,
    ].some((r) => r.test(lower));
    return (isPureNumber || isWeirdSymbols) && !allowed;
  });

  if (hasGibberish) return redirect('/404');

  // ───── Parse filters (needed for location rules) ─────
  const filters = parseSlugToFilters(slug, resolvedSearchParams);

  // ───── Canonical URL redirect — wrong slug order → 301 to correct order ─────
  const canonicalPath = buildSlugFromFilters(filters);
  const incomingPath = `/listings/${slug.join("/")}`;
  const normalize = (p: string) => p.replace(/\/$/, "").toLowerCase();
  if (normalize(canonicalPath) !== normalize(incomingPath)) {
    return redirect('/404');
  }

  // ───── Location hierarchy validation ─────
  const hasState = !!filters.state;
  const hasRegion = !!filters.region;

  const hasSuburb = !!filters.suburb;

  if ((hasRegion || hasSuburb) && !hasState) return redirect('/404');
  if (hasSuburb && !hasRegion) return redirect('/404');

  // ───── Segment type detection + order validation ─────
  const seenTypes = new Set<SegmentType>();
  let lastStrictIndex = -1;

  // ← Fixed: removed unused `index`
  for (const part of slug) {
    // 🔧 FIX #3: Add null/undefined check for part

    const lower = part.toLowerCase();
    let detectedType: SegmentType | null = null;

    // Price
    if (/^(over|under)-\d+$/.test(lower) || /^between-\d+-\d+$/.test(lower)) {
      detectedType = "price";
    }
    // Other typed segments
    else if (lower.includes("-kg-atm")) detectedType = "weight";
    else if (lower.includes("-length-in-feet")) detectedType = "length";
    else if (lower.includes("-people-sleeping-capacity"))
      detectedType = "sleeps";
    else if (/^\d{4}-\d{4}-caravans-range$/.test(lower) || /^year-(from|to)-\d{4}-caravans-range$/.test(lower) || /\d{4}(-caravans-range)?$/.test(lower)) detectedType = "year";
    else if (lower.endsWith("-search")) detectedType = "search";
    else if (lower.endsWith("-condition")) detectedType = "condition";
    else if (lower.endsWith("-category")) detectedType = "category";
    else if (lower.endsWith("-state")) detectedType = "state";
    else if (lower.endsWith("-region")) detectedType = "region";
    else if (lower.includes("-suburb")) detectedType = "suburb";
    // Make / Model (simple alphanumeric segments)
    else if (
      /^[a-z]+[0-9]+$/.test(lower) || // string + number
      /^[a-z]+[0-9]+\+$/.test(lower) // string + number + +
    ) {
      if (!seenTypes.has("make")) detectedType = "make";
      else if (!seenTypes.has("model")) detectedType = "model";
    } else if (
      /^[0-9]+$/.test(lower) ||
      /^[0-9]+\+$/.test(lower) ||
      /^[a-z]+\+$/.test(lower) ||
      /^[0-9]+[a-z]/.test(lower) // number-first + letter (e.g. 58d, 123abc)
    ) {
      return redirect('/404'); // block bad patterns
    }

    if (detectedType) {
      if (seenTypes.has(detectedType)) return redirect('/404');
      seenTypes.add(detectedType);

      // Enforce strict order for non-flexible types
      if (!FLEXIBLE_TYPES.includes(detectedType)) {
        const currentStrictIndex = STRICT_ORDER.indexOf(detectedType);
        if (currentStrictIndex !== -1 && currentStrictIndex < lastStrictIndex) {
          return redirect('/404'); // Out of order
        }
        lastStrictIndex = Math.max(lastStrictIndex, currentStrictIndex);
      }
    }
  }

  // ───── Page param ─────
  let page = 1;
  const pageParam = resolvedSearchParams.page;
  if (pageParam) {
    const val = Array.isArray(pageParam) ? pageParam[0] : pageParam;
    const n = parseInt(val as string, 10);
    if (!isNaN(n) && n > 0) page = n;
  }

  // ───── Resolve model slug (URL has s-c-o-t-a but API needs s.c.o.t.a) ─────
  let apiFilters = filters;
  if (filters.model && filters.make) {
    const modelCounts = await fetchModelCounts(filters.make);
    const matched = modelCounts.find(
      (m) =>
        m.slug === filters.model ||
        m.slug.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") === filters.model
    );
    if (matched) apiFilters = { ...filters, model: matched.slug };
  }

  // ───── Fetch all data (stale-on-error via unstable_cache) ─────
  let response: Awaited<ReturnType<typeof getCachedListings>>;
  let linksData: Awaited<ReturnType<typeof fetchLinksData>>;
  let productListRes: Awaited<ReturnType<typeof fetchProductList>>;
  let initialCategoryCounts: Awaited<ReturnType<typeof fetchCategoryCounts>>;
  let initialMakeCounts: Awaited<ReturnType<typeof fetchMakeCounts>>;

  try {
    const data = await _makeFetchListingsData(JSON.stringify(apiFilters), page)();
    ({ response, linksData, productListRes, initialCategoryCounts, initialMakeCounts } = data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("400") || msg.includes("404")) {
      redirect("/404");
    }
    if (msg.includes("No products")) {
      notFound();
    }
    const isBackend =
      msg.startsWith("API no response") ||
      msg.startsWith("Backend server error") ||
      msg.startsWith("Missing or invalid API key") ||
      msg.startsWith("API endpoint not found") ||
      msg.startsWith("Invalid API response") ||
      msg.startsWith("API failed:");
    const errorSource = isBackend ? "BACKEND" : "FRONTEND";
    console.error(`[${errorSource} ERROR] Slug listings page failed, rendering client-side fallback:`, msg);
    reportGitHubIssue({
      errorSource,
      errorType: msg,
      message: `Slug listings page failed: ${msg}`,
    }).catch(() => {});
    // Server-side API unavailable — render page shell so client component can
    // fetch on mount via /api/listings/ proxy (which succeeds even when the
    // direct WordPress admin endpoint is unreachable from the Next.js server).
    return (
      <>
        <ListingsPage
          {...apiFilters}
          initialDistances={{}}
        />
      </>
    );
  }

  // ───── Render ─────
  return (
    <>
      {/* ✅ SSR Links — server component = appears in View Page Source */}
      {/* {linksData && (
      <div

        className="cfs-ssr-links-wrapper"
        id="ssr-links"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        {(["states", "categories", "regions",] as const).map((sectionKey) => {
          const items = linksData[sectionKey];
          if (!items || items.length === 0) return null;

          const titles: Record<string, string> = {
            categories: "Browse by Type",
            states: "Browse by State",
            regions: "Browse by Region",
            // makes: "Browse by Make",
            // models: "Browse by Model",
            // conditions: "Browse by Condition",
            // prices: "Browse by Price",
            // atm_ranges: "Browse by ATM",
            // length_ranges: "Browse by Length",
            // sleep_ranges: "Browse by Sleep",
          };

          return (
            <div key={sectionKey}>
              <h5>{titles[sectionKey] || sectionKey}</h5>
              <ul>
                {items.map((item: any) => {
                  const linkUrl = buildSSRLinkUrl(sectionKey, item, filters);
                  return (
                    <li key={item.slug}>
                      <a href={linkUrl} target=" " >
                        {item.name.includes(" ") 
  ? item.name.replace(/\b\w/g, (c: string) => c.toUpperCase())
  : item.name.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    )}
     */}

      <ListingsPage
          {...apiFilters}
          initialData={response}
          linksData={linksData}
          productListData={productListRes}
          initialCategoryCounts={initialCategoryCounts}
          initialMakeCounts={initialMakeCounts}
          initialDistances={await (async () => {
            if (!filters.suburb || !filters.pincode) return {};
            const allItems = [
              ...(response.data?.products ?? []),
              ...(response.data?.exclusive_products ?? []),
              ...(response.data?.featured_products ?? []),
              ...(response.data?.premium_products ?? []),
            ];
            const pincodes = allItems
              .map((p: any) => p.pincode)
              .filter((p: any): p is string => typeof p === "string" && /^\d{4}$/.test(p));
            return calculateDistances(filters.pincode as string, pincodes);
          })()}
        />
    </>
  );
}
