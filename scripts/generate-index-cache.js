/* eslint-disable */
/**
 * Index Cache Generator (HTML only)
 *
 * Reads src/app/url.csv (all 3,462 indexable listing URLs) and generates:
 *   HTML KV cache — 5 rendered variants per URL (fetched from Vercel with shuffle_seed)
 *
 * JSON KV cache is handled by the WordPress plugin (cfs-json-cache-warmer) which
 * calls get_products_fast_new() directly in PHP — no HTTP requests needed.
 *
 * Supports BATCH_SIZE + BATCH_NUMBER for parallel GitHub Actions matrix runs.
 * Set SKIP_ROUTES_UPDATE=true when running in parallel; the update-routes-mapping
 * job rebuilds routes-mapping from KV metadata after all batches finish.
 *
 * KV key format — must match worker.js:
 *   HTML:  {slug}-v{1..5}   (e.g. caravans-victoria-v1)
 *
 * Routes-mapping entry (ALWAYS arrays):
 *   "/listings/caravans/victoria/": ["caravans-victoria-v1", ..., "caravans-victoria-v5"]
 *
 * PRIORITY PATHS (/listings/ and /) are skipped here — they are Puppeteer-rendered
 * by generate-priority-pages.js with special slug names (listings-home, homepage).
 */

// node-fetch removed — use Node.js 24 native fetch (undici).
// undici negotiates HTTP/2 via TLS ALPN, avoiding ERR_STREAM_PREMATURE_CLOSE
// that occurred when Cloudflare's HTTP/2 stream was translated to HTTP/1.1
// chunked encoding for node-fetch v2.
const fs   = require('fs');
const path = require('path');

/**
 * fetch() with an explicit timeout via AbortController.
 * Replaces node-fetch's `timeout` option which is not supported in native fetch.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs}ms`);
    throw err;
  }
}

// ── Environment ───────────────────────────────────────────────────────────────
const VERCEL_BASE_URL    = process.env.VERCEL_BASE_URL    || 'https://caravansforsale-main-live.vercel.app';
const CF_ACCOUNT_ID      = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN       = process.env.CF_API_TOKEN;
const URLS_CSV           = process.env.URLS_CSV || path.join(__dirname, '../src/app/url.csv');
const SKIP_ROUTES_UPDATE = process.env.SKIP_ROUTES_UPDATE === 'true';
const BATCH_SIZE         = process.env.BATCH_SIZE   ? parseInt(process.env.BATCH_SIZE,   10) : null;
const BATCH_NUMBER       = process.env.BATCH_NUMBER ? parseInt(process.env.BATCH_NUMBER, 10) : null;

// ── Configuration ─────────────────────────────────────────────────────────────
const HTML_VARIANTS       = 5;
const HTML_CONCURRENCY    = 3;   // max parallel URL slots for HTML generation
const HTML_FETCH_TIMEOUT  = 30000;
const KV_UPLOAD_RETRIES   = 3;
const KV_RETRY_DELAY      = 2000;
const DELAY_BETWEEN_URLS  = 200; // ms between URL batches to reduce burst load

// Priority paths are rendered by generate-priority-pages.js with special slugs
// (homepage, listings-home). Skip them here to avoid slug conflicts.
const PRIORITY_PATHS = new Set(['/', '/listings/']);

// HTTP statuses that must not be retried (saves ~6 s wasted per variant)
const HTML_SKIP_IMMEDIATELY = new Set([404, 410, 500, 502, 503]);

// ── CSV parsing ───────────────────────────────────────────────────────────────
/**
 * Read tab-separated url.csv. Format: ID\tURL (header row skipped).
 */
function readUrlsFromCsv(csvPath) {
  const raw   = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.trim().split('\n');
  const urls  = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const url  = (cols[1] || cols[0] || '').trim();
    if (url && url.startsWith('http')) urls.push(url);
  }
  return urls;
}

// ── Path utilities ────────────────────────────────────────────────────────────
/**
 * Extract pathname from a full URL and normalise to trailing slash.
 * e.g. https://...com.au/listings/nsw-state → /listings/nsw-state/
 */
function urlToPath(urlStr) {
  try {
    const u = new URL(urlStr);
    let p = u.pathname;
    if (!p.endsWith('/')) p += '/';
    return p;
  } catch {
    return null;
  }
}

/**
 * Convert a /listings/... path to a KV slug.
 * MUST remain identical to generate-sitemap-cache-simple.js convertPathToSlug
 * so routes-mapping keys stay consistent.
 *
 * /listings/caravans/nsw/  → caravans-nsw
 * /listings/motorhomes/    → motorhomes
 */
function pathToSlug(p) {
  let s = p;
  if (s.startsWith('/listings/')) s = s.substring(10);
  s = s.replace(/^\/+|\/+$/g, '');
  s = s.replace(/\//g, '-');
  s = s.replace(/[^a-z0-9-]/g, '');
  if (s.length > 150) s = s.substring(0, 150);
  return s || 'home';
}

// ── Path → WP API params ──────────────────────────────────────────────────────
/**
 * Parse a listing URL into URLSearchParams for the WP API.
 * Mirrors generate-json-cache.js parsePathToApiParams exactly so KV keys match.
 */
function pathToApiParams(urlStr) {
  try {
    const urlObj = new URL(urlStr);
    const pathAfterListings = urlObj.pathname
      .replace(/^\/listings\//, '')
      .replace(/\/$/, '');

    if (!pathAfterListings) return buildApiParams({});

    const segments = pathAfterListings.split('/').filter(Boolean);
    const filters  = {};

    for (const rawSeg of segments) {
      const seg = decodeURIComponent(rawSeg).split('?')[0].trim().toLowerCase();
      if (!seg) continue;

      if (seg.endsWith('-category'))  { filters.category  = seg.slice(0, -9); continue; }
      if (seg.endsWith('-condition')) {
        const sl = seg.slice(0, -10);
        filters.condition = sl === 'new' ? 'New' : sl === 'used' ? 'Used' : sl;
        continue;
      }
      if (seg.endsWith('-state'))     { filters.state  = seg.slice(0, -6).replace(/-/g, ' ');  continue; }
      if (seg.endsWith('-region'))    { filters.region = seg.slice(0, -7).replace(/-/g, ' ');  continue; }
      if (seg.endsWith('-make'))      { filters.make   = seg.slice(0, -5);                     continue; }
      if (seg.endsWith('-model'))     { filters.model  = seg.slice(0, -6);                     continue; }

      const suburbPin = seg.match(/^([a-z0-9-]+)-(\d{4})-suburb$/);
      if (suburbPin) {
        filters.suburb  = suburbPin[1].replace(/-/g, ' ');
        filters.pincode = suburbPin[2];
        continue;
      }

      if (seg.endsWith('-suburb')) { filters.suburb  = seg.slice(0, -7).replace(/-/g, ' '); continue; }
      if (/^\d{4}$/.test(seg))    { filters.pincode = seg; continue; }

      let m;
      m = seg.match(/^between-(\d+)-kg-(\d+)-kg-atm$/);   if (m) { filters.minKg = m[1]; filters.maxKg = m[2]; continue; }
      m = seg.match(/^between-(\d+)-(\d+)-kg-atm$/);      if (m) { filters.minKg = m[1]; filters.maxKg = m[2]; continue; }
      m = seg.match(/^between-(\d+)-kg-(\d+)-atm$/);      if (m) { filters.minKg = m[1]; filters.maxKg = m[2]; continue; }
      m = seg.match(/^between-(\d+)-and-(\d+)-kg-atm$/);  if (m) { filters.minKg = m[1]; filters.maxKg = m[2]; continue; }
      m = seg.match(/^under-(\d+)-kg-atm$/);              if (m) { filters.maxKg = m[1]; continue; }
      m = seg.match(/^over-(\d+)-kg-atm$/);               if (m) { filters.minKg = m[1]; continue; }

      m = seg.match(/^between-(\d+)-(\d+)-length-in-feet$/);        if (m) { filters.from_length = m[1]; filters.to_length = m[2]; continue; }
      m = seg.match(/^between-(\d+)-ft-(\d+)-ft-length-in-feet$/);  if (m) { filters.from_length = m[1]; filters.to_length = m[2]; continue; }
      m = seg.match(/^between-(\d+)-and-(\d+)-length-in-feet$/);    if (m) { filters.from_length = m[1]; filters.to_length = m[2]; continue; }

      m = seg.match(/^(\d+)-to-(\d+)-people-sleeping-capacity$/);      if (m) { filters.from_sleep = m[1]; filters.to_sleep = m[2]; continue; }
      m = seg.match(/^between-(\d+)-(\d+)-people-sleeping-capacity$/); if (m) { filters.from_sleep = m[1]; filters.to_sleep = m[2]; continue; }
      m = seg.match(/^(\d+)-people-sleeping-capacity$/);               if (m) { filters.from_sleep = m[1]; filters.to_sleep = m[1]; continue; }

      m = seg.match(/^between-(\d+)-(\d+)$/);       if (m) { filters.from_price = m[1]; filters.to_price = m[2]; continue; }
      m = seg.match(/^between-(\d+)-and-(\d+)$/);   if (m) { filters.from_price = m[1]; filters.to_price = m[2]; continue; }
      m = seg.match(/^under-(\d+)$/);               if (m) { filters.to_price = m[1]; continue; }
      m = seg.match(/^over-(\d+)$/);                if (m) { filters.from_price = m[1]; continue; }

      m = seg.match(/^(\d{4})-(\d{4})$/);
      if (m) { filters.acustom_fromyears = m[1]; filters.acustom_toyears = m[2]; continue; }

      if (!filters.make) filters.make = seg;
    }

    return buildApiParams(filters);
  } catch {
    return null;
  }
}

function buildApiParams(filters) {
  const p = new URLSearchParams();
  p.append('page', '1');
  if (filters.category)          p.append('category',          filters.category);
  if (filters.make)              p.append('make',              filters.make);
  if (filters.model)             p.append('model',             filters.model);
  if (filters.state)             p.append('state',             filters.state);
  if (filters.region)            p.append('region',            filters.region);
  if (filters.suburb)            p.append('suburb',            filters.suburb);
  if (filters.pincode)           p.append('pincode',           filters.pincode);
  if (filters.condition)         p.append('condition',         filters.condition);
  if (filters.from_price)        p.append('from_price',        filters.from_price);
  if (filters.to_price)          p.append('to_price',          filters.to_price);
  if (filters.minKg)             p.append('from_atm',          filters.minKg);
  if (filters.maxKg)             p.append('to_atm',            filters.maxKg);
  if (filters.from_length)       p.append('from_length',       filters.from_length);
  if (filters.to_length)         p.append('to_length',         filters.to_length);
  if (filters.from_sleep)        p.append('from_sleep',        filters.from_sleep);
  if (filters.to_sleep)          p.append('to_sleep',          filters.to_sleep);
  if (filters.acustom_fromyears) p.append('acustom_fromyears', filters.acustom_fromyears);
  if (filters.acustom_toyears)   p.append('acustom_toyears',   filters.acustom_toyears);
  return p;
}

/**
 * Build the json:api:* KV cache key. Must match worker.js buildJsonCacheKey exactly.
 */
function buildJsonKvKey(params) {
  const sorted = [...params.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `json:api:${sorted || '_root'}`;
}

// ── Error page detection ──────────────────────────────────────────────────────
const ERROR_SIGNATURES = [
  'Sorry, something went wrong',
  "We couldn't load the listings at this moment",
  'Service error',
  'Our listing service encountered an error',
  'Oops! Something went wrong',
  'temporarily unavailable',
  'Application error: a client-side exception has occurred',
  'This page could not be found',
];

function isErrorPage(html) {
  for (const sig of ERROR_SIGNATURES) {
    if (html.includes(sig)) return sig;
  }
  return false;
}

// ── Pool data pre-loading ─────────────────────────────────────────────────────
/**
 * Parse a /listings/… path into pool-listings API query params.
 * Mirrors the parameter order of buildApiUrl() in src/app/listings/urlUtils.ts
 * so the injected URL matches what home.tsx constructs at runtime.
 */
function buildPoolRequestUrl(urlPath, seed) {
  let s = urlPath;
  if (s.startsWith('/listings/')) s = s.substring(10);
  s = s.replace(/^\/+|\/+$/g, '');
  const segments = s.split('/').filter(Boolean);

  let category, condition, state, region, make, model,
      fromPrice, toPrice, fromAtm, toAtm,
      fromSleep, toSleep, fromYear, toYear,
      fromLength, toLength, suburb, pincode;

  for (const rawSeg of segments) {
    const seg = rawSeg.toLowerCase();
    let m;

    if (seg.endsWith('-category'))  { category = seg.replace('-category', ''); continue; }
    if (seg.endsWith('-condition')) {
      const raw = seg.replace('-condition', '');
      condition = raw === 'new' ? 'New' : raw === 'used' ? 'Used' : raw;
      continue;
    }
    if (seg.endsWith('-state'))  { state  = seg.replace('-state', '').replace(/-/g, ' '); continue; }
    if (seg.endsWith('-region')) { region = seg.replace('-region', '').replace(/-/g, ' '); continue; }
    if (seg.endsWith('-make'))   { make   = seg.slice(0, -5); continue; }
    if (seg.endsWith('-model'))  { model  = seg.slice(0, -6); continue; }

    const suburbPin = seg.match(/^([a-z0-9-]+)-(\d{4})-suburb$/);
    if (suburbPin) { suburb = suburbPin[1].replace(/-/g, ' '); pincode = suburbPin[2]; continue; }
    if (seg.endsWith('-suburb')) { suburb = seg.slice(0, -7).replace(/-/g, ' '); continue; }
    if (/^\d{4}$/.test(seg))    { pincode = seg; continue; }

    m = seg.match(/^between-(\d+)-kg-(\d+)-kg-atm$/);  if (m) { fromAtm = m[1]; toAtm = m[2]; continue; }
    m = seg.match(/^between-(\d+)-(\d+)-kg-atm$/);     if (m) { fromAtm = m[1]; toAtm = m[2]; continue; }
    m = seg.match(/^between-(\d+)-kg-(\d+)-atm$/);     if (m) { fromAtm = m[1]; toAtm = m[2]; continue; }
    m = seg.match(/^between-(\d+)-and-(\d+)-kg-atm$/); if (m) { fromAtm = m[1]; toAtm = m[2]; continue; }
    m = seg.match(/^under-(\d+)-kg-atm$/);             if (m) { toAtm = m[1]; continue; }
    m = seg.match(/^over-(\d+)-kg-atm$/);              if (m) { fromAtm = m[1]; continue; }

    m = seg.match(/^between-(\d+)-(\d+)-length-in-feet$/);        if (m) { fromLength = m[1]; toLength = m[2]; continue; }
    m = seg.match(/^between-(\d+)-ft-(\d+)-ft-length-in-feet$/);  if (m) { fromLength = m[1]; toLength = m[2]; continue; }
    m = seg.match(/^between-(\d+)-and-(\d+)-length-in-feet$/);    if (m) { fromLength = m[1]; toLength = m[2]; continue; }

    m = seg.match(/^(\d+)-to-(\d+)-people-sleeping-capacity$/);      if (m) { fromSleep = m[1]; toSleep = m[2]; continue; }
    m = seg.match(/^between-(\d+)-(\d+)-people-sleeping-capacity$/); if (m) { fromSleep = m[1]; toSleep = m[2]; continue; }
    m = seg.match(/^(\d+)-people-sleeping-capacity$/);               if (m) { fromSleep = m[1]; toSleep = m[1]; continue; }

    m = seg.match(/^between-(\d+)-(\d+)$/);     if (m) { fromPrice = m[1]; toPrice = m[2]; continue; }
    m = seg.match(/^between-(\d+)-and-(\d+)$/); if (m) { fromPrice = m[1]; toPrice = m[2]; continue; }
    m = seg.match(/^under-(\d+)$/);             if (m) { toPrice = m[1]; continue; }
    m = seg.match(/^over-(\d+)$/);              if (m) { fromPrice = m[1]; continue; }

    m = seg.match(/^(\d{4})-(\d{4})$/);
    if (m) { fromYear = m[1]; toYear = m[2]; continue; }
  }

  // Build params in EXACT same order as buildApiUrl() in src/app/listings/urlUtils.ts
  // so preload.url === requestUrl check in home.tsx always passes for every URL type.
  const params = new URLSearchParams();
  params.set('orderby', 'default');
  params.set('seed', String(seed));
  if (state)      params.set('state',             state);
  if (category)   params.set('category',          category);
  if (make)       params.set('make',              make);
  if (model)      params.set('model',             model);
  if (region)     params.set('region',            region);
  if (suburb)     params.set('suburb',            suburb);
  if (pincode)    params.set('pincode',           pincode);
  if (fromPrice)  params.set('from_price',        fromPrice);
  if (toPrice)    params.set('to_price',          toPrice);
  if (fromAtm)    params.set('from_atm',          fromAtm);
  if (toAtm)      params.set('to_atm',            toAtm);
  if (fromSleep)  params.set('from_sleep',        fromSleep);
  if (toSleep)    params.set('to_sleep',          toSleep);
  if (fromYear)   params.set('acustom_fromyears', fromYear);
  if (toYear)     params.set('acustom_toyears',   toYear);
  if (fromLength) params.set('from_length',       fromLength);
  if (toLength)   params.set('to_length',         toLength);
  if (condition)  params.set('condition',         condition);

  return `/api/pool-listings/?per_page=24&${params.toString()}&page=1`;
}

/**
 * Fetch pool-listings JSON for one variant and return the object to embed,
 * or null on any error (HTML will still be cached without pre-loaded data).
 */
async function fetchPoolData(urlPath, seed) {
  const requestUrl = buildPoolRequestUrl(urlPath, seed);
  const fetchUrl = `${VERCEL_BASE_URL}${requestUrl}`;
  try {
    const res = await fetchWithTimeout(fetchUrl, {
      headers: { 'User-Agent': 'CFS-IndexCacheGenerator/1.0', 'Accept': 'application/json' },
    }, 15000);
    if (!res.ok) return null;
    const json = await res.json();
    // Sanity-check: must have at least some products
    const products = json?.data?.products ?? json?.products ?? [];
    if (!products.length) return null;
    return { url: requestUrl, json };
  } catch {
    return null;
  }
}

// ── Image optimisation injection ──────────────────────────────────────────────
function injectPerformanceTags(html) {
  const imageOptimizations = `
    <link rel="dns-prefetch" href="https://caravansforsale.imagestack.net" />
    <link rel="preconnect" href="https://caravansforsale.imagestack.net" crossorigin />`;

  const imageMatches = [...html.matchAll(/src="([^"]+\/(CFS-[^/]+)\/[^"]+\.(jpg|jpeg|png|webp))"/gi)];
  const firstImages  = imageMatches.slice(0, 6).map(match => {
    const imgPath = match[1];
    if (imgPath.includes('caravansforsale.imagestack.net')) return imgPath;
    const fileName = imgPath.split('/').slice(-2).join('/');
    return `https://caravansforsale.imagestack.net/800x800/${fileName}`;
  });

  const preloadLinks = firstImages
    .map(u => `<link rel="preload" as="image" href="${u}" fetchpriority="high" />`)
    .join('\n');

  html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
  html = html.replace('</head>', `${imageOptimizations}\n    ${preloadLinks}\n</head>`);
  return html;
}

// ── KV upload (multipart with metadata) ──────────────────────────────────────
async function uploadToKV(key, value, contentType, metadata) {
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;

  for (let attempt = 1; attempt <= KV_UPLOAD_RETRIES; attempt++) {
    try {
      const boundary = `----CFSBoundary${Date.now()}`;
      const metaJson = JSON.stringify(metadata || {});
      const body = [
        `--${boundary}\r\nContent-Disposition: form-data; name="value"; filename="blob"\r\nContent-Type: ${contentType}\r\n\r\n`,
        value,
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n`,
        metaJson,
        `\r\n--${boundary}--\r\n`,
      ].join('');

      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (!res.ok) {
        const txt = await res.text();
        if (attempt < KV_UPLOAD_RETRIES) { await delay(KV_RETRY_DELAY * attempt); continue; }
        throw new Error(`KV HTTP ${res.status}: ${txt.substring(0, 200)}`);
      }

      let result;
      try { result = await res.json(); } catch {
        if (attempt < KV_UPLOAD_RETRIES) { await delay(KV_RETRY_DELAY * attempt); continue; }
        throw new Error('KV returned non-JSON response');
      }

      if (result.success) return true;

      const errMsg = result.errors?.map(e => e.message).join(', ') || 'Unknown';
      if (attempt < KV_UPLOAD_RETRIES) { await delay(KV_RETRY_DELAY * attempt); continue; }
      throw new Error(`KV API: ${errMsg}`);
    } catch (e) {
      if (attempt === KV_UPLOAD_RETRIES) throw e;
      await delay(KV_RETRY_DELAY * attempt);
    }
  }
  return false;
}

// ── HTML generation ───────────────────────────────────────────────────────────
/**
 * Fetch and upload 5 HTML variants for one URL path.
 * Returns an array of successfully uploaded KV keys.
 */
async function generateHtmlVariants(urlPath, slug) {
  const variantKeys = [];

  for (let v = 1; v <= HTML_VARIANTS; v++) {
    // Bypass the Cloudflare Worker by fetching from Vercel directly.
    // Appending shuffle_seed causes the page to render with a unique product order.
    const fetchUrl = `${VERCEL_BASE_URL}${urlPath}?shuffle_seed=${v}`;
    const kvKey    = `${slug}-v${v}`;

    try {
      const res = await fetchWithTimeout(fetchUrl, {
        headers: { 'User-Agent': 'CFS-IndexCacheGenerator/1.0', 'Accept': 'text/html' },
      }, HTML_FETCH_TIMEOUT);

      if (HTML_SKIP_IMMEDIATELY.has(res.status)) {
        console.log(`   [HTML-v${v}] Skip HTTP ${res.status}`);
        if (res.status === 404) break; // all variants of a 404 URL will also 404
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      let html = await res.text();
      if (!html.includes('</html>')) throw new Error('Truncated HTML (no </html>)');

      const errMatch = isErrorPage(html);
      if (errMatch) { console.log(`   [HTML-v${v}] Error page: "${errMatch}"`); continue; }

      html = injectPerformanceTags(html);

      // Fetch pool-listings data for this variant and embed it into the HTML
      // so home.tsx can render products immediately on hydration without a
      // client-side API call. Falls back gracefully if the fetch fails.
      const poolData = await fetchPoolData(urlPath, v);
      if (poolData) {
        const poolJson = JSON.stringify(poolData).replace(/<\/script>/gi, '<\\/script>');
        html = html.replace('</head>', `<script>window.__INITIAL_POOL__ = ${poolJson};</script>\n</head>`);
        console.log(`   [HTML-v${v}] Pool pre-loaded (${(poolData.json?.data?.products ?? poolData.json?.products ?? []).length} products)`);
      } else {
        console.log(`   [HTML-v${v}] Pool pre-load skipped (no data)`);
      }

      await uploadToKV(kvKey, html, 'text/html', {
        path:    urlPath,
        source:  'index-cache',
        variant: v,
      });

      variantKeys.push(kvKey);
      console.log(`   [HTML-v${v}] OK → ${kvKey} (${Math.round(html.length / 1024)}KB)`);
    } catch (e) {
      console.error(`   [HTML-v${v}] ERROR: ${e.message}`);
    }
  }

  return variantKeys;
}

// ── Per-URL processor ─────────────────────────────────────────────────────────
async function processUrl(urlStr, index, total) {
  const urlPath = urlToPath(urlStr);

  if (!urlPath) {
    console.log(`[SKIP] [${index}/${total}] Cannot parse URL: ${urlStr}`);
    return { status: 'skip', urlStr };
  }

  if (!urlPath.startsWith('/listings/')) {
    console.log(`[SKIP] [${index}/${total}] Not a /listings/ path: ${urlPath}`);
    return { status: 'skip', urlStr };
  }

  // Priority paths are rendered by generate-priority-pages.js with slug names
  // (listings-home, homepage). Do not overwrite them with mismatched slugs.
  if (PRIORITY_PATHS.has(urlPath)) {
    console.log(`[SKIP] [${index}/${total}] Priority path (see generate-priority-pages.js): ${urlPath}`);
    return { status: 'skip', urlStr };
  }

  const slug = pathToSlug(urlPath);
  console.log(`\n[${index}/${total}] ${urlPath}  slug=${slug}`);

  // Generate HTML variants (JSON cache is handled by the WordPress plugin)
  const variantKeys = await generateHtmlVariants(urlPath, slug);

  return {
    status:      'done',
    urlStr,
    urlPath,
    slug,
    variantKeys: variantKeys || [],
  };
}

// ── Concurrency runner ────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runConcurrent(items, concurrency, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item, j) => fn(item, i + j + 1, items.length))
    );
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await delay(DELAY_BETWEEN_URLS);
    }
  }
  return results;
}

// ── Routes-mapping update ─────────────────────────────────────────────────────
async function updateRoutesMapping(done) {
  console.log('\n' + '='.repeat(70));
  console.log('UPDATING ROUTES MAPPING');
  console.log('='.repeat(70));

  let mapping = {};
  try {
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
    const res = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
    });
    if (res.ok) {
      mapping = JSON.parse(await res.text());
      console.log(`Loaded existing mapping: ${Object.keys(mapping).length} paths`);
    } else {
      console.log('No existing mapping — starting fresh');
    }
  } catch (e) {
    console.log(`Could not load existing mapping: ${e.message}`);
  }

  // Normalise any legacy string values → arrays
  for (const p in mapping) {
    if (typeof mapping[p] === 'string') mapping[p] = [mapping[p]];
  }

  let added = 0, updated = 0;
  for (const r of done) {
    if (!r.variantKeys || r.variantKeys.length === 0) continue;

    const sorted = [...r.variantKeys].sort((a, b) => {
      const na = parseInt(a.match(/-v(\d+)$/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/-v(\d+)$/)?.[1] || '0', 10);
      return na - nb;
    });

    if (!mapping[r.urlPath]) { added++;   }
    else                     { updated++; }
    mapping[r.urlPath] = sorted;
  }

  console.log(`Routes mapping: +${added} new, ~${updated} updated, ${Object.keys(mapping).length} total paths`);

  const mappingJson = JSON.stringify(mapping, null, 2);
  const sizeKB = Math.round(mappingJson.length / 1024);
  console.log(`Uploading mapping (${sizeKB} KB)...`);

  await uploadToKV('routes-mapping', mappingJson, 'application/json', { updatedAt: Date.now() });
  console.log('Routes mapping uploaded.');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.error('ERROR: CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, and CF_API_TOKEN are required.');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('INDEX CACHE GENERATOR  —  HTML (5 variants per URL)');
  console.log('JSON cache handled by WordPress plugin (cfs-json-cache-warmer)');
  console.log('='.repeat(70));
  console.log(`Vercel URL:      ${VERCEL_BASE_URL}`);
  console.log(`CSV path:        ${URLS_CSV}`);
  console.log(`HTML concurrency: ${HTML_CONCURRENCY} parallel URLs`);
  console.log(`HTML variants:   ${HTML_VARIANTS} per URL`);
  if (BATCH_SIZE && BATCH_NUMBER) {
    console.log(`Batch mode:      Batch ${BATCH_NUMBER}, Size ${BATCH_SIZE}`);
  }
  if (SKIP_ROUTES_UPDATE) {
    console.log('Routes update:   SKIPPED (parallel mode — regenerate-routes-mapping.js runs after)');
  }
  console.log('='.repeat(70));

  let allUrls = readUrlsFromCsv(URLS_CSV);
  console.log(`\nLoaded ${allUrls.length} URLs from CSV`);

  if (BATCH_SIZE && BATCH_NUMBER) {
    const start = (BATCH_NUMBER - 1) * BATCH_SIZE;
    const end   = start + BATCH_SIZE;
    console.log(`Batch ${BATCH_NUMBER}: URLs ${start + 1}–${Math.min(end, allUrls.length)} of ${allUrls.length}`);
    allUrls = allUrls.slice(start, end);
  }

  if (allUrls.length === 0) {
    console.log('No URLs in this batch. Exiting.');
    process.exit(0);
  }

  const estimatedMin = Math.round(allUrls.length * HTML_VARIANTS * 3 / HTML_CONCURRENCY / 60);
  console.log(`Processing ${allUrls.length} URLs (~${estimatedMin} min estimated)...\n`);

  const startTime = Date.now();
  const results   = await runConcurrent(allUrls, HTML_CONCURRENCY, processUrl);
  const elapsed   = Math.round((Date.now() - startTime) / 1000);

  const done     = results.filter(r => r.status === 'done');
  const skipped  = results.filter(r => r.status === 'skip');
  const htmlOk   = done.reduce((n, r) => n + r.variantKeys.length, 0);

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`URLs processed:   ${done.length}`);
  console.log(`URLs skipped:     ${skipped.length}`);
  console.log(`HTML KV entries:  ${htmlOk}`);
  console.log(`Duration:         ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
  console.log('='.repeat(70));

  const shouldUpdateMapping = !SKIP_ROUTES_UPDATE && (!BATCH_SIZE || !BATCH_NUMBER);
  if (shouldUpdateMapping) {
    await updateRoutesMapping(done);
  } else if (SKIP_ROUTES_UPDATE) {
    console.log('\nRoutes mapping update SKIPPED (parallel mode).');
    console.log('The update-routes-mapping job will rebuild from KV metadata.');
  } else {
    console.log('\nRoutes mapping update SKIPPED (batch mode).');
    console.log('Run regenerate-routes-mapping.js after all batches complete.');
  }

  console.log('\nDone!\n');
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
