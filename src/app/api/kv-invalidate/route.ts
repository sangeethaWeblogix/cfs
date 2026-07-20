import { NextRequest, NextResponse } from "next/server";

// ⚠️ DISABLED 2026-07-01.
//
// This endpoint used to wipe CF KV routes-mapping to {} the instant Vercel
// finished deploying — before anyone knew whether the new deploy actually
// worked. That meant every deploy, good or bad, sent 100% of live traffic
// straight to origin with zero cache protection. That's what let a broken
// navbar/mega-menu deploy reach every visitor directly for ~2 hours on
// 2026-07-01: the safety net was torn down at the exact moment it was
// needed most, with nothing checking whether the new code actually worked.
//
// Cache is now only ever updated by the validated generate -> canary check
// -> flip flow in .github/workflows/post-deploy-warmup.yml, which only
// touches KV once a new deploy has been proven to render cleanly (see the
// comments at the top of that file and in scripts/generate-priority-pages.js
// for the full flow).
//
// This route is left in place — returning success but doing nothing — only
// so the existing Vercel "deployment.succeeded" webhook doesn't start
// failing with 404/500s.
//
// ACTION NEEDED (outside this repo): remove the webhook itself from
// Vercel → Project → Settings → Webhooks (the one pointing at
// /api/kv-invalidate). Once that's gone, this route can be deleted entirely.

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.REVALIDATION_SECRET || secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  console.log(
    "[KV Invalidate] Disabled — no-op. Cache is managed by the post-deploy-warmup canary flow. Remove the Vercel webhook calling this route."
  );

  return NextResponse.json({
    invalidated: false,
    message:
      "This endpoint is disabled. Cache is now managed by the validated post-deploy-warmup workflow — remove the Vercel webhook pointing here.",
  });
}
