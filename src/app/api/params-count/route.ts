import { NextRequest, NextResponse } from "next/server";
import { fetchParamsCountFromKV } from "@/lib/paramsCountKv";

const API_KEY = process.env.CFS_API_KEY;

/**
 * Fall back to the live WP API when KV has no entry (dynamic filter combos
 * created by users stacking multiple filters not covered by the daily warm).
 */
async function fetchFromWP(searchParams: URLSearchParams): Promise<NextResponse> {
  const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${searchParams.toString()}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
    });
    if (!response.ok) {
      console.error(
        `[params-count] WP API returned HTTP ${response.status} for ` +
          `"${searchParams.toString()}". Check CFS_API_KEY.`
      );
      return NextResponse.json({}, { status: response.status });
    }
    const raw = await response.text();
    const idx = raw.indexOf('{"');
    try {
      const data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
      return NextResponse.json(data, { headers: { "X-Params-Cache": "MISS" } });
    } catch {
      console.error("[params-count] WP API returned unparseable body.");
      return NextResponse.json({});
    }
  } catch (err) {
    console.error("[params-count] WP API request failed:", err);
    return NextResponse.json({}, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Convert URLSearchParams to a plain object for the shared KV utility
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((v, k) => { paramsObj[k] = v; });

  // 1. Check Cloudflare KV for a pre-warmed response (shared with SSR path)
  const kvResult = await fetchParamsCountFromKV(paramsObj);
  if (kvResult !== null) {
    return NextResponse.json(kvResult, {
      headers: { "X-Params-Cache": "HIT" },
    });
  }

  // 2. KV miss — call the live WP API (dynamic combos not covered by daily warm)
  return fetchFromWP(searchParams);
}
