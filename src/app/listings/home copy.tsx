
"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import StateHero from "./StateHero";
import StateFilterBar, { FilterState } from "./StateFilterBar";
import StateListingGrid, { SeoV2, Listing, buildFeaturedOrder } from "./StateListingGrid";
import StateBrowseSection from "./StateBrowseSection";
import StateContent from "./StateContent";
import { buildApiUrl, buildListingsSlug, buildFilterBreadcrumbs } from "./urlUtils";
import "./main.css";

// clickid pagination — same scheme as /listings/: no ?page=N in the URL,
// instead a random ?clickid= id maps (via localStorage, with a `pN` suffix
// fallback baked into the id) to the page it represents. This lets a
// hard refresh on a paginated URL restore the right page.
const PAGE_KEY = (id: string) => `page_${id}`;
const readPage = (id: string): number | null => {
  try {
    const v = localStorage.getItem(PAGE_KEY(id));
    if (v) return parseInt(v, 10);
  } catch {}
  const match = id.match(/p(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const SEED_MAX = 15;
// Fixed seed used ONLY as a fallback source for premium/exclusive products
// when the session's random seed's pool doesn't happen to contain any.
// Premium/exclusive placement shouldn't depend on which random 500-item
// pool the session seed picked — this fallback call exists purely to patch
// that backend gap without touching the WordPress endpoint itself.
const PREMIUM_FALLBACK_SEED = 1;

interface Props {
  initialFilters: FilterState;
}

export default function StateHome({ initialFilters }: Props) {
  const [filters,  setFilters]  = useState<FilterState>(initialFilters);
  const [page,     setPage]     = useState(1);
  const [maxPages, setMaxPages] = useState(1);
  const [clickid,  setClickid]  = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);
  const [seo,      setSeo]      = useState<SeoV2 | null>(null);
  const [newSeo,   setNewSeo]   = useState<SeoV2 | null>(null);
  const [usedSeo,  setUsedSeo]  = useState<SeoV2 | null>(null);
  const [seed,     setSeed]     = useState(1);
  const [pool,     setPool]     = useState<{ featured: Listing[]; new: Listing[]; used: Listing[] }>({ featured: [], new: [], used: [] });
  const [poolLoading, setPoolLoading] = useState(true);
  // Whether the current canonical /listings/ URL is in url.csv's curated
  // indexed set — gates the full hero banner (image + description) and the
  // Featured/New/Used split: indexed pages split the pool by slot_bucket into
  // three sections, non-indexed pages get one combined grid.
  const [isIndexed, setIsIndexed] = useState(true);

  // Push the API's seo_v2 into the browser tab title + meta description.
  useEffect(() => {
    if (!seo) {
      // Filter changed and the new page's SEO hasn't loaded yet — fall back
      // to the generic title instead of leaving the previous page's title
      // showing (stale tab title while the new fetch is in flight).
      document.title = "Caravans For Sale – Australia's Marketplace for New & Used Caravans";
      return;
    }
    if (seo.meta_title) document.title = seo.meta_title;
    if (seo.meta_description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", seo.meta_description);
    }
  }, [seo]);

  // Restore page from ?clickid= on mount (hard refresh / shared link) before
  // the grids below fetch anything, so they fetch the right page just once.
  useEffect(() => {
    const cid = new URLSearchParams(window.location.search).get("clickid");
    if (cid) {
      const saved = readPage(cid);
      if (saved && saved > 0) {
        setClickid(cid);
        setPage(saved);
      }
    }

    // Seed priority (highest → lowest):
    //   1. window.__SHUFFLE_SEED__  — injected by Cloudflare Worker into pre-rendered HTML
    //   2. ?shuffle_seed=N URL param — used by generate-priority-pages.js to produce variants
    //   3. sessionStorage("demo_seed") — keeps seed stable across navigations in the same tab
    //   4. random — fresh session fallback
    try {
      const workerSeed = (window as unknown as Record<string, unknown>)["__SHUFFLE_SEED__"];
      const urlSeed = new URLSearchParams(window.location.search).get("shuffle_seed");
      if (typeof workerSeed === "number" && workerSeed >= 1) {
        setSeed(workerSeed);
      } else if (urlSeed && /^\d+$/.test(urlSeed)) {
        const n = parseInt(urlSeed, 10);
        if (n >= 1) setSeed(n);
      } else {
        const stored = sessionStorage.getItem("demo_seed");
        if (stored) {
          setSeed(parseInt(stored, 10));
        } else {
          const fresh = Math.floor(Math.random() * SEED_MAX) + 1;
          sessionStorage.setItem("demo_seed", String(fresh));
          setSeed(fresh);
        }
      }
    } catch {
      setSeed(Math.floor(Math.random() * SEED_MAX) + 1);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const cid = new URLSearchParams(window.location.search).get("clickid");
      if (cid) {
        const saved = readPage(cid);
        setClickid(cid);
        setPage(saved && saved > 0 ? saved : 1);
      } else {
        setClickid(null);
        setPage(1);
      }
      setMaxPages(1);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTotalPages = (n: number) => setMaxPages(prev => Math.max(prev, n));

  useEffect(() => {
    if (page !== 1) return;
    const canonicalPath = buildListingsSlug(filters);
    fetch(`/api/indexed-url/?path=${encodeURIComponent(canonicalPath)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setIsIndexed(json?.indexed ?? false))
      .catch(() => setIsIndexed(false));
  }, [filters, page]);

  // Page 1 uses ONE shared pool call, split by slot_bucket into
  // Featured/New/Used — instead of 3 separate condition-locked API calls.
  const poolApiUrl = buildApiUrl("/api/pool-listings/?per_page=24", filters, seed);

  useEffect(() => {
    // Wait for the real session seed to load (see the mount effect above) —
    // firing this with the seed=1 placeholder first, then again once the
    // real seed lands, hits the backend's randomized featured pick twice
    // with two different seeds, so the grid visibly swaps its items right
    // after the first paint.
    if (!ready || page !== 1) return;
    // `isIndexed` starts as the `true` default and flips to its real value
    // once the async /api/indexed-url/ check resolves — since this effect
    // depends on `isIndexed`, it fires once with that stale default and
    // again with the real value. The two requests race with no cancellation,
    // so if the stale-`isIndexed` response happens to land last, it overwrites
    // the correct one with a near-empty result (that branch's slot_bucket
    // filtering finds nothing, since this endpoint never sends slot_bucket).
    // `cancelled` lets a newer run of this effect discard an in-flight older
    // one's result instead of letting it win the race.
    let cancelled = false;
    setPoolLoading(true);
    // Clear the previous filter's seo_v2 up front — otherwise a failed/slow
    // fetch for the new filter combo leaves the old state's title/description
    // on screen (e.g. Victoria's copy lingering after switching to NSW).
    setSeo(null);
    const requestUrl = `${poolApiUrl}&page=${page}`;
    const absoluteUrl = new URL(requestUrl, window.location.origin).toString();
    console.log("[StateHome] shared pool API:", absoluteUrl);

    (async () => {
      try {
        const res = await fetch(requestUrl, { cache: "no-store" });
        const json = res.ok ? await res.json() : null;
        if (cancelled) return;
        console.log("[StateHome] shared pool API response:", json);

        // seo_v2 is set first, independently of the product-pool bucketing
        // below, so a bad product shape can never suppress the title/description.
        const seoData = json?.data?.seo_v2 ?? json?.seo_v2;
        if (seoData) setSeo(seoData);

        const products: Listing[]      = json?.data?.products ?? json?.products ?? [];
        let premiumsRaw: Listing[]     = json?.data?.premium_products ?? json?.premium_products ?? [];
        let exclusivesRaw: Listing[]   = json?.data?.exclusive_products ?? json?.exclusive_products ?? [];
        const empExclusivesRaw: Listing[] = json?.data?.emp_exclusive_products ?? json?.emp_exclusive_products ?? [];
        const totalCount: number = json?.data?.counts?.total_count ?? json?.counts?.total_count ?? products.length;

        // WORKAROUND: the backend's seeded random pool (per session `seed`)
        // sometimes just doesn't contain any premium/exclusive items — it's
        // seed-dependent whether they show up, which they shouldn't be.
        // If either array came back empty, re-fetch with a fixed fallback
        // seed and pull premium/exclusive from THAT response instead. This
        // is a frontend patch for a backend gap; remove once the WordPress
        // pool_test handler fetches premium/exclusive independent of seed.
        if ((premiumsRaw.length === 0 || exclusivesRaw.length === 0) && seed !== PREMIUM_FALLBACK_SEED) {
          try {
            const fallbackUrl = `${buildApiUrl("/api/pool-listings/?per_page=24", filters, PREMIUM_FALLBACK_SEED)}&page=1`;
            console.log("[StateHome] premium/exclusive fallback fetch:", fallbackUrl);
            const fallbackRes = await fetch(fallbackUrl, { cache: "no-store" });
            const fallbackJson = fallbackRes.ok ? await fallbackRes.json() : null;
            if (cancelled) return;

            if (premiumsRaw.length === 0) {
              premiumsRaw = fallbackJson?.data?.premium_products ?? fallbackJson?.premium_products ?? [];
            }
            if (exclusivesRaw.length === 0) {
              exclusivesRaw = fallbackJson?.data?.exclusive_products ?? fallbackJson?.exclusive_products ?? [];
            }
            console.log("[StateHome] fallback premium/exclusive:", { premiumsRaw, exclusivesRaw });
          } catch (fallbackErr) {
            console.log("[StateHome] premium/exclusive fallback fetch failed:", fallbackErr);
            // Proceed with whatever we already had — don't block the page.
          }
        }

        if (totalCount === 0 && empExclusivesRaw.length > 0) {
          // No products at all — fall back to the emp_exclusive_products pool
          // so the page isn't empty, all shown with the Spotlight Van design.
          const empItems = empExclusivesRaw.map((p) => ({ ...p, is_exclusive: true }));
          setPool({ featured: empItems, new: [], used: [] });
        } else if (isIndexed) {
          // Indexed pages split by slot_bucket into Featured/New/Used.
          // buildFeaturedOrder groups strictly by each item's own slot_bucket
          // field internally, so we pass the FULL products array — it safely
          // pulls out only slot_bucket "featured" items for the hero +
          // rest-of-pool. Premium/exclusive always come from their own
          // top-level arrays (now backfilled above if needed) and only
          // render on the Featured tab (position 3 = exclusive spotlight,
          // 4-5 = premium).
          const featuredItems = buildFeaturedOrder(products, premiumsRaw, exclusivesRaw);
          const featuredIds   = new Set(featuredItems.map((p) => p.id));

          const newItems  = products.filter((p) => p.slot_bucket === "new"  && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
          const usedItems = products.filter((p) => p.slot_bucket === "used" && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));

          setPool({ featured: featuredItems, new: newItems, used: usedItems });
        } else {
          // Non-indexed pages get one combined grid instead of a split.
          const combined = buildFeaturedOrder(products, premiumsRaw, exclusivesRaw);
          setPool({ featured: combined, new: [], used: [] });
        }

        handleTotalPages(json?.pagination?.total_pages ?? 1);
      } catch {
        if (!cancelled) setPool({ featured: [], new: [], used: [] });
      } finally {
        if (!cancelled) setPoolLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [poolApiUrl, page, isIndexed, ready, seed, filters]);

  // New/Used grid headings need their own condition-locked seo_v2 (the shared
  // pool call above is unlocked, so its seo_v2 only covers the page overall).
  // Featured reuses that page-level seo since there's no dedicated "featured"
  // seo concept on the backend. Skipped entirely on non-indexed pages
  // (nothing to show these titles on there).
  useEffect(() => {
    if (!ready || page !== 1 || !isIndexed) {
      setNewSeo(null);
      setUsedSeo(null);
      return;
    }
    const newUrl  = `${buildApiUrl("/api/pool-listings/?per_page=1", filters, seed, "New")}&page=1`;
    const usedUrl = `${buildApiUrl("/api/pool-listings/?per_page=1", filters, seed, "Used")}&page=1`;

    fetch(newUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setNewSeo(json?.data?.seo_v2 ?? json?.seo_v2 ?? null))
      .catch(() => setNewSeo(null));

    fetch(usedUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setUsedSeo(json?.data?.seo_v2 ?? json?.seo_v2 ?? null))
      .catch(() => setUsedSeo(null));
  }, [filters, seed, page, isIndexed]);

  const pushFiltersToUrl = (f: FilterState) => {
    window.history.pushState({}, "", buildListingsSlug(f));
  };

  const handleFilterChange = (f: FilterState) => {
    setFilters(f); setPage(1); setMaxPages(1); setClickid(null);
    pushFiltersToUrl(f);
  };
  const handleClearAll = () => {
    setFilters({}); setPage(1); setMaxPages(1); setClickid(null);
    pushFiltersToUrl({});
  };

  const hasActiveFilters = !!(
    filters.category || filters.condition || filters.make ||
    filters.from_price || filters.to_price || filters.minKg || filters.maxKg ||
    filters.region || filters.suburb || filters.from_sleep || filters.to_sleep ||
    filters.acustom_fromyears || filters.from_length || filters.keyword
  );

  const handleNextPage = () => {
    if (page >= maxPages) return;
    const nextPage = page + 1;
    const id = uuidv4();
    try { localStorage.setItem(PAGE_KEY(id), String(nextPage)); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("clickid", id);
    window.history.pushState({}, "", url.toString());
    setClickid(id);
    setPage(nextPage);
    setMaxPages(1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handlePrevPage = () => {
    if (page <= 1) return;
    const prevPage = page - 1;
    const url = new URL(window.location.href);
    if (prevPage <= 1) {
      url.searchParams.delete("clickid");
      setClickid(null);
    } else {
      const id = uuidv4();
      try { localStorage.setItem(PAGE_KEY(id), String(prevPage)); } catch {}
      url.searchParams.set("clickid", id);
      setClickid(id);
    }
    window.history.pushState({}, "", url.toString());
    setPage(prevPage);
    setMaxPages(1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const pagination = (
    <div className="pagination-wrapper">
      <nav className="woocommerce-pagination custom-pagination">
        <ul className="pagination-icons">
          <li>
            <button className="prev-icon" onClick={handlePrevPage} disabled={page === 1}>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1L1 6l5 5"/>
              </svg>
              Back
            </button>
          </li>
          <li className="page-count">Page {page} of {maxPages}</li>
          <li>
            <button className="next-icon" onClick={handleNextPage} disabled={page === maxPages}>
              Next
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1l5 5-5 5"/>
              </svg>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );

  if (!ready) return (
    <>
      <style>{`.lsd-mob-white{display:none}@media(max-width:767px){.lsd-mob-white{display:block}}`}</style>
      <div className="lsd-mob-white" style={{ minHeight: "100vh", background: "#fff" }} />
    </>
  );

  if (page === 1) {
    return (
      <div className="lsd-page">
        {/* Non-indexed pages skip the full hero banner (image + description),
            but every URL still gets the breadcrumb trail — just as a plain
            standalone bar instead of sitting inside the hero. */}
        {isIndexed ? (
          <StateHero title={seo?.h1} description={seo?.short_description || seo?.meta_description} loading={poolLoading} breadcrumbs={buildFilterBreadcrumbs(filters)} />
        ) : (
          <div className="container lsd-standalone-breadcrumb-wrap">
            <nav className="lsd-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <svg width="12" height="20" viewBox="0 0 24 24" fill="none" stroke="#3e3e3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}} aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              <Link href="/listings/">Caravans for Sale</Link>
              {buildFilterBreadcrumbs(filters).map((crumb) => (
                <span key={crumb.href}>
                  <svg width="12" height="20" viewBox="0 0 24 24" fill="none" stroke="#3e3e3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}} aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </span>
              ))}
            </nav>
          </div>
        )}

        <StateFilterBar
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
        />

        {isIndexed ? (
          <>
            <StateListingGrid
              title={seo?.meta_title ? `Featured ${seo.meta_title}` : ""}
              viewAllHref={`${buildListingsSlug(filters)}?featured=1`}
              items={pool.featured}
              loading={poolLoading}
              showSpotlight={!hasActiveFilters}
              hideViewAll
            />

            <StateListingGrid
              title={newSeo?.meta_title || ""}
              viewAllHref={buildListingsSlug(filters, "New")}
              items={pool.new}
              loading={poolLoading}
            />

            <StateListingGrid
              title={usedSeo?.meta_title || ""}
              viewAllHref={buildListingsSlug(filters, "Used")}
              items={pool.used}
              loading={poolLoading}
            />
          </>
        ) : (
          // Non-indexed pages skip the hero, so this title carries the
          // page's actual <h1> (with count) instead of the hero's h1.
          <StateListingGrid
            title={seo?.h1 || " "}
            titleAs="h1"
            viewAllHref={buildListingsSlug(filters)}
            items={pool.featured}
            loading={poolLoading}
            showSpotlight={!hasActiveFilters}
            hideViewAll
          />
        )}

        {maxPages > 1 && pagination}

        <StateBrowseSection state={filters.state} region={filters.region} category={filters.category} />
        <StateContent footerDescription={seo?.footer_description} faq={seo?.faq} />
      </div>
    );
  }

  // page > 1 — combined single grid across all listings
  const allUrl = buildApiUrl("/api/pool-listings/?per_page=24", filters, seed);

  return (
    <div className="lsd-page">
      <div className="lsd-paged-header">
        <div className="container">
          <nav className="lsd-paged-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            <Link href="/listings/">Caravans for Sale</Link>
            {buildFilterBreadcrumbs(filters).map((crumb) => (
              <span key={crumb.href}>
                <svg width="10" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                <Link href={crumb.href}>{crumb.label}</Link>
              </span>
            ))}
          </nav>
          <h1 className="lsd-paged-title">{seo?.h1 || "Caravans for Sale in Victoria"}</h1>
        </div>
      </div>

      <StateFilterBar
        currentFilters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      <StateListingGrid
        title="Caravans for Sale in Victoria"
        viewAllHref="/listings/?state=victoria"
        apiUrl={allUrl}
        showSpotlight
        hideViewAll
        hideTitle
        page={page}
        onTotalPages={handleTotalPages}
        onSeo={setSeo}
        maxItems={24}
      />

      {maxPages > 1 && pagination}

      <StateBrowseSection state={filters.state} region={filters.region} category={filters.category} />
      <StateContent footerDescription={seo?.footer_description} faq={seo?.faq} />
    </div>
  );
}