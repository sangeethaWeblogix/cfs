/**
 * Regenerates cfs-paths/indexable-urls.json from src/app/url.csv.
 *
 * Why this exists: url.csv is the curated list of pages the WP admin JSON/HTML
 * cache warmer treats as "indexed" (see src/utils/seo/indexable-urls.ts, which
 * reads url.csv directly via fs at import time — that only works in server-side
 * code, since fs isn't available in the browser bundle).
 *
 * The client (Listings.tsx) also needs to know whether the current page is
 * indexed, so it can tell the Cloudflare Worker whether a given /api/listings
 * request is eligible for KV caching (see the `indexed` request param). Since
 * client-side filter changes often update the URL via window.history.pushState
 * without a full Next.js server round-trip, the client can't rely on a prop
 * computed once at SSR time — it needs to recompute indexability itself, live,
 * from the same curated list. That requires a client-safe (fs-free) copy of
 * the same data, which is what this script produces.
 *
 * Run this any time url.csv changes:
 *   node scripts/generate-indexable-urls-json.js
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src/app/url.csv");
const outPath = path.join(process.cwd(), "cfs-paths/indexable-urls.json");
const BASE = "https://www.caravansforsale.com.au";

const content = fs.readFileSync(filePath, "utf-8");
const set = new Set();

for (const line of content.split(/\r?\n/).slice(1)) {
  const url = line.split("\t")[1]?.trim();
  if (!url) continue;
  let p = url.startsWith(BASE) ? url.slice(BASE.length) : url;
  if (!p.endsWith("/")) p += "/";
  set.add(p);
}

const arr = Array.from(set).sort();
fs.writeFileSync(outPath, JSON.stringify(arr, null, 0));
console.log(`Wrote ${arr.length} indexable paths to ${outPath}`);
