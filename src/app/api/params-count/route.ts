import { NextRequest, NextResponse } from "next/server";

export const preferredRegion = "syd1";
import { fetchParamsCountFromKV, buildParamsKvKey } from "@/lib/paramsCountKv";

const API_KEY = process.env.CFS_API_KEY;

/**
 * Fall back to the live WP API when KV has no entry (dynamic filter combos
 * created by users stacking multiple filters not covered by the daily warm).
 */
async function fetchFromWP(
  searchParams: URLSearchParams,
  kvKey: string
): Promise<NextResponse> {
  const paramsStr = searchParams.toString();
  const url = `https://admin.caravansforsale.com.au/wp-json/cfs/v1/params_count?${paramsStr}`;

  console.log(`[params-count] KV MISS — falling back to WP | params="${paramsStr}" | kv_key="${kvKey}"`);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
    });

    if (!response.ok) {
      console.error(
        `[params-count] WP API HTTP ${response.status} | params="${paramsStr}" | kv_key="${kvKey}" | Check CFS_API_KEY.`
      );
      return NextResponse.json({}, { status: response.status });
    }

    const raw = await response.text();

    // Detect SiteGround / Cloudflare bot challenge
    if (raw.includes("sgcaptcha") || raw.trimStart().startsWith("<html")) {
      // Extract the blocked IP from SiteGround's challenge URL (y=ipc:IP:timestamp)
      const ipcMatch = raw.match(/ipc:([0-9.]+):/);
      const blockedIp = ipcMatch?.[1] ?? "unknown";
      console.error(
        `[params-count] BOT CHALLENGE blocked request | server_ip="${blockedIp}" | params="${paramsStr}" | kv_key="${kvKey}" | This is your Vercel server IP — whitelist it in SiteGround.`
      );
      return NextResponse.json({}, { status: 503 });
    }

    const idx = raw.indexOf('{"');
    try {
      const data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
      console.log(`[params-count] WP API OK | params="${paramsStr}" | kv_key="${kvKey}"`);
      return NextResponse.json(data, { headers: { "X-Params-Cache": "MISS" } });
    } catch {
      console.error(
        `[params-count] WP API unparseable body | params="${paramsStr}" | kv_key="${kvKey}" | body_preview="${raw.slice(0, 200)}"`
      );
      return NextResponse.json({});
    }
  } catch (err) {
    console.error(
      `[params-count] WP API fetch failed | params="${paramsStr}" | kv_key="${kvKey}" | error="${(err as Error).message}"`
    );
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
  const kvKey = buildParamsKvKey(paramsObj);
  return fetchFromWP(searchParams, kvKey);
}
