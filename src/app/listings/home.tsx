
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import StateHero from "./StateHero";
import StateFilterBar, { FilterState } from "./StateFilterBar";
import StateListingGrid, { SeoV2, Listing, buildFeaturedOrder } from "./StateListingGrid";
import StateBrowseSection from "./StateBrowseSection";
import type { BrowseSectionData } from "./browseSectionShared";
import StateContent from "./StateContent";
import { buildApiUrl, buildListingsSlug, buildFilterBreadcrumbs } from "./urlUtils";
import { useBanners } from "@/components/BannerHandler";
import { useBannerTracking } from "@/hooks/useBannerTracking";
import "./main.css?=7";

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

/** Full pool data fetched server-side in page.tsx and passed as a prop so the
 *  SSR / KV-cached HTML contains real product listings from the first byte. */
export type InitialPool = {
  seo: SeoV2 | null;
  featured: Listing[];
  new: Listing[];
  used: Listing[];
  maxPages: number;
  isIndexed: boolean;
};

interface Props {
  initialFilters: FilterState;
  /** Full pool fetched server-side — products + seo for SSR rendering. */
  initialPool?: InitialPool | null;
  /** @deprecated replaced by initialPool.seo */
  initialSeo?: SeoV2 | null;
  /** Server-fetched (SSR/ISR) counts for StateBrowseSection's initial filters —
   * seeds its pills/links so they're present in page source for crawlers. */
  browseData?: BrowseSectionData;
  /**
   * Server-determined isIndexed value — passed separately so non-indexed pages
   * that have initialPool=null still initialise isIndexed correctly without
   * waiting for the async /api/indexed-url/ client check (which causes an
   * extra pool re-fetch when it flips the default true → false).
   */
  serverIsIndexed?: boolean;
}

export default function StateHome({ initialFilters, browseData, initialPool, initialSeo, serverIsIndexed }: Props) {
  const [filters,  setFilters]  = useState<FilterState>(initialFilters);
  const [page,     setPage]     = useState(1);
  const [maxPages, setMaxPages] = useState(initialPool?.maxPages ?? 1);
  const [clickid,  setClickid]  = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);
  const [seo,      setSeo]      = useState<SeoV2 | null>(initialPool?.seo ?? initialSeo ?? null);
  const [newSeo,   setNewSeo]   = useState<SeoV2 | null>(null);
  const [usedSeo,  setUsedSeo]  = useState<SeoV2 | null>(null);
  const [seed,     setSeed]     = useState(1);
  const [pool,     setPool]     = useState<{ featured: Listing[]; new: Listing[]; used: Listing[] }>(
    initialPool
      ? { featured: initialPool.featured, new: initialPool.new, used: initialPool.used }
      : { featured: [], new: [], used: [] }
  );
  const [poolLoading, setPoolLoading] = useState(!initialPool);
  // Whether the current canonical /listings/ URL is in url.csv's curated
  // indexed set — gates the full hero banner (image + description) and the
  // Featured/New/Used split: indexed pages split the pool by slot_bucket into
  // three sections, non-indexed pages get one combined grid.
  const [isIndexed, setIsIndexed] = useState(initialPool?.isIndexed ?? serverIsIndexed ?? true);

  // Tracks whether we already consumed window.__INITIAL_POOL__ (injected by
  // the cache generator into pre-rendered HTML). Once consumed we let the
  // normal fetch path take over so filter-changes and page-turns fetch live.
  const initialPoolConsumed = useRef(false);
  // Tracks whether the server-fetched initialPool prop has been "consumed"
  // (i.e., the first pool useEffect run has been skipped). After that, normal
  // live fetches run on filter/seed changes.
  //
  // For non-indexed pages (serverIsIndexed === false) we start as already-consumed
  // even when initialPool is non-null. This means the pool effect never skips and
  // always fires a live fetch with the fresh random seed picked on every mount —
  // giving different products on each refresh. The SSR initialPool still provides
  // a fallback render while the fetch is in flight, preventing the blank-page
  // problem that occurs when initialPool is null and the API is slow or errors.
  const initialPropConsumed = useRef(initialPool == null || serverIsIndexed === false);
  // Snapshot of the most-recently-consumed preload data, keyed by poolApiUrl.
  // Used to re-bucket without a live fetch when only `isIndexed` changes (e.g.
  // the async /api/indexed-url/ check resolves to a different value than the
  // preload's is_indexed). Cleared whenever poolApiUrl changes (filter change).
  const preloadSnapshotRef = useRef<{
    poolApiUrl: string;
    products: Listing[];
    premiumsRaw: Listing[];
    exclusivesRaw: Listing[];
    empExclusivesRaw: Listing[];
    seoData: unknown;
    totalPages: number;
    isIndexed: boolean;  // is_indexed value from the preload — authoritative source
  } | null>(null);
  // Set to true synchronously in the mount effect when window.__INITIAL_POOL__
  // is detected. This lets the /api/indexed-url/ callback (which can fire as a
  // microtask from browser-cached responses, BEFORE the pool effect macro task
  // runs and saves the snapshot) suppress setIsIndexed calls that would corrupt
  // the layout before the preload is even consumed. Cleared when the pool effect
  // first runs (at which point preloadSnapshotRef takes over as the guard).
  const preloadReadRef = useRef(false);
  console.log("seoo89", seo)

  // ── Top banner ad (impression + click tracking) ──
  const { matchedBanners } = useBanners();
  const topBanners = useMemo(
    () => matchedBanners.filter((b) => b.placement === "listings" && b.position === "top"),
    [matchedBanners],
  );
  const [topBanner, setTopBanner] = useState<(typeof topBanners)[0] | null>(null);
  const topBannerInitRef = useRef(false);

  useEffect(() => {
    if (topBannerInitRef.current || topBanners.length === 0) return;
    topBannerInitRef.current = true;
    setTopBanner(topBanners[Math.floor(Math.random() * topBanners.length)]);
  }, [topBanners]);

  const topBannerList = useMemo(() => (topBanner ? [topBanner] : []), [topBanner]);
  // Impression tracking (IntersectionObserver) — same hook/API as the rest of the site.
  const { bannerRefs, trackClick } = useBannerTracking(topBannerList);

  const handleTopBannerClick = useCallback(() => {
    if (!topBanner) return;
    trackClick(topBanner.id);
  }, [topBanner, trackClick]);

  const topBannerBlock = topBanner && (
    <div className="container lsd-top-banner">
      <a
        href={topBanner.target_url}
        target="_blank"
        rel="noopener noreferrer"
        data-banner-id={topBanner.id}
        ref={(el) => { bannerRefs.current[0] = el; }}
        onClick={handleTopBannerClick}
      >
        <img src={topBanner.image_url} alt={topBanner.name} style={{ width: "100%", height: "auto", display: "block" }} />
      </a>
    </div>
  );

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
    //   3. random — fresh seed on every page mount so non-indexed (live API) pages
    //      show different products on each refresh. sessionStorage is intentionally
    //      NOT used here: persisting the seed across reloads caused the same variant
    //      slot to be hit every time, making products appear frozen.
    try {
      const workerSeed = (window as unknown as Record<string, unknown>)["__SHUFFLE_SEED__"];
      const urlSeed = new URLSearchParams(window.location.search).get("shuffle_seed");
      if (typeof workerSeed === "number" && workerSeed >= 1) {
        setSeed(workerSeed);
      } else if (urlSeed && /^\d+$/.test(urlSeed)) {
        const n = parseInt(urlSeed, 10);
        if (n >= 1) setSeed(n);
      } else {
        setSeed(Math.floor(Math.random() * SEED_MAX) + 1);
      }
    } catch {
      setSeed(Math.floor(Math.random() * SEED_MAX) + 1);
    }

    // For KV-cached pages (no SSR initialPool prop), read is_indexed from the
    // preload object embedded by the cache generator. Batching setIsIndexed here
    // with setReady means the pool effect fires once with the correct isIndexed
    // value, preventing the secondary pool re-fetch that occurs when the async
    // /api/indexed-url/ check resolves to a different value than the default.
    try {
      const win = window as unknown as Record<string, unknown>;
      const preload = win.__INITIAL_POOL__ as { url?: string; is_indexed?: boolean } | undefined;
      if (preload?.url) {
        // Raise the sentinel SYNCHRONOUSLY whenever __INITIAL_POOL__ exists —
        // regardless of whether is_indexed is present (pool_test doesn't return
        // is_indexed at the top level, so that check was always false before).
        // The pool effect will either consume the preload (URL match) or fall
        // through to a live fetch. Either way, /api/indexed-url/ must not fire
        // setIsIndexed until after that first pool-effect run completes.
        preloadReadRef.current = true;
        if (typeof preload.is_indexed === "boolean") {
          setIsIndexed(preload.is_indexed);
        }
      }
    } catch {
      // ignore — isIndexed will be corrected by the async /api/indexed-url/ check
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

  console.log("[StateHome] page:", page, "seed:", seed);

  const handleTotalPages = (n: number) => setMaxPages(prev => Math.max(prev, n));

  useEffect(() => {
    if (page !== 1) return;
    const canonicalPath = buildListingsSlug(filters);
    fetch(`/api/indexed-url/?path=${encodeURIComponent(canonicalPath)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        // Suppress if either:
        //  (a) preloadSnapshotRef is set — snapshot already consumed, authoritative
        //  (b) preloadReadRef is set — preload detected on mount but pool effect
        //      macro task hasn't run yet; this covers cached-response microtasks
        //      that fire before the pool effect saves the snapshot
        if (preloadSnapshotRef.current !== null || preloadReadRef.current) return;
        setIsIndexed(json?.indexed ?? false);
      })
      .catch(() => {
        if (preloadSnapshotRef.current !== null || preloadReadRef.current) return;
        setIsIndexed(false);
      });
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
    // Skip the very first effect run when the server already provided
    // initialPool — data is already in state, no re-fetch needed.
    // Subsequent runs (filter/seed changes) proceed normally.
    if (!initialPropConsumed.current) {
      initialPropConsumed.current = true;
      return;
    }
    // `isIndexed` starts as the `true` default and flips to its real value
    // once the async /api/indexed-url/ check resolves — since this effect
    // depends on `isIndexed`, it fires once with that stale default and
    // again with the real value. The two requests race with no cancellation,
    // so if the stale-`isIndexed` response happens to land last, it overwrites
    // the correct one with a near-empty result (that branch's slot_bucket
    // filtering finds nothing, since this endpoint never sends slot_bucket).
    // `cancelled` lets a newer run of this effect discard an in-flight older
    // one's result instead of letting it win the race.
    const requestUrl = `${poolApiUrl}&page=${page}`;
    const absoluteUrl = new URL(requestUrl, window.location.origin).toString();

    // ── Pre-loaded pool data (injected by cache generator into HTML) ──────────
    // Check preload FIRST — before setSeo(null) — so we never produce an
    // intermediate render with seo=null when data is already in memory.
    // Processing synchronously means React batches all setState calls into a
    // single render: seo, pool, and poolLoading all update together, so the
    // "Featured Caravans…" heading is present from the very first client paint.
    const win = window as unknown as Record<string, unknown>;
    const preload = win.__INITIAL_POOL__ as { url: string; json: unknown } | undefined;
    if (preload && !initialPoolConsumed.current && preload.url === requestUrl) {
      initialPoolConsumed.current = true;
      win.__INITIAL_POOL__ = undefined;
      console.log("[StateHome] using pre-loaded pool data:", requestUrl);

      const json = preload.json as Record<string, unknown>;
      const seoData = (json as any)?.data?.seo_v2 ?? (json as any)?.seo_v2;
      if (seoData) setSeo(seoData);

      const products: Listing[]        = (json as any)?.data?.products ?? (json as any)?.products ?? [];
      const premiumsRaw: Listing[]     = (json as any)?.data?.premium_products ?? (json as any)?.premium_products ?? [];
      const exclusivesRaw: Listing[]   = (json as any)?.data?.exclusive_products ?? (json as any)?.exclusive_products ?? [];
      const empExclusivesRaw: Listing[]= (json as any)?.data?.emp_exclusive_products ?? (json as any)?.emp_exclusive_products ?? [];
      const totalCount: number         = (json as any)?.data?.counts?.total_count ?? (json as any)?.counts?.total_count ?? products.length;

      if (totalCount === 0 && empExclusivesRaw.length > 0) {
        const empItems = empExclusivesRaw.map((p) => ({ ...p, is_exclusive: true }));
        setPool({ featured: empItems, new: [], used: [] });
      } else if (isIndexed) {
        const featuredSource = products.filter((p) => p.slot_bucket === "featured");
        const featuredItems  = buildFeaturedOrder(featuredSource, premiumsRaw, exclusivesRaw);
        const featuredIds    = new Set(featuredItems.map((p) => p.id));
        const newItems  = products.filter((p) => p.slot_bucket === "new"  && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
        const usedItems = products.filter((p) => p.slot_bucket === "used" && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
        setPool({ featured: featuredItems, new: newItems, used: usedItems });
      } else {
        const combined = buildFeaturedOrder(products, premiumsRaw, exclusivesRaw);
        setPool({ featured: combined, new: [], used: [] });
      }

      const totalPages = (json as any)?.pagination?.total_pages ?? 1;
      handleTotalPages(totalPages);
      setPoolLoading(false);

      // Save a snapshot so that if isIndexed changes later (e.g. /api/indexed-url/
      // returns a different value than the embedded is_indexed), the pool effect
      // can re-bucket from this data instead of making a live fetch that would
      // overwrite the correct preload content.
      preloadSnapshotRef.current = {
        poolApiUrl,
        products,
        premiumsRaw,
        exclusivesRaw,
        empExclusivesRaw,
        seoData: seoData ?? null,
        totalPages,
        isIndexed,  // record the is_indexed value used when consuming the preload
      };

      return;  // no async work, no cleanup needed
    }
    // ─────────────────────────────────────────────────────────────────────────

    // If only isIndexed changed (same filter context / poolApiUrl) and we have
    // a preload snapshot, re-bucket from it instead of making a live request.
    // This prevents the async /api/indexed-url/ check from overwriting correct
    // preload data when it disagrees with the embedded is_indexed value.
    if (preloadSnapshotRef.current && preloadSnapshotRef.current.poolApiUrl === poolApiUrl) {
      const snap = preloadSnapshotRef.current;
      if (snap.seoData) setSeo(snap.seoData as Parameters<typeof setSeo>[0]);
      const { products, premiumsRaw, exclusivesRaw, empExclusivesRaw } = snap;
      // Use snap.isIndexed (the is_indexed embedded in the preload), NOT the
      // current isIndexed state — which may have been overridden by the async
      // /api/indexed-url/ check. The preload value is authoritative.
      const snapIsIndexed = snap.isIndexed;
      if (empExclusivesRaw.length > 0 && products.length === 0) {
        setPool({ featured: empExclusivesRaw.map((p) => ({ ...p, is_exclusive: true })), new: [], used: [] });
      } else if (snapIsIndexed) {
        const featuredSource = products.filter((p) => p.slot_bucket === "featured");
        const featuredItems  = buildFeaturedOrder(featuredSource, premiumsRaw, exclusivesRaw);
        const featuredIds    = new Set(featuredItems.map((p) => p.id));
        const newItems  = products.filter((p) => p.slot_bucket === "new"  && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
        const usedItems = products.filter((p) => p.slot_bucket === "used" && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
        setPool({ featured: featuredItems, new: newItems, used: usedItems });
      } else {
        setPool({ featured: buildFeaturedOrder(products, premiumsRaw, exclusivesRaw), new: [], used: [] });
      }
      handleTotalPages(snap.totalPages);
      // Also restore isIndexed state to the preload's value in case the async
      // check overrode it. This prevents the isIndexed state from drifting and
      // causing further re-renders with the wrong layout.
      if (isIndexed !== snapIsIndexed) setIsIndexed(snapIsIndexed);
      return;
    }

    // Filter changed (or no snapshot) — clear the snapshot and do a live fetch.
    // Also clear preloadReadRef so subsequent /api/indexed-url/ callbacks (for
    // the new filter context) can update isIndexed normally.
    preloadSnapshotRef.current = null;
    preloadReadRef.current = false;

    let cancelled = false;
    setPoolLoading(true);
    // Clear the previous filter's seo_v2 up front — otherwise a failed/slow
    // fetch for the new filter combo leaves the old state's title/description
    // on screen (e.g. Victoria's copy lingering after switching to NSW).
    setSeo(null);

    console.log("[StateHome] shared pool API:", absoluteUrl);
    fetch(requestUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled) return;
        console.log("[StateHome] shared pool API response:", json);

        // seo_v2 is set first, independently of the product-pool bucketing
        // below, so a bad product shape can never suppress the title/description.
        const seoData = json?.data?.seo_v2 ?? json?.seo_v2;
        if (seoData) setSeo(seoData);

        const products: Listing[]      = json?.data?.products ?? json?.products ?? [];
        const premiumsRaw: Listing[]   = json?.data?.premium_products ?? json?.premium_products ?? [];
        const exclusivesRaw: Listing[] = json?.data?.exclusive_products ?? json?.exclusive_products ?? [];
        const empExclusivesRaw: Listing[] = json?.data?.emp_exclusive_products ?? json?.emp_exclusive_products ?? [];
        const totalCount: number = json?.data?.counts?.total_count ?? json?.counts?.total_count ?? products.length;
     console.log("shared  premium:", premiumsRaw);
        if (totalCount === 0 && empExclusivesRaw.length > 0) {
          // No products at all — fall back to the emp_exclusive_products pool
          // so the page isn't empty, all shown with the Spotlight Van design.
          const empItems = empExclusivesRaw.map((p) => ({ ...p, is_exclusive: true }));
          setPool({ featured: empItems, new: [], used: [] });
        } else if (isIndexed) {
          // Indexed pages split by slot_bucket into Featured/New/Used.
          // Premium and exclusive vans always come from their own top-level
          // arrays and only render on the Featured tab (position 3 =
          // exclusive, 4-5 = premium).
          const featuredSource = products.filter((p) => p.slot_bucket === "featured");
          const featuredItems  = buildFeaturedOrder(featuredSource, premiumsRaw, exclusivesRaw);
          const featuredIds    = new Set(featuredItems.map((p) => p.id));

          const newItems  = products.filter((p) => p.slot_bucket === "new"  && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));
          const usedItems = products.filter((p) => p.slot_bucket === "used" && !p.is_premium && !p.is_exclusive && !featuredIds.has(p.id));

          setPool({ featured: featuredItems, new: newItems, used: usedItems });
        } else {
          // Non-indexed pages get one combined grid instead of a split.
          const combined = buildFeaturedOrder(products, premiumsRaw, exclusivesRaw);
          setPool({ featured: combined, new: [], used: [] });
        }

        handleTotalPages(json?.pagination?.total_pages ?? 1);
      })
      .catch((err) => {
        console.warn('[StateHome] pool fetch failed, retaining existing data:', (err as any)?.message);
        // setSeo(null) was called at the top of this effect — restore from initialPool
        // so the H1/description don't vanish when the live re-fetch fails.
        if (!cancelled && initialPool?.seo) setSeo(initialPool.seo);
      })
      .finally(() => { if (!cancelled) setPoolLoading(false); });

    return () => { cancelled = true; };
  }, [poolApiUrl, page, isIndexed, ready]);

  // Pre-warm the next page's pool-listings response in the background so the
  // Cloudflare Worker serves it from KV before the user clicks "Next".
  // - No `cache: "no-store"` here — this is a warm call, not a live fetch.
  //   The Cloudflare Worker always intercepts /api/pool-listings/ and checks
  //   the json:pool: KV key first regardless of request cache headers.
  // - De-duped by poolApiUrl + page so a filter change always re-prefetches
  //   the correct next page for the new filter context.
  const prefetchedPoolKeyRef = useRef<string>("");
  useEffect(() => {
    // Skip pre-warm for non-indexed pages: page=2+ requests are never in KV
    // (worker keeps `page` in its cache key; warmer only warms page=1), so
    // every pre-warm call hits WordPress directly. Rapid refreshes on non-indexed
    // URLs pile up WordPress hits → SiteGround rate-limiting → 502.
    if (!ready || page >= maxPages || !isIndexed) return;
    const nextPage = page + 1;
    const key = `${poolApiUrl}::page=${nextPage}`;
    if (prefetchedPoolKeyRef.current === key) return;
    prefetchedPoolKeyRef.current = key;
    fetch(`${poolApiUrl}&page=${nextPage}`).catch(() => {});
  }, [poolApiUrl, page, maxPages, ready, isIndexed]);

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

  if (!ready) {
    // Full server-fetched pool: render real products so KV-cached HTML is
    // fully populated. This is the primary path for cache-generated variants.
    if (initialPool) {
      const ip = initialPool;
      return (
        <div className="lsd-page">
          {ip.isIndexed ? (
            <StateHero
              title={ip.seo?.h1}
              description={ip.seo?.short_description || ip.seo?.meta_description}
              loading={false}
              breadcrumbs={buildFilterBreadcrumbs(filters)}
            />
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
          {ip.isIndexed ? (
            <>
              <StateListingGrid
                title={ip.seo?.meta_title ? `Featured ${ip.seo.meta_title}` : ""}
                viewAllHref={`${buildListingsSlug(filters)}?featured=1`}
                items={ip.featured}
                loading={false}
                showSpotlight={true}
                hideViewAll
                hideBanners={!!filters.make}
              />
              <StateListingGrid
                title=""
                viewAllHref={buildListingsSlug(filters, "New")}
                items={ip.new}
                loading={false}
                hideViewAll={page > 1}
                hideBanners={!!filters.make}
              />
              <StateListingGrid
                title=""
                viewAllHref={buildListingsSlug(filters, "Used")}
                items={ip.used}
                loading={false}
                hideViewAll={page > 1}
                hideBanners={!!filters.make}
              />
            </>
          ) : (
            <StateListingGrid
              title={ip.seo?.h1 || "Caravans for Sale"}
              titleAs="h1"
              viewAllHref={buildListingsSlug(filters)}
              items={ip.featured}
              loading={false}
              showSpotlight={true}
              hideViewAll
              hideBanners={!!filters.make}
            />
          )}
          <StateBrowseSection state={filters.state} region={filters.region} category={filters.category} initialData={browseData} />
          <StateContent footerDescription={ip.seo?.footer_description} faq={ip.seo?.faq} />
          <div className="lsd-sell-cta">
            <div className="lsd-sell-cta__inner">
              <h2 className="lsd-sell-cta__title">Looking to Sell Your Caravan?</h2>
              <p className="lsd-sell-cta__body">
                If you&apos;re upgrading or no longer need your current caravan,{" "}
                <a href="/sell-my-caravan/" className="lsd-sell-cta__link">sell your caravan</a>{" "}
                by creating a listing on CaravansForSale.com.au and connect with active buyers across Australia. Your advertisement stays online until it&apos;s sold for a one-time fee of $49.
              </p>
            </div>
          </div>
        </div>
      );
    }
    // Has server-fetched SEO only (no products): render structure with skeleton.
    if (initialSeo) return (
      <div className="lsd-page">
        <StateHero
          title={initialSeo.h1}
          description={initialSeo.short_description || initialSeo.meta_description}
          loading={false}
          breadcrumbs={buildFilterBreadcrumbs(filters)}
        />
        <StateFilterBar
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
        />
        <StateListingGrid
          title={initialSeo.meta_title ? `Featured ${initialSeo.meta_title}` : ""}
          viewAllHref=""
          items={[]}
          loading={true}
          showSpotlight={true}
          hideViewAll
        />
        <StateBrowseSection state={filters.state} region={filters.region} category={filters.category} initialData={browseData} />
        <StateContent footerDescription={initialSeo.footer_description} faq={initialSeo.faq} />
        <div className="lsd-sell-cta">
          <div className="lsd-sell-cta__inner">
            <h2 className="lsd-sell-cta__title">Looking to Sell Your Caravan?</h2>
            <p className="lsd-sell-cta__body">
              If you&apos;re upgrading or no longer need your current caravan,{" "}
              <a href="/sell-my-caravan/" className="lsd-sell-cta__link">sell your caravan</a>{" "}
              by creating a listing on CaravansForSale.com.au and connect with active buyers across Australia. Your advertisement stays online until it&apos;s sold for a one-time fee of $49.
            </p>
          </div>
        </div>
      </div>
    );
    // No server data at all — minimal white overlay (mobile flash prevention).
    return (
      <>
        <style>{`.lsd-mob-white{display:none}@media(max-width:767px){.lsd-mob-white{display:block}}`}</style>
        <div className="lsd-mob-white" style={{ minHeight: "100vh", background: "#fff" }} />
      </>
    );
  }

  if (page === 1) {
    console.log("seooo", seo?.h1)
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
              showSpotlight={true}
              hideViewAll
              hideBanners={!!filters.make}
            />

            <StateListingGrid
              title={newSeo?.meta_title || (seo?.meta_title ? `New ${seo.meta_title}` : "New Caravans")}
              viewAllHref={buildListingsSlug(filters, "New")}
              items={pool.new}
              loading={poolLoading}
              hideBanners={!!filters.make}
            />

            <StateListingGrid
              title={usedSeo?.meta_title || (seo?.meta_title ? `Used ${seo.meta_title}` : "Used Caravans")}
              viewAllHref={buildListingsSlug(filters, "Used")}
              items={pool.used}
              loading={poolLoading}
              hideBanners={!!filters.make}
            />
          </>
        ) : (
          // Non-indexed pages get one combined grid with no slot_bucket split.
          <StateListingGrid
            title={seo?.h1 || "Caravans for Sale"}
            titleAs="h1"
            viewAllHref={buildListingsSlug(filters)}
            items={pool.featured}
            loading={poolLoading}
            showSpotlight={true}
            hideViewAll
            hideBanners={!!filters.make}
          />
        )}

        {maxPages > 1 && pagination}

        <StateBrowseSection state={filters.state} region={filters.region} category={filters.category} initialData={browseData} />
        <StateContent footerDescription={seo?.footer_description} faq={seo?.faq} />
        <div className="lsd-sell-cta">
          <div className="lsd-sell-cta__inner">
            <h2 className="lsd-sell-cta__title">Looking to Sell Your Caravan?</h2>
            <p className="lsd-sell-cta__body">
              If you&apos;re upgrading or no longer need your current caravan,{" "}
              <a href="/sell-my-caravan/" className="lsd-sell-cta__link">sell your caravan</a>{" "}
              by creating a listing on CaravansForSale.com.au and connect with active buyers across Australia. Your advertisement stays online until it&apos;s sold for a one-time fee of $49.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // page > 1 — single combined grid, StateListingGrid self-fetches via apiUrl
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
          <h1 className="lsd-paged-title">{seo?.h1 || "Caravans for Sale"}</h1>
        </div>
      </div>

      <StateFilterBar
        currentFilters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      <StateListingGrid
        title=""
        viewAllHref={buildListingsSlug(filters)}
        apiUrl={allUrl}
        page={page}
        showSpotlight={true}
        hideViewAll
        onTotalPages={(n) => setMaxPages((prev) => Math.max(prev, n))}
      />

      {maxPages > 1 && pagination}

      <StateBrowseSection state={filters.state} region={filters.region} category={filters.category} initialData={browseData} />
      <StateContent footerDescription={seo?.footer_description} faq={seo?.faq} />
      <div className="lsd-sell-cta">
        <div className="lsd-sell-cta__inner">
          <h2 className="lsd-sell-cta__title">Looking to Sell Your Caravan?</h2>
          <p className="lsd-sell-cta__body">
            If you&apos;re upgrading or no longer need your current caravan,{" "}
            <a href="/sell-my-caravan/" className="lsd-sell-cta__link">sell your caravan</a>{" "}
            by creating a listing on CaravansForSale.com.au and connect with active buyers across Australia. Your advertisement stays online until it&apos;s sold for a one-time fee of $49.
          </p>
        </div>
      </div>
    </div>
  );
}
