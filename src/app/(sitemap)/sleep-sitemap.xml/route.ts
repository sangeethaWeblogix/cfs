    import { NextResponse } from "next/server";
  
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.caravansforsale.com.au/listings/";
      const API_KEY = process.env.CFS_API_KEY; // ✅ Added

  
  export async function GET() {
    try {
      const res = await fetch(
        "https://admin.caravansforsale.com.au/wp-json/cfs/v1/sitemap/sleep",
         {
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
        },
      }
       
      );
  
      const data = await res.json();
  
      if (!data?.success || !Array.isArray(data.paths)) {
        throw new Error("Invalid sitemap API response");
      }
  
      
  
      const urls = data.paths
        .map(
          (path: string) => `
    <url>
      <loc>${SITE_URL}${path}</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
             <changefreq>daily</changefreq>
        <priority>0.5</priority>
    </url>`
        )
        .join("");
  
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
  </urlset>`;
  
      return new NextResponse(sitemap, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      });
    } catch (error) {
      console.error("❌ Sitemap error:", error);
      return new NextResponse("Failed to generate sitemap", { status: 500 });
    }
  }
  