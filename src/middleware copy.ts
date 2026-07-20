  import { NextRequest, NextResponse } from "next/server";
 import { parseSlugToFilters } from "@/app/components/urlBuilder";
 const API_KEY = process.env.CFS_API_KEY;

 /**
  * Middleware – Single Source of Truth = API SEO
  * - No robots meta in HTML
  * - Google reads X-Robots-Tag from headers
  * - Dynamic filters supported (state, region, category, suburb, etc.)
  */
 export async function middleware(request: NextRequest) {
   const url = request.nextUrl.clone();
   const fullPath = url.pathname + url.search;
 
   /* =================================================
      0️⃣ Country Blocking (SG, CN)
      ================================================= */
   const country =
     request.headers.get("x-vercel-ip-country") ??
     request.headers.get("cf-ipcountry");
 
   if (country && ["SG", "CN"].includes(country)) {
     return new NextResponse(
       "This website is not available in your region.",
       { status: 403 }
     );
   }
 
   /* =================================================
      1️⃣ Block /feed URLs
      ================================================= */
   if (/feed/i.test(fullPath)) {
     return new NextResponse(null, { status: 410 });
   }
 
   /* =================================================
      2️⃣ Remove add-to-cart param
      ================================================= */
   if (url.searchParams.has("add-to-cart")) {
     url.searchParams.delete("add-to-cart");
     return NextResponse.redirect(url, { status: 301 });
   }
 
   /* =================================================
      3️⃣ Default response (used at end)
      ================================================= */
   const response = NextResponse.next();
 
   /* =================================================
      4️⃣ SEO – API DRIVEN (SOURCE OF TRUTH)
      ================================================= */
   if (url.pathname.startsWith("/listings")) {
     try {
       /**
        * Example pathname:
        * /listings/victoria-state/melbourne-region/jacana-3047-suburb
        */
       const slugParts = url.pathname
         .replace("/listings", "")
         .split("/")
         .filter(Boolean);
 
       /**
        * Reuse SAME logic as page
        * This handles:
        * - state
        * - state + category
        * - state + region
        * - state + region + suburb
        * - any future combinations
        */
       const filters = parseSlugToFilters(
         slugParts,
         Object.fromEntries(url.searchParams)
       );
 
       /**
        * Build API URL with dynamic filters
        */
       const apiUrl =
         "https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code?" +
         new URLSearchParams(filters as Record<string, string>).toString();
 
       const apiRes = await fetch(apiUrl, {
        headers: {
          "User-Agent": "next-middleware",
          ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
        },
       });
 
       if (apiRes.ok) {
         const data = await apiRes.json();
 
         const rawIndex = String(data?.seo?.index ?? "")
           .toLowerCase()
           .trim();
         const rawFollow = String(data?.seo?.follow ?? "")
           .toLowerCase()
           .trim();
 
         /**
          * Mirror API SEO exactly
          */
         const robotsHeader =
           (rawIndex === "noindex" ? "noindex" : "index") +
           ", " +
           (rawFollow === "nofollow" ? "nofollow" : "follow");
 
         response.headers.set("X-Robots-Tag", robotsHeader);
       } else {
         // Safe fallback
         response.headers.set("X-Robots-Tag", "index, follow");
       }
     } catch (error) {
       // Absolute safe fallback
       console.error("Middleware SEO error:", error);
       response.headers.set("X-Robots-Tag", "index, follow");
     }
   }
 
   return response;
 }
 
 /**
  * Run middleware only where needed
  */
 export const config = {
   matcher: [
     "/listings/:path*",
     "/((?!_next/static|_next/image|favicon.ico).*)",
   ],
 };
 