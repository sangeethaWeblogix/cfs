/* eslint-disable */
/**
 * Affected-Only HTML Cache Generator
 *
 * Companion to generate-index-cache.js, but instead of reading every URL from
 * src/app/url.csv (3,462 URLs, full daily rebuild), this takes a SMALL list of
 * URLs that WordPress (cfs-selective-cache-invalidator.php) determined were
 * actually affected by a product add/edit/delete — usually a few dozen to a
 * few hundred pages, not the whole site.
 *
 * Triggered by: .github/workflows/generate-affected-cache.yml, via a
 * repository_dispatch event with client_payload.urls = [...full URLs...].
 *
 * JSON KV cache for these URLs is already refreshed synchronously in PHP by
 * the WordPress plugin (no HTTP round-trip needed there) — this script only
 * handles the pre-rendered HTML KV variants, and merges just these paths into
 * routes-mapping rather than rebuilding the whole mapping from scratch.
 *
 * Usage:
 *   AFFECTED_URLS_JSON='["https://.../listings/victoria-state/"]' node scripts/generate-affected-html-cache.js
 *   AFFECTED_URLS_FILE=/tmp/affected.json node scripts/generate-affected-html-cache.js
 *
 * NOTE ON BATCH SIZE: WordPress now queues affected URLs throughout the day
 * and dispatches them once a night (see cfs-selective-cache-invalidator.php's
 * cfs_sci_run_nightly_dispatch()) instead of firing this per product change.
 * That means a single run here can cover a whole day's worth of pages rather
 * than a handful — HTML_CONCURRENCY and the routes-mapping merge strategy
 * below were both adjusted for that: higher concurrency to get through a
 * bigger list, and an incremental (per-batch) merge so that if the job still
 * times out, everything processed before the cutoff is already saved instead
 * of being lost when the final merge never runs.
 */

const fs = require('fs');

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
const VERCEL_BASE_URL = process.env.VERCEL_BASE_URL || 'https://caravansforsale-main-live.vercel.app';
const CF_ACCOUNT_ID      = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN       = process.env.CF_API_TOKEN;
const SITE_BASE          = 'https://www.caravansforsale.com.au';

const HTML_VARIANTS      = 7;
const HTML_CONCURRENCY   = 6;
const HTML_FETCH_TIMEOUT = 30000;
const KV_UPLOAD_RETRIES  = 3;
const KV_RETRY_DELAY     = 2000;
const HTML_SKIP_IMMEDIATELY = new Set([404, 410, 500, 502, 503]);
const PRIORITY_PATHS = new Set(['/', '/listings/']); // handled by generate-priority-pages.js instead

// ── Load affected URLs (from env JSON string or a file) ───────────────────────
function loadAffectedUrls() {
  let raw = process.env.AFFECTED_URLS_JSON;
  if (!raw && process.env.AFFECTED_URLS_FILE) {
    raw = fs.readFileSync(process.env.AFFECTED_URLS_FILE, 'utf8');
  }
  if (!raw) {
    console.error('ERROR: Provide AFFECTED_URLS_JSON or AFFECTED_URLS_FILE (JSON array of full URLs).');
    process.exit(1);
  }
  raw = raw.trim();
  // Accept either a JSON array  ["https://..."]
  // or a plain URL              https://...
  // or a newline-separated list https://...\nhttps://...
  let list;
  if (raw.startsWith('[')) {
    list = JSON.parse(raw);
  } else {
    // Split on newlines/commas, strip surrounding quotes, filter blanks
    list = raw.split(/[\n,]+/).map(u => u.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  if (!Array.isArray(list) || list.length === 0) {
    console.error('ERROR: Could not parse any URLs from AFFECTED_URLS_JSON.');
    process.exit(1);
  }
  return list;
}

// ── Path utilities (must match generate-index-cache.js exactly) ───────────────
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

function pathToSlug(p) {
  let s = p;
  if (s.startsWith('/listings/')) s = s.substring(10);
  s = s.replace(/^\/+|\/+$/g, '');
  s = s.replace(/\//g, '-');
  s = s.replace(/[^a-z0-9-]/g, '');
  if (s.length > 150) s = s.substring(0, 150);
  return s || 'home';
}

// ── Pool data pre-loading ─────────────────────────────────────────────────────
/**
 * Parse a /listings/… path into pool-listings API query params.
 * Mirrors the parameter order of buildApiUrl() in src/app/listings/urlUtils.ts
 * AND the slug parsing logic of parseSlugToFilters() in src/app/components/urlBuilder.ts
 * so the injected URL matches what home.tsx constructs at runtime.
 */
function buildPoolRequestUrl(urlPath, seed) {
  let s = urlPath;
  if (s.startsWith('/listings/')) s = s.substring(10);
  s = s.replace(/^\/+|\/+$/g, '');
  const segments = s.split('/').filter(Boolean);

  // Parse all segment types — must mirror urlBuilder.ts parseSlugToFilters()
  let category, condition, state, region, suburb, pincode;
  let fromPrice, toPrice, minKg, maxKg, fromLength, toLength;
  let fromSleep, toSleep, fromYear, toYear, make, model;

  const hasReservedSuffix = (seg) =>
    /-(category|condition|state|region|suburb)$/.test(seg) ||
    /-(kg-atm|length-in-feet|people-sleeping-capacity)$/.test(seg) ||
    /^over-\d+/.test(seg) || /^under-\d+/.test(seg) || /^between-/.test(seg) ||
    /^\d{4}$/.test(seg) || seg.includes('-caravans-range');

  for (const seg of segments) {
    if (seg.endsWith('-category')) {
      category = seg.replace('-category', '');
    } else if (seg.endsWith('-condition')) {
      const raw = seg.replace('-condition', '').toLowerCase();
      condition = raw === 'new' ? 'New' : raw === 'used' ? 'Used' : raw;
    } else if (seg.endsWith('-state')) {
      state = seg.replace('-state', '').replace(/-/g, ' ').toLowerCase();
    } else if (seg.endsWith('-region')) {
      region = seg.replace('-region', '').replace(/-/g, ' ').toLowerCase();
    } else if (/^([a-z0-9-]+)-(\d{4})-suburb$/.test(seg)) {
      const m = seg.match(/^([a-z0-9-]+)-(\d{4})-suburb$/);
      suburb = m[1].replace(/-/g, ' ').toLowerCase();
      pincode = m[2];
    } else if (seg.endsWith('-suburb')) {
      suburb = seg.replace(/-suburb$/, '').replace(/-/g, ' ').toLowerCase();
    } else if (/^\d{4}$/.test(seg)) {
      pincode = seg;
    } else if (seg.includes('-kg-atm')) {
      const between = seg.match(/^between-(\d+)-kg-(\d+)-kg-atm$/);
      if (between) { minKg = between[1]; maxKg = between[2]; }
      else {
        const over = seg.match(/^over-(\d+)-kg-atm$/);
        if (over) minKg = over[1];
        else { const under = seg.match(/^under-(\d+)-kg-atm$/); if (under) maxKg = under[1]; }
      }
    } else if (seg.includes('length-in-feet')) {
      const between = seg.match(/^between-(\d+)-(\d+)-length-in-feet$/);
      if (between) { fromLength = between[1]; toLength = between[2]; }
      else {
        const over = seg.match(/^over-(\d+)-length-in-feet$/);
        if (over) fromLength = over[1];
        else { const under = seg.match(/^under-(\d+)-length-in-feet$/); if (under) toLength = under[1]; }
      }
    } else if (seg.includes('-people-sleeping-capacity')) {
      const between = seg.match(/^between-(\d+)-(\d+)-people-sleeping-capacity$/);
      if (between) { fromSleep = between[1]; toSleep = between[2]; }
      else {
        const over = seg.match(/^over-(\d+)-people-sleeping-capacity$/);
        if (over) fromSleep = over[1];
        else {
          const under = seg.match(/^under-(\d+)-people-sleeping-capacity$/);
          if (under) toSleep = under[1];
          else {
            const single = seg.match(/^(\d+)-people-sleeping-capacity$/);
            if (single) { fromSleep = single[1]; toSleep = single[1]; }
          }
        }
      }
    } else if (/^over-\d+$/.test(seg)) {
      fromPrice = seg.replace('over-', '');
    } else if (/^under-\d+$/.test(seg)) {
      toPrice = seg.replace('under-', '');
    } else if (/^between-\d+-\d+$/.test(seg)) {
      const m = seg.match(/between-(\d+)-(\d+)/);
      if (m) { fromPrice = m[1]; toPrice = m[2]; }
    } else if (seg.includes('-caravans-range')) {
      const both = seg.match(/^(\d{4})-(\d{4})-caravans-range$/);
      if (both) { fromYear = both[1]; toYear = both[2]; }
      else {
        const from = seg.match(/^year-from-(\d{4})-caravans-range$/);
        if (from) fromYear = from[1];
        else { const to = seg.match(/^year-to-(\d{4})-caravans-range$/); if (to) toYear = to[1]; }
      }
    } else if (!hasReservedSuffix(seg) && isNaN(Number(seg))) {
      // make / model fallback (same as urlBuilder.ts)
      if (!make) make = seg;
      else if (!model) model = seg;
    }
  }

  // Build params in same order as buildApiUrl() so the string matches exactly
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
  if (minKg)      params.set('from_atm',          minKg);
  if (maxKg)      params.set('to_atm',            maxKg);
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
 * Check whether a /listings/ path is in url.csv's curated indexed set by
 * calling the Vercel /api/indexed-url/ endpoint. Returns true/false, or null
 * on any error (caller will omit is_indexed from the preload and let the
 * client-side async check handle it as before).
 */
async function fetchIsIndexed(urlPath) {
  const fetchUrl = `${VERCEL_BASE_URL}/api/indexed-url/?path=${encodeURIComponent(urlPath)}`;
  try {
    const res = await fetchWithTimeout(fetchUrl, {
      headers: { 'User-Agent': 'CFS-AffectedCacheGenerator/1.0', 'Accept': 'application/json' },
    }, 10000);
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json?.indexed === 'boolean' ? json.indexed : null;
  } catch {
    return null;
  }
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
      headers: { 'User-Agent': 'CFS-AffectedCacheGenerator/1.0', 'Accept': 'application/json' },
    }, 15000);
    if (!res.ok) return null;
    const json = await res.json();
    const products = json?.data?.products ?? json?.products ?? [];
    if (!products.length) return null;
    return { url: requestUrl, json };
  } catch {
    return null;
  }
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

// ── Image optimisation injection (must match generate-index-cache.js) ─────────
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

// ── KV upload (multipart with metadata) — identical format to the daily job ───
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
async function generateHtmlVariants(urlPath, slug) {
  const variantKeys = [];

  // Fetch isIndexed once per URL (same for all variants) so home.tsx can
  // initialise isIndexed state correctly from the preload, avoiding the
  // secondary pool re-fetch that occurs when the client-side async check
  // returns a different value than the default (true).
  const isIndexed = await fetchIsIndexed(urlPath);
  if (isIndexed !== null) {
    console.log(`   [isIndexed] ${urlPath} -> ${isIndexed}`);
  }

  for (let v = 1; v <= HTML_VARIANTS; v++) {
    const fetchUrl = `${VERCEL_BASE_URL}${urlPath}?shuffle_seed=${v}`;
    const kvKey    = `${slug}-v${v}`;

    try {
      const res = await fetchWithTimeout(fetchUrl, {
        headers: { 'User-Agent': 'CFS-AffectedCacheGenerator/1.0', 'Accept': 'text/html' },
      }, HTML_FETCH_TIMEOUT);

      if (HTML_SKIP_IMMEDIATELY.has(res.status)) {
        console.log(`   [HTML-v${v}] Skip HTTP ${res.status}`);
        if (res.status === 404) break;
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
        // Embed is_indexed so home.tsx can initialise isIndexed state correctly
        // on hydration, preventing the secondary pool re-fetch that fires when
        // the async /api/indexed-url/ check returns a different value.
        if (isIndexed !== null) poolData.is_indexed = isIndexed;
        const poolJson = JSON.stringify(poolData).replace(/<\/script>/gi, '<\\/script>');
        html = html.replace('</head>', `<script>window.__INITIAL_POOL__ = ${poolJson};</script>\n</head>`);
        const _regularCount   = (poolData.json?.data?.products ?? poolData.json?.products ?? []).length;
        const _exclusiveCount = (poolData.json?.data?.exclusive_products ?? poolData.json?.exclusive_products ?? []).length;
        const _premiumCount   = (poolData.json?.data?.premium_products ?? poolData.json?.premium_products ?? []).length;
        console.log(`   [HTML-v${v}] Pool pre-loaded (${_regularCount} regular + ${_exclusiveCount} exclusive + ${_premiumCount} premium = ${_regularCount + _exclusiveCount + _premiumCount} total products)`);
      } else {
        console.log(`   [HTML-v${v}] Pool pre-load skipped (no data)`);
      }

      await uploadToKV(kvKey, html, 'text/html', {
        path:    urlPath,
        source:  'affected-cache',
        variant: v,
      });

      variantKeys.push(kvKey);
      console.log(`   [HTML-v${v}] OK -> ${kvKey} (${Math.round(html.length / 1024)}KB)`);
    } catch (e) {
      console.error(`   [HTML-v${v}] ERROR: ${e.message}`);
    }
  }

  return variantKeys;
}

async function processUrl(urlStr, index, total) {
  let normalized = urlStr.startsWith('http') ? urlStr : `${SITE_BASE}${urlStr}`;
  const urlPath = urlToPath(normalized);

  if (!urlPath || !urlPath.startsWith('/listings/')) {
    console.log(`[SKIP] [${index}/${total}] Not a /listings/ path: ${urlStr}`);
    return { status: 'skip', urlStr };
  }

  if (PRIORITY_PATHS.has(urlPath)) {
    console.log(`[SKIP] [${index}/${total}] Priority path (handled separately): ${urlPath}`);
    return { status: 'skip', urlStr };
  }

  const slug = pathToSlug(urlPath);
  console.log(`\n[${index}/${total}] ${urlPath}  slug=${slug}`);

  const variantKeys = await generateHtmlVariants(urlPath, slug);

  return { status: 'done', urlStr, urlPath, slug, variantKeys: variantKeys || [] };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runConcurrent(items, concurrency, fn, onBatchDone) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((item, j) => fn(item, i + j + 1, items.length)));
    results.push(...batchResults);
    if (onBatchDone) {
      try {
        await onBatchDone(batchResults, i + batch.length, items.length);
      } catch (e) {
        // A checkpoint failure shouldn't abort the whole run — the next
        // checkpoint (or the loop simply continuing) will pick up any pages
        // this one missed.
        console.error(`   [checkpoint] ERROR: ${e.message}`);
      }
    }
  }
  return results;
}

// ── Routes-mapping: MERGE only the affected paths, never a full rebuild ───────
async function mergeRoutesMapping(done) {
  console.log('\n' + '='.repeat(70));
  console.log('MERGING AFFECTED PATHS INTO ROUTES MAPPING');
  console.log('='.repeat(70));

  let mapping = {};
  try {
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
    const res = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` } });
    if (res.ok) {
      mapping = JSON.parse(await res.text());
      console.log(`Loaded existing mapping: ${Object.keys(mapping).length} paths`);
    }
  } catch (e) {
    console.log(`Could not load existing mapping: ${e.message}`);
  }

  for (const p in mapping) {
    if (typeof mapping[p] === 'string') mapping[p] = [mapping[p]];
  }

  let updated = 0;
  for (const r of done) {
    if (!r.variantKeys || r.variantKeys.length === 0) continue;
    const sorted = [...r.variantKeys].sort((a, b) => {
      const na = parseInt(a.match(/-v(\d+)$/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/-v(\d+)$/)?.[1] || '0', 10);
      return na - nb;
    });
    mapping[r.urlPath] = sorted;
    updated++;
  }

  if (updated === 0) {
    console.log('No successful paths to merge — leaving routes-mapping untouched.');
    return;
  }

  const mappingJson = JSON.stringify(mapping, null, 2);
  console.log(`Uploading merged mapping (${updated} paths touched, ${Object.keys(mapping).length} total)...`);
  await uploadToKV('routes-mapping', mappingJson, 'application/json', { updatedAt: Date.now() });
  console.log('Routes mapping updated.');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.error('ERROR: CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, and CF_API_TOKEN are required.');
    process.exit(1);
  }

  const urls = loadAffectedUrls();
  console.log('\n' + '='.repeat(70));
  console.log(`AFFECTED-ONLY HTML CACHE GENERATOR — ${urls.length} URL(s)`);
  console.log('='.repeat(70));

  if (urls.length === 0) {
    console.log('No affected URLs — nothing to do.');
    process.exit(0);
  }

  const startTime = Date.now();

  // Merge routes-mapping after every concurrency batch (not just once at the
  // very end) — see the NOTE ON BATCH SIZE at the top of this file. If the
  // job gets cancelled/times out partway through a large nightly batch, every
  // page successfully cached before the cutoff is already reflected in
  // routes-mapping instead of being silently dropped.
  const results = await runConcurrent(urls, HTML_CONCURRENCY, processUrl, async (batchResults) => {
    const doneInBatch = batchResults.filter(r => r.status === 'done' && r.variantKeys && r.variantKeys.length > 0);
    if (doneInBatch.length > 0) {
      await mergeRoutesMapping(doneInBatch);
    }
  });
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  const done = results.filter(r => r.status === 'done');
  const htmlOk = done.reduce((n, r) => n + r.variantKeys.length, 0);

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`URLs processed:  ${done.length}/${urls.length}`);
  console.log(`HTML KV entries: ${htmlOk}`);
  console.log(`Duration:        ${elapsed}s`);
  console.log('(routes-mapping already merged incrementally per batch above)');
  console.log('\nDone!\n');
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
