/* eslint-disable */
/**
 * update-kv-build-id.js
 *
 * Runs automatically as part of "next build" (see package.json).
 * Reads this deployment's VERCEL_DEPLOYMENT_ID (dpl_xxx) and writes it to the
 * Cloudflare KV key "current-build-id".
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Cloudflare Worker serves pre-generated HTML pages from KV storage for
 * speed. This app is App Router + Turbopack, which embeds NO __NEXT_DATA__ and
 * no _buildManifest.js reference in its HTML at all — so there's no in-HTML
 * "buildId" the way Pages Router had one. What Vercel DOES embed on every static
 * asset URL is its own skew-protection deployment id:
 *   /_next/static/chunks/<hash>.js?dpl=<deploymentId>
 * That dpl_xxx changes on every deployment, so it's used as the buildId stand-in
 * throughout this caching system (see worker.js's extractBuildId() and
 * generate-priority-pages.js, which must stay in sync with this file).
 *
 * The Worker already has a mismatch check: if the KV HTML's dpl_xxx differs from
 * "current-build-id" in KV, it bypasses KV and serves a fresh page from Vercel
 * instead. This script keeps "current-build-id" up to date so that check can
 * fire correctly on every deployment.
 *
 * IMPORTANT: this must be the SAME dpl_xxx value Vercel bakes into the asset
 * URLs of the pages it serves for this deployment — NOT .next/BUILD_ID (an
 * internal Next.js build hash that never appears anywhere in the rendered HTML
 * and therefore can never match anything the Worker extracts from it). Vercel
 * exposes it at build time as the VERCEL_DEPLOYMENT_ID system environment
 * variable.
 *
 * FLOW AFTER THIS SCRIPT RUNS
 * ───────────────────────────
 * 1. Vercel finishes building → this script writes the new dpl_xxx to KV.
 * 2. Worker reads "current-build-id" = new dpl_xxx on next HTML request.
 * 3. KV HTML still embeds the OLD dpl_xxx → mismatch detected → Worker bypasses KV.
 * 4. Fresh HTML (with correct asset URLs) is fetched live from Vercel. ✓
 * 5. Later, generate-priority-pages.js regenerates KV HTML with the new dpl_xxx
 *    and updates "current-build-id" → KV serving resumes normally.
 *
 * REQUIRED ENVIRONMENT VARIABLES (set in Vercel project settings)
 * ───────────────────────────────────────────────────────────────
 *   CF_ACCOUNT_ID       — Cloudflare account ID
 *   CF_KV_NAMESPACE_ID  — KV namespace ID (same one used by the worker)
 *   CF_API_TOKEN        — Cloudflare API token with KV write permission
 *
 * VERCEL_DEPLOYMENT_ID is a Vercel system environment variable — no setup
 * needed, but it must be exposed to the build step (Vercel sets it automatically).
 *
 * If any are missing the script exits cleanly without failing the build.
 */

async function main() {
  // ── 1. Get this deployment's id — the same dpl_xxx Vercel bakes into every
  //      /_next/static/... asset URL on the pages it serves for this build.
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;

  if (!deploymentId) {
    console.warn('[update-kv-build-id] VERCEL_DEPLOYMENT_ID not set (not running on Vercel?) — skipping KV update.');
    return;
  }

  console.log(`[update-kv-build-id] New deployment id: ${deploymentId}`);

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
      body: deploymentId,
    });

    if (res.ok) {
      console.log(`[update-kv-build-id] ✅ current-build-id updated to: ${deploymentId}`);
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
