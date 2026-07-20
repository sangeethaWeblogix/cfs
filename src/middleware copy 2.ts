 import { NextRequest, NextResponse } from "next/server";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
const API_KEY = process.env.CFS_API_KEY;

// Simple in-memory cache (edge-compatible)
const seoCache = new Map<string, { robots: string; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const fullPath = url.pathname + url.search;

  /* 0️⃣ Country Blocking */
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry");
console.log("Detected country:", country);
  if (country && ["SG", "CN"].includes(country)) {
    return new NextResponse("This website is not available in your region.", {
      status: 403,
    });
  }

  /* 1️⃣ Block /feed URLs */
  if (/feed/i.test(fullPath)) {
    return new NextResponse(null, { status: 410 });
  }

  /* 2️⃣ Remove add-to-cart param */
  if (url.searchParams.has("add-to-cart")) {
    url.searchParams.delete("add-to-cart");
    return NextResponse.redirect(url, { status: 301 });
  }

  /* 3️⃣ Default response */
  const response = NextResponse.next();

  /* 4️⃣ SEO Header - WITH TIMEOUT & CACHE */
  if (url.pathname.startsWith("/listings")) {
    const cacheKey = url.pathname;

    // Check cache first
    const cached = seoCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      response.headers.set("X-Robots-Tag", cached.robots);
      return response;
    }

    try {
      const slugParts = url.pathname
        .replace("/listings", "")
        .split("/")
        .filter(Boolean);

      const filters = parseSlugToFilters(
        slugParts,
        Object.fromEntries(url.searchParams)
      );

      const apiUrl =
        "https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code?" +
        new URLSearchParams(filters as Record<string, string>).toString();

      // ✅ KEY FIX: Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800); // 800ms timeout

      const apiRes = await fetch(apiUrl, {
         headers: {
          "User-Agent": "next-middleware",
          ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
        },
         signal: controller.signal,
        // @ts-ignore - Next.js edge cache
        next: { revalidate: 60 },
      });

      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const data = await apiRes.json();

        const rawIndex = String(data?.seo?.index ?? "").toLowerCase().trim();
        const rawFollow = String(data?.seo?.follow ?? "").toLowerCase().trim();

        const robotsHeader =
          (rawIndex === "noindex" ? "noindex" : "index") +
          ", " +
          (rawFollow === "nofollow" ? "nofollow" : "follow");

        // Save to cache
        seoCache.set(cacheKey, {
          robots: robotsHeader,
          expires: Date.now() + CACHE_TTL,
        });

        response.headers.set("X-Robots-Tag", robotsHeader);
      } else {
        response.headers.set("X-Robots-Tag", "index, follow");
      }
    } catch (error) {
      // Timeout or network error - use safe default
      console.error("Middleware SEO error:", error);
      response.headers.set("X-Robots-Tag", "index, follow");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/listings/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};