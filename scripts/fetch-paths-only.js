/* eslint-disable */
/**
 * fetch-paths-only.js
 *
 * Fetches all paths for a single sitemap type and saves them to
 * /tmp/paths-{type}.json.
 *
 * Strategy (bot-protection bypass):
 *   1. Try the static JSON file at WP_STATIC_BASE/{type}.json first.
 *      These are plain files served by the web server — no /wp-json/ routing,
 *      no bot-protection challenge.
 *   2. Fall back to the WordPress REST API if the static file is unavailable
 *      or WP_STATIC_BASE is not set.
 *
 * Used as the first step in a two-phase cache generation workflow:
 *   1. This script runs ONCE — one IP, one request, no bot-protection triggers.
 *   2. Batch jobs download the saved artifact and skip the API entirely.
 *
 * Usage:
 *   TARGET_SITEMAP=region-make WP_API_KEY=xxx node scripts/fetch-paths-only.js
 *
 * Output file format:
 *   { "type": "region-make", "count": 1154, "paths": [...url objects...] }
 */

const fetch = require('node-fetch');
const fs    = require('fs');
const path  = require('path');

const WP_API_BASE       = process.env.WP_API_BASE       || 'https://admin.caravansforsale.com.au/wp-json/cfs/v1/sitemap';
const WP_STATIC_BASE    = process.env.WP_STATIC_BASE    || '';  // e.g. https://admin.caravansforsale.com.au/wp-content/uploads/cfs-paths
const WP_API_KEY        = process.env.WP_API_KEY        || '';
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const TARGET_SITEMAP    = process.env.TARGET_SITEMAP;
const OUTPUT_DIR        = process.env.PATHS_OUTPUT_DIR  || '/tmp';

if (!TARGET_SITEMAP) {
  console.error('❌ TARGET_SITEMAP env var is required');
  process.exit(1);
}

/**
 * Try fetching from a URL and return { text, url } on success, or null on any failure.
 * Does NOT throw — returns null instead so the caller can fall back.
 */
async function tryFetch(url, headers, timeoutMs) {
  try {
    const response = await fetch(url, { headers, timeout: timeoutMs });
    if (!response.ok) return null;
    const text = await response.text();
    return { text, url: response.url };
  } catch (e) {
    return null;
  }
}

async function fetchAndSave(type) {
  const staticUrl  = WP_STATIC_BASE ? `${WP_STATIC_BASE.replace(/\/$/, '')}/${type}.json` : null;
  const apiUrl     = `${WP_API_BASE}/${type}`;
  const outputFile = path.join(OUTPUT_DIR, `paths-${type}.json`);

  let responseText = null;

  // ── 0. Try local repo file (committed by WordPress via GitHub API) ─────────
  // When WordPress regenerates paths it pushes cfs-paths/{type}.json to this
  // repo. After checkout the file is already on disk — no HTTP needed at all,
  // completely bypassing any server-side bot protection.
  const localFile = path.join(process.cwd(), 'cfs-paths', `${type}.json`);
  if (fs.existsSync(localFile)) {
    const localText = fs.readFileSync(localFile, 'utf8');
    const trimmed = localText.trimStart();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      responseText = localText;
      console.log(`✅ Local repo file used: cfs-paths/${type}.json`);
    } else {
      console.log(`⚠️ Local repo file exists but isn't JSON — skipping`);
    }
  }

  // ── 1. Try static file (no bot-protection) ────────────────────────────────
  if (staticUrl) {
    console.log(`📥 Trying static file: ${staticUrl}`);
    const result = await tryFetch(
      staticUrl,
      { 'User-Agent': 'CFS-CacheGenerator/3.0', 'Accept': 'application/json, text/plain, */*' },
      15000
    );
    if (result) {
      // Verify it looks like JSON before accepting
      const trimmed = result.text.trimStart();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        responseText = result.text;
        console.log(`✅ Static file fetched OK`);
      } else {
        console.log(`⚠️ Static file returned non-JSON — falling back to REST API`);
      }
    } else {
      console.log(`⚠️ Static file not available — falling back to REST API`);
    }
  }

  // ── 2. Fall back to REST API ───────────────────────────────────────────────
  if (!responseText) {
    console.log(`📥 Fetching from REST API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'CFS-CacheGenerator/3.0',
        'Accept':     'application/json',
        ...(WP_API_KEY && { 'X-API-Key': WP_API_KEY })
      },
      timeout: 30000
    });

    responseText = await response.text();

    if (!response.ok) {
      const preview = responseText.slice(0, 200).replace(/\s+/g, ' ');
      throw new Error(`HTTP ${response.status}: ${response.statusText} — body: ${preview}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const preview = responseText.slice(0, 200).replace(/\s+/g, ' ');
      throw new Error(`Expected JSON but got "${contentType}" (bot protection?). Final URL: ${response.url} — body: ${preview}`);
    }
  }

  // ── 3. Parse ───────────────────────────────────────────────────────────────
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    const preview = responseText.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`JSON parse failed: ${e.message} — body: ${preview}`);
  }

  if (!data.success) {
    throw new Error(`API returned success=false for type "${type}"`);
  }

  const rawPaths = Array.isArray(data.paths) ? data.paths : [];

  // Convert raw API paths → full URL objects (same logic as generate-sitemap-cache-simple.js)
  const urls = rawPaths.map(rawPath => {
    let cleanPath = rawPath.replace(/^\/+/, '');
    if (!cleanPath.endsWith('/')) cleanPath += '/';
    const urlPath = `/listings/${cleanPath}`;
    return {
      path:       urlPath,
      fullUrl:    `${PRODUCTION_DOMAIN}${urlPath}`,
      sourceType: type
    };
  });

  const output = { type, count: urls.length, paths: urls };
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`✅ Saved ${urls.length} paths → ${outputFile}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `path_count=${urls.length}\n`);
  }
}

fetchAndSave(TARGET_SITEMAP).catch(err => {
  console.error(`❌ fetch-paths-only failed: ${err.message}`);
  process.exit(1);
});
