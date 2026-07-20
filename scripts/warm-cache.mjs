// Cache warming script — run after deployment to pre-warm unstable_cache for all listing URLs.
// Usage:
//   node scripts/warm-cache.mjs                          (uses production URL)
//   node scripts/warm-cache.mjs https://staging.vercel.app
//   node scripts/warm-cache.mjs https://www.caravansforsale.com.au 5   (concurrency 5)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = (process.argv[2] || "https://www.caravansforsale.com.au").replace(/\/$/, "");
const CONCURRENCY = parseInt(process.argv[3] || "8", 10);
const TIMEOUT_MS = 35_000;
const CSV_PATH = path.join(__dirname, "../src/app/url.csv");
const SITE_BASE = "https://www.caravansforsale.com.au";

// ── Read all URLs from url.csv ────────────────────────────────────────────────
const content = fs.readFileSync(CSV_PATH, "utf-8");
const urls = [];
for (const line of content.split(/\r?\n/).slice(1)) {
  const url = line.split("\t")[1]?.trim();
  if (!url) continue;
  let p = url.startsWith(SITE_BASE) ? url.slice(SITE_BASE.length) : url;
  if (!p.endsWith("/")) p += "/";
  urls.push(p);
}

console.log(`\n🔥 Cache Warmer — ${urls.length} URLs`);
console.log(`   Target    : ${BASE_URL}`);
console.log(`   Concurrency: ${CONCURRENCY} parallel requests\n`);

let done = 0;
let errors = 0;
let skipped = 0;
const failed = [];
const startTime = Date.now();

async function warmUrl(url) {
  const fullUrl = BASE_URL + url;
  try {
    const res = await fetch(fullUrl, {
      headers: {
        "User-Agent": "CFS-CacheWarmer/1.0",
        Accept: "text/html,application/xhtml+xml",
        "Cache-Control": "no-cache",     // force fresh render, not CDN cache
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    done++;

    if (res.status === 404 || res.status === 410) {
      skipped++;
    } else if (!res.ok) {
      errors++;
      failed.push({ url, status: res.status });
      console.warn(`  ⚠️  HTTP ${res.status}  ${url}`);
    }

    // Progress every 100 URLs
    if (done % 100 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const rate = done / elapsed;
      const eta = Math.round((urls.length - done) / rate);
      console.log(
        `  ✅ ${done}/${urls.length}  errors:${errors}  ~${eta}s remaining`
      );
    }
  } catch (err) {
    errors++;
    done++;
    failed.push({ url, error: err.message });
    console.error(`  ❌ FAILED  ${url}  —  ${err.message}`);
  }
}

// ── Run in batches with concurrency ──────────────────────────────────────────
for (let i = 0; i < urls.length; i += CONCURRENCY) {
  const batch = urls.slice(i, i + CONCURRENCY).map((url) => warmUrl(url));
  await Promise.allSettled(batch);
}

// ── Final report ─────────────────────────────────────────────────────────────
const totalSecs = Math.round((Date.now() - startTime) / 1000);
const warmed = done - errors - skipped;

console.log("\n──────────────────────────────────────────");
console.log(`✅  Warmed  : ${warmed}`);
console.log(`⏭️  Skipped : ${skipped}  (404/410 pages)`);
console.log(`❌  Errors  : ${errors}`);
console.log(`⏱️  Total   : ${totalSecs}s`);
console.log("──────────────────────────────────────────");

if (failed.length > 0) {
  console.log("\nFailed URLs:");
  for (const f of failed) {
    console.log(`  • ${f.url}  ${f.status ?? f.error}`);
  }
}
