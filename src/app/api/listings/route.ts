import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/new_optimize_code?${params}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const t0 = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      // No Next.js Data Cache here by design — this route only ever runs after a
      // Cloudflare KV miss (or for noindex pages, which always live-proxy). The
      // Cloudflare Worker's KV cache is the single source of truth; an extra,
      // unmanaged cache layer here (with no way to invalidate it on demand) could
      // silently serve stale data even after the WP admin refreshes KV.
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    console.log(`[WP API] ${Date.now() - t0}ms | ${params.substring(0, 80)}`);

    if (!res.ok) {
      // For 410, forward the full body (contains emp_exclusive_products for 0-product pages)
      if (res.status === 410) {
        try {
          const body = await res.json();
          return NextResponse.json(body, { status: 410 });
        } catch {
          return NextResponse.json({ success: false }, { status: 410 });
        }
      }
      return NextResponse.json({ success: false }, { status: res.status });
    }

    const raw = await res.text();
    const jsonStart = raw.indexOf('{');
    const data = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const status = err?.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ success: false }, { status });
  }
}
