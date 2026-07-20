import { NextRequest, NextResponse } from "next/server";
import { parseSlugToFilters, type Filters } from "@/app/components/urlBuilder";
import { buildSlugFromFilters } from "@/app/components/slugBuilter";
import { isAllowedSingleBand } from "@/utils/seo/band-utils";
import regionPathsData from "../cfs-paths/regions.json";
import makesData from "../cfs-paths/makes.json";
const API_KEY = process.env.CFS_API_KEY;
const SERVER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

/* Valid region slugs built from cfs-paths/regions.json (sitemap source of truth) */
const VALID_REGION_SLUGS = new Set<string>(
  (regionPathsData.paths as string[]).map(p => {
    const part = p.split('/').find(s => s.endsWith('-region'));
    return part ? part.replace(/-region$/, '') : '';
  }).filter(Boolean)
);

/* Valid make slugs built from cfs-paths/makes.json — zero API dependency */
const VALID_MAKE_SLUGS = new Set<string>(
  (makesData.paths as string[]).map(p => p.replace(/\/$/, ''))
);

/* ──────────────────────────────────────────────
   Edge-safe in-memory cache
────────────────────────────────────────────── */
const seoCache = new Map<string, { robots: string; isEmpty: boolean; hasExclusiveOnly: boolean; expires: number; staleExpires: number }>();
const productCache = new Map<string, { exists: boolean; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000;       // 10 min fresh
const CACHE_STALE_TTL = 60 * 60 * 1000; // 1 hr stale-while-revalidate window


/* Valid Australian state slug parts (the bit before -state in the URL) */
const VALID_AU_STATES = new Set([
  'queensland', 'new-south-wales', 'victoria', 'south-australia',
  'western-australia', 'tasmania', 'northern-territory', 'australian-capital-territory',
  'nsw', 'vic', 'qld', 'sa', 'wa', 'tas', 'nt', 'act',
]);

const API_WP = 'https://admin.caravansforsale.com.au/wp-json/cfs/v1';



/* Per-suburb validation cache (search API, 1 hr TTL per suburb:pincode key) */
const suburbValidCache = new Map<string, { valid: boolean; expires: number }>();

async function isValidSuburb(suburb: string, pincode: string | undefined, apiKey: string | undefined): Promise<boolean> {
  const cacheKey = `${suburb}:${pincode ?? ''}`;
  const cached = suburbValidCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.valid;
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_WP}/location-search?keyword=${encodeURIComponent(suburb)}`, {
      headers: { 'User-Agent': SERVER_UA, ...(apiKey && { 'X-API-Key': apiKey }) },
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (res.ok) {
      const data = await res.json();
      const results: { uri?: string }[] = data?.pincode_location_region_state ?? [];
      const suburbSlug = suburb.replace(/\s+/g, '-').toLowerCase();
      const valid = results.some(r => {
        if (!r.uri) return false;
        const u = r.uri.toLowerCase();
        return pincode
          ? u.includes(`${suburbSlug}-${pincode}-suburb`) || u.includes(`/${suburbSlug}-suburb/${pincode}`)
          : u.includes(`${suburbSlug}-suburb`);
      });
      suburbValidCache.set(cacheKey, { valid, expires: Date.now() + 60 * 60 * 1000 });
      return valid;
    }
  } catch {}
  return true; // allow through on API error — don't block valid requests
}

/* ──────────────────────────────────────────────
   Bot Detection
────────────────────────────────────────────── */
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'crawler',
  'spider',
  'bot'
] as const;

function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

/* Helper: redirect to /404 */
function gone404(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/404', request.url), { status: 302 });
}

/* Helper: serve the /410/ page content with HTTP 410 status — URL stays unchanged in browser */
function render410(request: NextRequest): NextResponse {
  const newHeaders = new Headers(request.headers);
  newHeaders.set('x-skip-middleware', '1');
  const res = NextResponse.rewrite(new URL('/410/', request.url), { status: 410, request: { headers: newHeaders } });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}


/** Convert parsed Filters to API query params (mirrors the logic in api/listings/api.ts). */
function buildApiParams(filters: Filters): URLSearchParams {
  const p = new URLSearchParams();
  p.set('page', '1');
  if (filters.category) p.set('category', filters.category);
  if (filters.make) p.set('make', filters.make);
  if (filters.model) p.set('model', filters.model);
  if (filters.state) p.set('state', filters.state);
  if (filters.region) p.set('region', filters.region);
  if (filters.suburb) p.set('suburb', filters.suburb);
  if (filters.pincode) p.set('pincode', filters.pincode);
  if (filters.from_price) p.set('from_price', `${filters.from_price}`);
  if (filters.to_price) p.set('to_price', `${filters.to_price}`);
  if (filters.minKg) p.set('from_atm', `${filters.minKg}`);
  if (filters.maxKg) p.set('to_atm', `${filters.maxKg}`);
  if (filters.from_length) p.set('from_length', `${filters.from_length}`);
  if (filters.to_length) p.set('to_length', `${filters.to_length}`);
  if (filters.condition) p.set('condition', filters.condition.toLowerCase().replace(/\s+/g, '-'));
  if (filters.sleeps) p.set('sleep', `${filters.sleeps}`);
  if (filters.from_sleep) p.set('from_sleep', `${filters.from_sleep}`);
  if (filters.to_sleep) p.set('to_sleep', `${filters.to_sleep}`);
  if (filters.acustom_fromyears) p.set('acustom_fromyears', `${filters.acustom_fromyears}`);
  if (filters.acustom_toyears) p.set('acustom_toyears', `${filters.acustom_toyears}`);
  return p;
}

async function refreshSeoCache(cacheKey: string, url: URL, request: NextRequest) {
  try {
    const slugParts = url.pathname.replace("/listings", "").split("/").filter(Boolean);
    const filters = parseSlugToFilters(slugParts, Object.fromEntries(url.searchParams));
    const apiParams = buildApiParams(filters);
    const apiUrl = "https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code?" + apiParams.toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const apiRes = await fetch(apiUrl, {
      headers: { "User-Agent": SERVER_UA, ...(API_KEY && { "X-API-Key": API_KEY }) },
      signal: controller.signal,
      // @ts-ignore
      next: { revalidate: 3600 },
    });
    clearTimeout(timeoutId);
    if (apiRes.ok) {
      const data = await apiRes.json();
      const products = data?.data?.products ?? [];
      const empExclusive = data?.emp_exclusive_products ?? [];
      const isEmpty = products.length === 0 && empExclusive.length === 0;
      const hasExclusiveOnly = products.length === 0 && empExclusive.length > 0;
      const seo = data?.seo_v2 ?? data?.seo ?? {};
      const rawIndex = String(seo?.index ?? "").toLowerCase().trim();
      const rawFollow = String(seo?.follow ?? "").toLowerCase().trim();
      let robots = (rawIndex === "noindex" ? "noindex" : "index") + ", " + (rawFollow === "nofollow" ? "nofollow" : "follow");
      const hasBand = !!(filters.maxKg || filters.minKg || filters.to_price || filters.from_price || filters.to_length || filters.from_length || filters.to_sleep || filters.from_sleep);
      const hasOtherFilters = !!(filters.make || filters.model || filters.state || filters.region || filters.category);
      const isSingleAllowedBand = hasBand && !hasOtherFilters && isAllowedSingleBand(slugParts);
      if ((hasBand && !isSingleAllowedBand) || isEmpty || hasExclusiveOnly) robots = "noindex, nofollow";
      seoCache.set(cacheKey, { robots, isEmpty, hasExclusiveOnly, expires: Date.now() + CACHE_TTL, staleExpires: Date.now() + CACHE_STALE_TTL });
    }
  } catch {}
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;
  const userAgent = request.headers.get('user-agent') || '';

  // `.startsWith('/listings')` also matches `/listings-demo` (no slash boundary) —
  // use this everywhere instead so the listings-only 410/SEO checks below don't
  // run against the listings-demo reference route and misparse its slugs.
  const isListingsPath = url.pathname === '/listings' || url.pathname.startsWith('/listings/');
  const isListingsDemoPath = url.pathname === '/listings-demo' || url.pathname.startsWith('/listings-demo/');

  // Second pass from render410() — listing page renders its own exclusive-products check
  if (request.headers.get('x-skip-middleware') === '1') {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // Internal fetch from /api/listings-410/ route handler — skip all checks, set x-pathname
  if (request.headers.get('x-internal-render') === '1') {
    const bypassHeaders = new Headers(request.headers);
    bypassHeaders.set('x-pathname', url.pathname);
    return NextResponse.next({ request: { headers: bypassHeaders } });
  }

  // Forward pathname to server components (for per-slug metadata injection in root layout)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', url.pathname);

  /* 🚫 Block /page/N/ path segments OR ?page= query param → HTTP 410 Gone (no redirect) */
  if (
    (/\/page\/\d+/i.test(url.pathname) && !url.pathname.startsWith('/blog/')) ||
    (url.searchParams.has('page') && !url.pathname.startsWith('/api'))
  ) {
    return render410(request);
  }

  /* 🚫 Listings: forbidden segments, unknown params, OR wrong URL order → 410 */
  if (isListingsPath) {
    const segments = url.pathname.split('/').filter(Boolean);
    const hasForbiddenSegment = segments.some(s => /(page|feed)/i.test(s));

    const ALLOWED_PARAMS = new Set(['clickid', 'orderby', 'search', 'keyword', 'radius_kms', 'shuffle_seed']);
    const hasUnknownParam = Array.from(url.searchParams.keys()).some(k => !ALLOWED_PARAMS.has(k.toLowerCase()));
    const hasForbiddenValue = Array.from(url.searchParams.values()).some(v => /(page|feed)/i.test(v));

    if (hasForbiddenSegment) {
      return gone404(request);
    }
    if (hasUnknownParam || hasForbiddenValue) {
      return render410(request);
    }

    // Wrong URL order + value validation → 410 (URL unchanged, no redirect)
    const slugParts = url.pathname.replace('/listings', '').split('/').filter(Boolean);

    // ?keyword or ?search combined with any slug-based path filter → 410
    const hasKeywordParam = url.searchParams.has('keyword') || url.searchParams.has('search');
    if (hasKeywordParam && slugParts.length > 0) {
      return render410(request);
    }

    if (slugParts.length > 0) {
      try {
        const filters = parseSlugToFilters(slugParts, Object.fromEntries(url.searchParams));
        const canonicalPath = buildSlugFromFilters(filters);
        const incomingPath = `/listings/${slugParts.join('/')}`;
        const norm = (p: string) => p.replace(/\/$/, '').toLowerCase();
        if (norm(canonicalPath) !== norm(incomingPath)) {
          return render410(request);
        }

        // Search slug + any other filter → 410; search alone → 200
        if (slugParts.some(s => s.endsWith('-search'))) {
          const hasOtherFilter = !!(
            filters.make || filters.model || filters.condition || filters.category ||
            filters.state || filters.region || filters.suburb ||
            filters.from_price || filters.to_price ||
            filters.minKg || filters.maxKg ||
            filters.from_length || filters.to_length ||
            filters.from_sleep || filters.to_sleep ||
            filters.acustom_fromyears || filters.acustom_toyears
          );
          if (hasOtherFilter) {
            const rewriteUrl = new URL(`/api/listings-410/${slugParts.join('/')}`, request.url);
            url.searchParams.forEach((v, k) => rewriteUrl.searchParams.set(k, v));
            return NextResponse.rewrite(rewriteUrl);
          }
        }

        // State value validation — check the slug part before -state suffix
        const stateSegment = slugParts.find(s => s.endsWith('-state'));
        if (stateSegment) {
          const stateSlug = stateSegment.replace(/-state$/, '');
          if (!VALID_AU_STATES.has(stateSlug)) {
            return render410(request);
          }
        }

        // Make value validation — check against cfs-paths/makes.json (sitemap source of truth)
        if (filters.make && !VALID_MAKE_SLUGS.has(filters.make)) {
          return render410(request);
        }

        // Region value validation — check against cfs-paths/regions.json (sitemap source of truth)
        const regionSegment = slugParts.find(s => s.endsWith('-region'));
        if (regionSegment) {
          const regionSlug = regionSegment.replace(/-region$/, '');
          if (!VALID_REGION_SLUGS.has(regionSlug)) {
            return render410(request);
          }
        }

        // Suburb value validation — check against location-search API (cached per suburb)
        if (filters.suburb) {
          const suburbOk = await isValidSuburb(filters.suburb, filters.pincode, API_KEY);
          if (!suburbOk) {
            return render410(request);
          }
        }
      } catch {
        // parse error → let page component handle it
      }
    }
  }

  /* 🚫 Unknown multi-segment paths → 410 (e.g. /queensland-state/stoney-creek/ without /listings/ prefix) */
  const KNOWN_MULTI_SEGMENT = new Set([
    'listings', 'listings-demo', 'product', 'api', '_next', 'blog', 'author', 'caravan-manufacturers',
    '410', '404', '410-new', 'images', 'fonts', 'icons',
    'demo', 'product-detail-demo',
    'sell-my-caravan',
  ]);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  if (pathSegments.length >= 2 && !KNOWN_MULTI_SEGMENT.has(pathSegments[0])) {
    return render410(request);
  }

  /* 🙈 listings-demo is a reference/backup copy of the old listings system —
     force noindex, nofollow on every URL under it, and skip the listings-only
     410/SEO checks above entirely (they don't apply to this route). */
  if (isListingsDemoPath) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  /* 🤖 Bot Detection — listing and product pages not early-returned so they get 0-product/410 check */
  if (isBot(userAgent) && !isListingsPath && !url.pathname.startsWith('/product/')) {
    console.log(`🤖 Bot detected: ${userAgent.substring(0, 50)}...`);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('X-Is-Bot', 'true');
    return response;
  }

  /* 🚫 Product pages: non-existent slugs → HTTP 410 Gone */
  if (url.pathname.startsWith('/product/')) {
    const slug = url.pathname.replace(/^\/product\//, '').replace(/\/$/, '');
    if (slug) {
      const cacheKey = `product:${slug}`;
      const cached = productCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        if (!cached.exists) return render410(request);
      } else {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE || 'https://admin.caravansforsale.com.au/wp-json/cfs/v1';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const apiRes = await fetch(
            `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
            {
              headers: {
                'User-Agent': SERVER_UA,
                ...(API_KEY && { 'X-API-Key': API_KEY }),
              },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);
          if (!apiRes.ok) {
            productCache.set(cacheKey, { exists: false, expires: Date.now() + CACHE_TTL });
            return render410(request);
          }
          const rawText = await apiRes.text();
          const jsonIdx = rawText.indexOf('{"');
          const data = JSON.parse(jsonIdx >= 0 ? rawText.substring(jsonIdx) : rawText);
          if (!data || Object.keys(data).length === 0) {
            productCache.set(cacheKey, { exists: false, expires: Date.now() + CACHE_TTL });
            return render410(request);
          }
          productCache.set(cacheKey, { exists: true, expires: Date.now() + CACHE_TTL });
        } catch (error: any) {
          if (error?.name !== 'AbortError') {
            console.error('Middleware product 410 check error:', error);
          }
          // On timeout/error: let the page component handle it
        }
      }
    }
  }

 if (
    !url.pathname.endsWith('/') &&
    !url.pathname.includes('.') &&
    !url.pathname.startsWith('/api') &&
    !url.pathname.startsWith('/_next') &&
     !isListingsPath
  ) {
    url.pathname = `${url.pathname}/`;
    return NextResponse.redirect(url, 308);
  }
  /* 1️⃣ Block /feed URLs */
  if (/feed/i.test(fullPath)) {
    return new NextResponse(null, { status: 410 });
  }
  /* 2️⃣ Remove add-to-cart param */

  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");
    return NextResponse.redirect(url, { status: 301 });
  }

  /* 3️⃣ SEO Middleware (LISTINGS ONLY) */
  let robotsHeader = "index, follow";

  if (isListingsPath) {
    const cacheKey = fullPath;

    /* 🔹 Cache hit (fresh or stale-while-revalidate) */
    const cached = seoCache.get(cacheKey);
    const now = Date.now();
    const isFresh = cached && cached.expires > now;
    const isStale = cached && !isFresh && cached.staleExpires > now;

    if (isFresh || isStale) {
      if (isStale) {
        // Revalidate in background — don't block the response
        refreshSeoCache(cacheKey, url, request).catch(() => {});
      }
      // isEmpty → let ISR/page component handle it (don't 410 from middleware)
      if (cached!.hasExclusiveOnly) {
        const rawSlug = url.pathname.replace(/^\/listings\/?/, '').replace(/\/$/, '');
        const rewriteUrl = new URL(`/api/listings-410/${rawSlug}/`, request.url);
        url.searchParams.forEach((v, k) => rewriteUrl.searchParams.set(k, v));
        return NextResponse.rewrite(rewriteUrl);
      }
      robotsHeader = cached!.robots;
    } else {
      try {
        const slugParts = url.pathname
          .replace("/listings", "")
          .split("/")
          .filter(Boolean);

        const filters = parseSlugToFilters(
          slugParts,
          Object.fromEntries(url.searchParams)
        );

        // Build API params using the same mapping as fetchListings (api/listings/api.ts).
        // Raw filter keys (minKg, maxKg, sleeps) must be converted to API names (from_atm, to_atm, sleep).
        const apiParams = buildApiParams(filters);
        const apiUrl =
          "https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code?" +
          apiParams.toString();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const apiRes = await fetch(apiUrl, {
          headers: {
            "User-Agent": SERVER_UA,
            ...(API_KEY && { "X-API-Key": API_KEY }),
          },
          signal: controller.signal,
          // @ts-ignore - Edge runtime specific
          next: { revalidate: 3600 },
        });

        clearTimeout(timeoutId);

        if (apiRes.ok) {
          const raw = await apiRes.text();
          const idx = raw.indexOf('{"');
          let data: any;
          try {
            data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
          } catch {
            data = {};
          }

          // 0 regular products:
          //   - empExclusive also empty → 410 (Vercel shows its own Gone page — no content anyway)
          //   - empExclusive has items  → 200 noindex (Vercel intercepts 410+rewrite, page must show exclusive content)
          const products = data?.data?.products ?? [];
          const empExclusive = data?.emp_exclusive_products ?? [];
          if (products.length === 0) {
            if (empExclusive.length === 0) {
              // Don't 410 from middleware — ISR/page component handles empty state
              seoCache.set(cacheKey, { robots: "noindex, nofollow", isEmpty: true, hasExclusiveOnly: false, expires: Date.now() + CACHE_TTL, staleExpires: Date.now() + CACHE_STALE_TTL });
              robotsHeader = "noindex, nofollow";
            } else {
              seoCache.set(cacheKey, { robots: "noindex, nofollow", isEmpty: false, hasExclusiveOnly: true, expires: Date.now() + CACHE_TTL, staleExpires: Date.now() + CACHE_STALE_TTL });
              const rewriteUrl = new URL(`/api/listings-410/${slugParts.join('/')}${url.search}`, request.url);
              return NextResponse.rewrite(rewriteUrl);
            }
          } else {

          const seo = data?.seo_v2 ?? data?.seo ?? {};
          const rawIndex = String(seo?.index ?? "").toLowerCase().trim();
          const rawFollow = String(seo?.follow ?? "").toLowerCase().trim();

          robotsHeader =
            (rawIndex === "noindex" ? "noindex" : "index") +
            ", " +
            (rawFollow === "nofollow" ? "nofollow" : "follow");

          // Band pages: noindex unless it's a single allowed band filter with no other filters.
          const hasBand = !!(filters.maxKg || filters.minKg || filters.to_price || filters.from_price ||
            filters.to_length || filters.from_length || filters.to_sleep || filters.from_sleep);
          const hasOtherFilters = !!(filters.make || filters.model || filters.state || filters.region || filters.category);
          const isSingleAllowedBand = hasBand && !hasOtherFilters && isAllowedSingleBand(slugParts);
          if (hasBand && !isSingleAllowedBand) {
            robotsHeader = "noindex, nofollow";
          }

          seoCache.set(cacheKey, {
            robots: robotsHeader,
            isEmpty: false,
            hasExclusiveOnly: false,
            expires: Date.now() + CACHE_TTL,
            staleExpires: Date.now() + CACHE_STALE_TTL,
          });
          } // close else (products > 0)
        } else if (apiRes.status === 410) {
          // WordPress returns 410 for 0 products — set noindex but let ISR/page handle display
          try {
            const raw410 = await apiRes.text();
            const idx410 = raw410.indexOf('{"');
            const data410 = JSON.parse(idx410 > 0 ? raw410.substring(idx410) : raw410);
            const empExclusive410 = data410?.emp_exclusive_products ?? [];
            if (empExclusive410.length === 0) {
              seoCache.set(cacheKey, { robots: "noindex, nofollow", isEmpty: true, hasExclusiveOnly: false, expires: Date.now() + CACHE_TTL, staleExpires: Date.now() + CACHE_STALE_TTL });
              robotsHeader = "noindex, nofollow";
              // Don't render410 — let ISR serve cached HTML
            } else {
              seoCache.set(cacheKey, { robots: "noindex, nofollow", isEmpty: false, hasExclusiveOnly: true, expires: Date.now() + CACHE_TTL, staleExpires: Date.now() + CACHE_STALE_TTL });
              const rewriteUrl410 = new URL(`/api/listings-410/${slugParts.join('/')}${url.search}`, request.url);
              return NextResponse.rewrite(rewriteUrl410);
            }
          } catch {
            seoCache.set(cacheKey, { robots: "noindex, nofollow", isEmpty: true, hasExclusiveOnly: false, expires: Date.now() + CACHE_TTL, staleExpires: Date.now() + CACHE_STALE_TTL });
            robotsHeader = "noindex, nofollow";
            // Don't render410 — let ISR serve cached HTML
          }
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Middleware SEO error:", error);
        }
      }
    }
  }

  /* 4️⃣ Create response */
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isListingsPath) {
    response.headers.set("X-Robots-Tag", robotsHeader);
  }

  if (isBot(userAgent)) {
    response.headers.set('X-Is-Bot', 'true');
  }

  return response;
}

/* ──────────────────────────────────────────────
   Matcher
────────────────────────────────────────────── */
export const config = {
  matcher: [
    "/",
    "/listings/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
