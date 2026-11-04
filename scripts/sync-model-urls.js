/* eslint-disable */
/**
 * sync-model-urls.js
 *
 * Keeps the model landing pages (/listings/<make>/<model>/) in
 * src/app/url.csv in sync with the live stock:
 *
 *   - a model that has at least one regular product (WP /sitemap/models,
 *     min_count=1 — exclusive-only models are not included) is ADDED to
 *     url.csv if it is not already there;
 *   - a model row in url.csv that is no longer in that list (0 products left)
 *     is REMOVED.
 *
 * Only "model rows" are ever touched — /listings/<make>/<model>/ where <make>
 * is a known make and <model> parses as a plain model slug (not a state /
 * condition / price / ... filter). Every other url.csv row, and every
 * existing ID, is left exactly as it is; new rows get max(ID)+1, +2, ...
 *
 * It also appends any make that WP lists but cfs-paths/makes.json does not
 * (additive only), because the middleware 410s a make that is not in that
 * snapshot, so a brand-new make's models would otherwise be unreachable.
 *
 * After writing url.csv it regenerates cfs-paths/indexable-urls.json.
 *
 * It also maintains cfs-paths/model-redirects.json: when WP regroups models (e.g. the
 * variant "rapid-15d" is folded into the series model "rapid") the old variant URL
 * would otherwise just 410. Every removed model row whose slug starts (at a "-"
 * boundary) with a live model of the same make is mapped old → parent, and the
 * middleware 301s it (src/middleware.ts) while it is not in url.csv. An entry is
 * dropped as soon as its source has stock again or its target no longer does.
 *
 * Safety guards:
 *   - the API answer must be a valid JSON { success, paths[] } (no bot
 *     challenge page, no HTTP error) and at least MIN_MODELS models must come
 *     back — otherwise nothing is written;
 *   - if more than MAX_REMOVE_RATIO of the existing model rows would be removed
 *     in one run, the removals (and redirects) are SKIPPED — the additions are
 *     still applied, so new models keep getting indexed — unless FORCE=1.
 *
 * Usage:
 *   node scripts/sync-model-urls.js            # apply
 *   node scripts/sync-model-urls.js --dry-run  # report only
 *
 * Env: CFS_API_BASE (default: the WP mpn/v1/caravans API), CFS_API_KEY
 * (optional — sent as X-Secret-Key when set), FORCE=1.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname, "..");
const CSV_FILE = path.join(ROOT, "src", "app", "url.csv");
const MAKES_FILE = path.join(ROOT, "cfs-paths", "makes.json");
const REDIRECTS_FILE = path.join(ROOT, "cfs-paths", "model-redirects.json");
const BASE = "https://www.caravansforsale.com.au";
const API_BASE = (
  process.env.CFS_API_BASE ||
  process.env.NEXT_PUBLIC_CFS_API_BASE ||
  "https://admin.marketplacenetwork.com.au/wp-json/mpn/v1/caravans"
).replace(/\/$/, "");
const API_KEY = process.env.CFS_API_KEY || "";
const DRY = process.argv.includes("--dry-run");
const FORCE = process.env.FORCE === "1";
const MIN_MODELS = 500;
const MAX_REMOVE_RATIO = 0.25;

async function fetchPaths(type) {
  const res = await fetch(`${API_BASE}/sitemap/${type}`, {
    headers: { Accept: "application/json", ...(API_KEY && { "X-Secret-Key": API_KEY }) },
  });
  if (!res.ok) throw new Error(`/sitemap/${type} → HTTP ${res.status}`);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text.slice(text.indexOf("{")));
  } catch {
    throw new Error(`/sitemap/${type} did not return JSON (bot challenge?): ${text.slice(0, 80)}`);
  }
  if (!data || data.success !== true || !Array.isArray(data.paths)) {
    throw new Error(`/sitemap/${type} returned an unexpected payload`);
  }
  return data.paths;
}

const clean = (p) => String(p).replace(/^\/?(listings\/)?/, "").replace(/\/+$/, "");

(async () => {
  // Same parser the site uses, so "is this a model slug?" never drifts.
  const { parseSlugToFilters } = await import(
    pathToFileURL(path.join(ROOT, "src", "app", "components", "urlBuilder.ts")).href
  );
  const isPlainModel = (make, model) => {
    const f = parseSlugToFilters([make, model]);
    const keys = Object.keys(f).sort().join();
    return keys === "make,model" && f.make === make && f.model === model;
  };

  // ── 1. fetch & validate ──────────────────────────────────────────────
  const [modelPaths, makePaths] = await Promise.all([fetchPaths("models"), fetchPaths("makes")]);
  if (modelPaths.length < MIN_MODELS) {
    throw new Error(`only ${modelPaths.length} models returned (< ${MIN_MODELS}) — refusing to sync`);
  }

  // ── 2. makes.json (additive) ─────────────────────────────────────────
  const makesJson = JSON.parse(fs.readFileSync(MAKES_FILE, "utf8"));
  const knownMakes = new Set(makesJson.paths.map(clean));
  const newMakes = [...new Set(makePaths.map(clean))].filter((m) => m && !knownMakes.has(m)).sort();

  const validMakes = new Set([...knownMakes, ...newMakes]);

  // ── 3. desired model rows ────────────────────────────────────────────
  const desired = new Set();
  const skipped = [];
  for (const p of modelPaths) {
    const seg = clean(p).split("/");
    if (seg.length !== 2 || !seg[0] || !seg[1] || !validMakes.has(seg[0]) || !isPlainModel(seg[0], seg[1])) {
      skipped.push(p);
      continue;
    }
    desired.add(`/listings/${seg[0]}/${seg[1]}/`);
  }

  // ── 4. diff against url.csv ──────────────────────────────────────────
  const raw = fs.readFileSync(CSV_FILE, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);
  const header = lines[0];
  const rows = lines.slice(1).filter((l) => l.trim() !== "").map((l) => {
    const [id, url] = l.split("\t");
    const p = url.replace(/^https?:\/\/[^/]+/, "");
    return { id: Number(id), url, path: p.endsWith("/") ? p : p + "/" };
  });
  const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);

  const isModelRow = (r) => {
    const seg = r.path.split("/").filter(Boolean);
    return seg.length === 3 && seg[0] === "listings" && validMakes.has(seg[1]) && isPlainModel(seg[1], seg[2]);
  };
  const modelRows = rows.filter(isModelRow);
  const have = new Set(rows.map((r) => r.path));

  const wantRemove = modelRows.filter((r) => !desired.has(r.path));
  const toAdd = [...desired].filter((p) => !have.has(p)).sort();

  // A mass removal is more likely a bad API answer than real — hold the removals back, but
  // keep adding (removing only matters for tidiness: a model without stock 410s anyway).
  const holdBack = modelRows.length > 0 && wantRemove.length / modelRows.length > MAX_REMOVE_RATIO && !FORCE;
  const toRemove = holdBack ? [] : wantRemove;
  if (holdBack) {
    const msg = `would remove ${wantRemove.length} of ${modelRows.length} model rows (> ${MAX_REMOVE_RATIO * 100}%) — removals skipped, set FORCE=1 to apply them`;
    console.log(`::warning::${msg}`);
  }

  // ── 4b. old model URL → parent model redirects ─────────────────────────
  let redirects = {};
  try { redirects = JSON.parse(fs.readFileSync(REDIRECTS_FILE, "utf8")); } catch {}
  const nextRedirects = {};
  for (const [from, to] of Object.entries(redirects)) {
    if (!desired.has(from) && desired.has(to)) nextRedirects[from] = to; // still dead, target still live
  }
  const parentOf = (p) => {
    const [, , make, model] = p.split("/"); // "/listings/<make>/<model>/"
    const parts = model.split("-");
    for (let n = parts.length - 1; n >= 1; n--) {
      const head = parts.slice(0, n).join("-");
      if (head.length >= 3 && desired.has(`/listings/${make}/${head}/`)) return `/listings/${make}/${head}/`;
    }
    return null;
  };
  for (const r of toRemove) {
    const parent = parentOf(r.path);
    if (parent) nextRedirects[r.path] = parent;
  }
  const sortedRedirects = Object.fromEntries(Object.entries(nextRedirects).sort(([a], [b]) => (a < b ? -1 : 1)));
  const redirectsChanged = JSON.stringify(sortedRedirects) !== JSON.stringify(redirects);

  console.log(`WP models: ${modelPaths.length} | usable: ${desired.size} | skipped: ${skipped.length}`);
  console.log(`url.csv rows: ${rows.length} (model rows: ${modelRows.length})`);
  console.log(`+ add ${toAdd.length} | - remove ${toRemove.length} | new makes for makes.json: ${newMakes.length}`);
  console.log(`redirects (old model → parent): ${Object.keys(sortedRedirects).length}${redirectsChanged ? " (changed)" : ""}`);
  if (skipped.length) console.log("  skipped samples:", skipped.slice(0, 5).join(", "));
  if (newMakes.length) console.log("  new makes:", newMakes.join(", "));
  toRemove.slice(0, 10).forEach((r) => console.log("  - " + r.path));
  toAdd.slice(0, 10).forEach((p) => console.log("  + " + p));

  if (DRY) return console.log("(dry-run — nothing written)");
  if (!toAdd.length && !toRemove.length && !newMakes.length && !redirectsChanged) return console.log("Already in sync.");

  // ── 5. write ─────────────────────────────────────────────────────────
  if (newMakes.length) {
    makesJson.paths = [...makesJson.paths, ...newMakes.map((m) => `${m}/`)];
    makesJson.count = makesJson.paths.length;
    makesJson.generated_at = new Date().toISOString().slice(0, 19).replace("T", " ");
    // Keep the file's existing layout: 4-space indent, CRLF, no final newline.
    fs.writeFileSync(MAKES_FILE, JSON.stringify(makesJson, null, 4).replace(/\n/g, "\r\n"));
  }

  if (toAdd.length || toRemove.length) {
    const drop = new Set(toRemove.map((r) => r.id));
    const kept = rows.filter((r) => !drop.has(r.id)).map((r) => `${r.id}\t${r.url}`);
    const added = toAdd.map((p, i) => `${maxId + 1 + i}\t${BASE}${p}`);
    // Same layout as before: CRLF between rows, no newline after the last one.
    fs.writeFileSync(CSV_FILE, [header, ...kept, ...added].join(eol));
    execFileSync(process.execPath, [path.join(__dirname, "generate-indexable-urls-json.js")], { stdio: "inherit" });
  }
  if (redirectsChanged) fs.writeFileSync(REDIRECTS_FILE, JSON.stringify(sortedRedirects, null, 2) + "\n");
  console.log("Done.");
})().catch((e) => {
  console.error("❌ sync-model-urls failed:", e.message);
  process.exit(1);
});
