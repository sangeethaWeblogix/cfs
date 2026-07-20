/* eslint-disable */
/**
 * update-kv-build-id.js
 *
 * Runs automatically as part of "next build" (see package.json).
 * Reads the Next.js build ID from .next/BUILD_ID and writes it to the
 * Cloudflare KV key "current-build-id".
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Cloudflare Worker serves pre-generated HTML pages from KV storage for
 * speed. Each KV HTML entry embeds the Next.js buildId inside __NEXT_DATA__.
 * When Vercel deploys a new build, _next/static/... asset URLs change — so any
 * KV HTML referencing the OLD build's assets will fail to load CSS/JS.
 *
 * The Worker already has a build-ID mismatch check: if the KV HTML's buildId
 * differs from "current-build-id" in KV, it bypasses KV and serves a fresh page
 * from Vercel instead. This script keeps "current-build-id" up to date so that
 * check can fire correctly on every deployment.
 *
 * FLOW AFTER THIS SCRIPT RUNS
 * ───────────────────────────
 * 1. Vercel finishes building → this script writes new buildId to KV.
 * 2. Worker reads "current-build-id" = new buildId on next HTML request.
 * 3. KV HTML still embeds OLD buildId → mismatch detected → Worker bypasses KV.
 * 4. Fresh HTML (with correct asset URLs) is fetched live from Vercel. ✓
 * 5. Later, generate-priority-pages.js regenerates KV HTML with the new buildId
 *    and updates "current-build-id" → KV serving resumes normally.
 *
 * REQUIRED ENVIRONMENT VARIABLES (set in Vercel project settings)
 * ───────────────────────────────────────────────────────────────
 *   CF_ACCOUNT_ID       — Cloudflare account ID
 *   CF_KV_NAMESPACE_ID  — KV namespace ID (same one used by the worker)
 *   CF_API_TOKEN        — Cloudflare API token with KV write permission
 *
 * If any are missing the script exits cleanly without failing the build.
 */

const fs = require('fs');
const path = require('path');

async function main() {
  // ── 1. Read the build ID Next.js just generated ──────────────────────────
  const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');

  if (!fs.existsSync(buildIdPath)) {
    console.warn('[update-kv-build-id] .next/BUILD_ID not found — skipping KV update.');
    return;
  }

  const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
  if (!buildId) {
    console.warn('[update-kv-build-id] BUILD_ID is empty — skipping KV update.');
    return;
  }

  console.log(`[update-kv-build-id] New build ID: ${buildId}`);

  // ── 2. Check credentials ──────────────────────────────────────────────────
  const { CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN } = process.env;

  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.warn(
      '[update-kv-build-id] CF_ACCOUNT_ID / CF_KV_NAMESPACE_ID / CF_API_TOKEN not set — ' +
      'skipping KV update. Add these to your Vercel project environment variables.'
    );
    return;
  }

  // ── 3. Upload to Cloudflare KV ────────────────────────────────────────────
  const kvUrl =
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}` +
    `/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/current-build-id`;

  try {
    const res = await fetch(kvUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'text/plain',
      },
      body: buildId,
    });

    if (res.ok) {
      console.log(`[update-kv-build-id] ✅ current-build-id updated to: ${buildId}`);
    } else {
      const text = await res.text().catch(() => '');
      console.error(
        `[update-kv-build-id] ⚠️  KV PUT failed (HTTP ${res.status}): ${text.substring(0, 200)}`
      );
      // Not a fatal error — the build still succeeds; the Worker will fall back
      // to serving KV HTML as-is (possibly stale), which degrades gracefully.
    }
  } catch (err) {
    console.error(`[update-kv-build-id] ⚠️  Network error: ${err.message}`);
    // Non-fatal: build continues.
  }
}

main();
