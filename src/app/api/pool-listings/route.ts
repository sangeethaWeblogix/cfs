
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

// engine=typesense is appended whenever any filter beyond pagination is present.
// If typesense returns products:[] (empty), we automatically fall back to the
// WP native engine (same request without engine=typesense).
const BASE_PARAM_KEYS = new Set([
  "per_page", "orderby", "seed", "page",
]);

async function fetchPoolTest(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      ...(API_KEY && { "X-API-Key": API_KEY }),
    },
    cache: "no-store",
  });

  const raw = await res.text();
  const jsonStart = raw.indexOf("{");
  const cleaned =
    jsonStart === -1 ? raw : jsonStart === 0 ? raw : raw.substring(jsonStart);

  let data: any;
  try {
    data = JSON.parse(cleaned);
  } catch {
    data = null;
  }

  return { res, data, raw };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = searchParams.toString();

  const hasRealFilter = [...searchParams.keys()].some((key) => !BASE_PARAM_KEYS.has(key));
  const url = `${API_BASE}/pool_test?${params}${hasRealFilter ? `${params ? "&" : ""}engine=typesense` : ""}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const t0 = Date.now();

  try {
    let { res, data, raw } = await fetchPoolTest(url, controller.signal);

    // Fallback: if typesense returned empty products, retry without engine=typesense
    if (
      hasRealFilter &&
      res.ok &&
      data &&
      (data?.products?.length === 0 || data?.data?.products?.length === 0)
    ) {
      const fallbackUrl = `${API_BASE}/pool_test?${params}`;
      console.log(`[WP API pool_test] typesense empty, falling back to WP engine | ${params.substring(0, 80)}`);
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 30000);
      try {
        const fallback = await fetchPoolTest(fallbackUrl, controller2.signal);
        clearTimeout(timeout2);
        if (fallback.res.ok && fallback.data) {
          res = fallback.res;
          data = fallback.data;
          raw = fallback.raw;
        }
      } catch (fbErr: any) {
        clearTimeout(timeout2);
        console.log("[WP API pool_test] fallback fetch error:", fbErr?.message);
      }
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
