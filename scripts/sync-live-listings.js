/* eslint-disable */
/**
 * sync-live-listings.js
 *
 * Writes cfs-paths/live-other-listings.json: the url.csv listing URLs that
 * attributes-others-sitemap.xml may list, i.e. the ones that are
 *   - NOT already covered by a typed WP sitemap (categories, states, regions,
 *     makes, models, atm, price, length, category-state, category-region — those
 *     come from WP already filtered to stock > 0), and
 *   - currently have at least one regular product.
 *
 * url.csv is a curated "may be indexed" allowlist, so it also holds URLs whose
 * stock has dropped to 0 (the middleware answers those with 410). Listing them
 * in a sitemap makes Ahrefs / Search Console report "4XX page in sitemap" /
 * "noindex page in sitemap". url.csv itself is NOT touched, so such a URL is
 * still indexable the moment stock returns — it just reappears here on the
 * next run.
 *
 * The product count is the same /pool check the middleware uses
 * (src/middleware.ts: buildApiParams + total_products / 410).
 *
 * Safety guards (nothing is written if any trips):
 *   - every typed WP sitemap must come back as valid JSON;
 *   - at most MAX_ERROR_RATIO of the /pool checks may fail;
 *   - the live count may not fall by more than MAX_DROP_RATIO vs. the existing
 *     snapshot in one run (override with FORCE=1).
 *
 * It also writes cfs-paths/live-category-links.json: the category+state and
 * category+region listing paths that currently have stock (straight from the WP
 * category-state / category-region sitemaps). The blog "Find <category> caravans by
 * location" blocks use it to hide links to empty (410) combinations.
 *
 * Usage: node scripts/sync-live-listings.js [--dry-run]
 * Env:   CFS_API_BASE, CFS_API_KEY (optional, X-Secret-Key), FORCE=1
 */

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname, "..");
const OUT_FILE = path.join(ROOT, "cfs-paths", "live-other-listings.json");
const INDEXABLE_FILE = path.join(ROOT, "cfs-paths", "indexable-urls.json");
const LINKS_FILE = path.join(ROOT, "cfs-paths", "live-category-links.json");
const API_BASE = (
  process.env.CFS_API_BASE ||
  process.env.NEXT_PUBLIC_CFS_API_BASE ||
  "https://admin.marketplacenetwork.com.au/wp-json/mpn/v1/caravans"
).replace(/\/$/, "");
const API_KEY = process.env.CFS_API_KEY || "";
const DRY = process.argv.includes("--dry-run");
const FORCE = process.env.FORCE === "1";
const CONCURRENCY = 6;
const MAX_ERROR_RATIO = 0.01;
const MAX_DROP_RATIO = 0.5;

// Keep in step with OTHER_LISTING_TYPES in src/utils/sitemap/indexableListings.ts
const TYPED = ["categories", "states", "regions", "makes", "models", "atm", "price", "length", "category-state", "category-region"];

const headers = { Accept: "application/json", ...(API_KEY && { "X-Secret-Key": API_KEY }) };
const toListingPath = (p) => "/listings/" + String(p).replace(/^\/?(listings\/)?/, "").replace(/\/+$/, "") + "/";

async function getJson(url) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (res.status === 410) return { status: 410, data: null };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const i = text.indexOf("{");
  try {
    return { status: res.status, data: JSON.parse(i >= 0 ? text.slice(i) : text) };
  } catch {
    throw new Error("not JSON (bot challenge?)");
  }
}

// Mirrors buildApiParams() in src/middleware.ts
function buildApiParams(f) {
  const p = new URLSearchParams();
  p.set("page", "1");
  const map = {
    category: "category", make: "make", model: "model", state: "state", region: "region",
    suburb: "suburb", pincode: "pincode", from_price: "from_price", to_price: "to_price",
    minKg: "from_atm", maxKg: "to_atm", from_length: "from_length", to_length: "to_length",
    sleeps: "sleep", from_sleep: "from_sleep", to_sleep: "to_sleep", from_year: "from_year", to_year: "to_year",
  };
  for (const [k, v] of Object.entries(map)) if (f[k]) p.set(v, String(f[k]));
  if (f.condition) p.set("condition", f.condition.toLowerCase().replace(/\s+/g, "-"));
  return p;
}

(async () => {
  const { parseSlugToFilters } = await import(
    pathToFileURL(path.join(ROOT, "src", "app", "components", "urlBuilder.ts")).href
  );

  // ── 1. typed WP sitemaps (must all succeed) ──────────────────────────
  const seen = new Set(["/listings/"]);
  const catLinks = new Set();
  for (const type of TYPED) {
    const { data } = await getJson(`${API_BASE}/sitemap/${type}`);
    if (!data || data.success !== true || !Array.isArray(data.paths)) throw new Error(`/sitemap/${type} returned an unexpected payload`);
    for (const p of data.paths) {
      seen.add(toListingPath(p));
      if (type === "category-state" || type === "category-region") catLinks.add(toListingPath(p));
    }
  }
  if (catLinks.size < 20) throw new Error(`only ${catLinks.size} category-state/region paths returned — refusing to write`);

  // ── 2. candidates = url.csv − typed lists ────────────────────────────
  const indexable = JSON.parse(fs.readFileSync(INDEXABLE_FILE, "utf8"));
  const candidates = indexable.filter((p) => !seen.has(p));
  console.log(`url.csv: ${indexable.length} | covered by typed sitemaps: ${indexable.length - candidates.length} | to check: ${candidates.length}`);

  // ── 3. live product count per candidate ──────────────────────────────
  const live = [];
  let errors = 0;
  let next = 0;
  async function check(p) {
    const slug = p.replace(/^\/listings\//, "").split("/").filter(Boolean);
    const url = `${API_BASE}/pool?${buildApiParams(parseSlugToFilters(slug, {})).toString()}`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { status, data } = await getJson(url);
        if (status === 410) return; // WP: 0 products
        // A 200 without any count fields is not "0 products" — treat as a failed check.
        if (!data || !(data.counts || data.pagination || data.featured_products || data.new_products || data.used_products)) {
          throw new Error("unexpected /pool payload");
        }
        const total =
          data?.counts?.total ??
          data?.pagination?.total_products ??
          (data?.featured_products?.length ?? 0) + (data?.new_products?.length ?? 0) + (data?.used_products?.length ?? 0);
        if (total > 0) live.push(p);
        return;
      } catch {
        if (attempt === 3) errors++;
        else await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (next < candidates.length) await check(candidates[next++]); }));
  live.sort();

  // ── 4. guards ────────────────────────────────────────────────────────
  if (candidates.length && errors / candidates.length > MAX_ERROR_RATIO) {
    throw new Error(`${errors} of ${candidates.length} /pool checks failed (> ${MAX_ERROR_RATIO * 100}%) — refusing to write`);
  }
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch {}
  if (prev.length && live.length < prev.length * (1 - MAX_DROP_RATIO) && !FORCE) {
    throw new Error(`live count would fall ${prev.length} → ${live.length} (> ${MAX_DROP_RATIO * 100}%) — set FORCE=1 to override`);
  }

  // live-category-links.json (always refreshed when it changed)
  const links = [...catLinks].sort();
  let prevLinks = [];
  try { prevLinks = JSON.parse(fs.readFileSync(LINKS_FILE, "utf8")); } catch {}
  const linksChanged = JSON.stringify(links) !== JSON.stringify(prevLinks);
  console.log(`category links with stock: ${links.length} (${linksChanged ? "changed" : "unchanged"})`);
  if (linksChanged && !DRY) fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2) + "\n");

  const prevSet = new Set(prev), liveSet = new Set(live);
  const added = live.filter((p) => !prevSet.has(p)), removed = prev.filter((p) => !liveSet.has(p));
  console.log(`live (stock > 0): ${live.length} | empty (kept out of sitemap): ${candidates.length - live.length - errors} | errors: ${errors}`);
  console.log(`vs previous snapshot: +${added.length} / -${removed.length}`);
  if (DRY) return console.log("(dry-run — nothing written)");
  if (!added.length && !removed.length && prev.length) return console.log("Already in sync.");

  fs.writeFileSync(OUT_FILE, JSON.stringify(live, null, 2) + "\n");
  console.log(`Wrote ${live.length} paths to ${path.relative(ROOT, OUT_FILE)}`);
})().catch((e) => {
  console.error("❌ sync-live-listings failed:", e.message);
  process.exit(1);
});
