
import { NextRequest, NextResponse } from "next/server";

export const preferredRegion = "syd1";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

async function fetchPoolTest(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      ...(API_KEY && { "X-API-Key": API_KEY }),
    },
    cache: "no-store",
  });

  const raw = await res.text();

  // Detect SiteGround bot challenge
  if (raw.includes("sgcaptcha") || raw.trimStart().startsWith("<html")) {
    console.error(
      `[WP API pool_test] BOT CHALLENGE blocked request | url="${url.substring(0, 120)}"`
    );
    return { res, data: null, raw, botChallenge: true };
  }

  const jsonStart = raw.indexOf("{");
  const cleaned =
    jsonStart === -1 ? raw : jsonStart === 0 ? raw : raw.substring(jsonStart);

  let data: any;
  try {
    data = JSON.parse(cleaned);
  } catch {
    console.error(`[WP API pool_test] JSON parse failed | url="${url.substring(0, 120)}" | preview="${raw.slice(0, 200)}"`);
    data = null;
  }

  return { res, data, raw, botChallenge: false };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = searchParams.toString();

  // Forward all params directly to WP pool_test (SQL engine, no typesense).
  const url = `${API_BASE}/pool_test?${params}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const t0 = Date.now();

  try {
    const { res, data, raw, botChallenge } = await fetchPoolTest(url, controller.signal);

    if (botChallenge) {
      clearTimeout(timeoutId);
      return NextResponse.json({ success: false, error: "bot_challenge" }, { status: 503 });
    }

    clearTimeout(timeoutId);
    console.log(`[WP API pool_test] ${Date.now() - t0}ms | ${params.substring(0, 80)}`);

    if (!res.ok) {
      if (res.status === 410) {
        try {
          const body = data ?? JSON.parse(raw);
          console.log("[WP API pool_test] 410 body:", body);
          return NextResponse.json(body, { status: 410 });
        } catch {
          return NextResponse.json({ success: false }, { status: 410 });
        }
      }
      console.log(`[WP API pool_test] non-OK status: ${res.status}`);
      if (data?.ts_debug || data?.message) {
        console.error(`[WP API pool_test] error message: ${data?.message}`, "ts_debug:", data?.ts_debug);
      }
      return NextResponse.json({ success: false }, { status: res.status });
    }

    if (!data) {
      console.log("[WP API pool_test] JSON parse failed. Raw response:", raw.substring(0, 500));
      return NextResponse.json({ success: false, error: "invalid_json" }, { status: 502 });
    }

    console.log("[WP API pool_test] summary:", {
      params: params.substring(0, 200),
      success: data?.success,
      total_products: data?.pagination?.total_products,
      pool_size: data?.pagination?.pool_size,
      products_returned: data?.products?.length ?? data?.data?.products?.length ?? 0,
      premium_products: data?.premium_products?.length ?? data?.data?.premium_products?.length ?? 0,
      exclusive_products: data?.exclusive_products?.length ?? data?.data?.exclusive_products?.length ?? 0,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[WP API pool_test] Error:", err);
    const status = err?.name === "AbortError" ? 504 : 500;
    console.log(`[WP API pool_test] fetch error (${status}):`, err?.message);
    return NextResponse.json({ success: false }, { status });
  }
}
