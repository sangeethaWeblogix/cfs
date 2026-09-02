import { NextRequest, NextResponse } from "next/server";

export const preferredRegion = "syd1";
import { fetchParamsCountFromKV } from "@/lib/paramsCountKv";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

/**
 * Band-count lookup for the browse-section filter links (Price/ATM/Length/Sleep).
 * Mirrors fetchBandCountServer in fetchBrowseSectionData.ts so the client-side
 * refetch (filters changed after initial SSR) hits the same KV-first path
 * instead of falling back to the heavier pool_test endpoint.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((v, k) => { paramsObj[k] = v; });

  // 1. KV cache (shared with SSR path) — warmer may store total_products for this combo
  const kv = await fetchParamsCountFromKV(paramsObj);
  if (kv?.total_products != null) {
    return NextResponse.json(
      { success: true, exists: kv.total_products > 0, count: kv.total_products },
      { headers: { "X-Params-Cache": "HIT" } }
    );
  }

  // 2. KV miss — live fallback to WP product_exists_check
  const paramsStr = searchParams.toString();
  try {
    const res = await fetch(`${API_BASE}/product_exists_check?${paramsStr}`, {
      headers: {
        Accept: "application/json",
        ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, exists: false, count: 0 }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json(json, { headers: { "X-Params-Cache": "MISS" } });
  } catch (err) {
    console.error(
      `[product-exists-check] WP API fetch failed | params="${paramsStr}" | error="${(err as Error).message}"`
    );
    return NextResponse.json({ success: false, exists: false, count: 0 }, { status: 502 });
  }
}
