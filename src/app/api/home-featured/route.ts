import { NextRequest, NextResponse } from "next/server";

export const preferredRegion = "syd1";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

// Normalize each product so components always get image_format as string[]
// home_featured returns `thumbnail` (imagestack R2 URL); also handle `image` fallback
function normalizeProduct(p: any): any {
  if (!p.image_format) {
    const img = p.thumbnail ?? p.image ?? p.main_image ?? null;
    p.image_format = img ? [img] : [];
  } else if (typeof p.image_format === "string") {
    p.image_format = [p.image_format];
  }
  if (!p.seller_type) p.seller_type = "dealer";
  return p;
}

export async function GET(request: NextRequest) {
  const type     = request.nextUrl.searchParams.get("type") ?? "all";
  const seed     = request.nextUrl.searchParams.get("seed");
  const category = request.nextUrl.searchParams.get("category");
  const url = `${API_BASE}/home_featured?type=${encodeURIComponent(type)}${seed ? `&seed=${encodeURIComponent(seed)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`;

  const visitorIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const t0 = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        ...(API_KEY && { "X-API-Key": API_KEY }),
        ...(visitorIp && { "X-Visitor-IP": visitorIp }),
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    console.log(`[WP API] home_featured type=${type} ip=${visitorIp || "(none)"} — ${Date.now() - t0}ms`);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      console.error(`[WP API] home_featured type=${type} non-OK status: ${res.status} body: ${errBody}`);
      return NextResponse.json(
        { success: false, _wp_error: errBody },
        {
          status: res.status,
          headers: {
            "X-Debug-Visitor-IP": visitorIp || "(none)",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const raw = await res.text();

    // Detect Cloudflare bot challenge (returns HTML with sgcaptcha or cf-chl)
    if (raw.includes("sgcaptcha") || raw.includes("cf-chl") || raw.trimStart().startsWith("<html")) {
      console.error(
        `[WP API] home_featured type=${type} CLOUDFLARE CHALLENGE blocked request — ` +
        `ip=${visitorIp || "(none)"}, url=${url}. ` +
        `Fix: add a WAF bypass rule in Cloudflare for X-API-Key header.`
      );
      return NextResponse.json(
        { success: false, _cf_blocked: true },
        {
          status: 503,
          headers: {
            "X-Debug-Visitor-IP": visitorIp || "(none)",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const jsonStart = raw.indexOf('{');
    let json: any;
    try {
      json = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);
    } catch {
      console.error(
        `[WP API] home_featured type=${type} unparseable body (first 500 chars): ` +
          raw.slice(0, 500)
      );
      return NextResponse.json(
        { success: false },
        {
          status: 502,
          headers: {
            "X-Debug-Visitor-IP": visitorIp || "(none)",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Response shape: { success, products: [...], meta: {...} }
    const rawProducts: any[] = json?.products ?? json?.data?.products ?? [];
    const products = rawProducts.map(normalizeProduct);

    return NextResponse.json(
      { success: true, products },
      {
        headers: {
          "X-Debug-Visitor-IP": visitorIp || "(none)",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    clearTimeout(timeoutId);
    const status = err?.name === "AbortError" ? 504 : 500;
    console.error(`[WP API] home_featured type=${type} fetch error (${status}):`, err?.message);
    return NextResponse.json(
      { success: false },
      {
        status,
        headers: {
          "X-Debug-Visitor-IP": visitorIp || "(none)",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
