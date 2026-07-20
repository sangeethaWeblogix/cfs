import { NextResponse } from "next/server";
import regionsData from "../../../../cfs-paths/regions.json";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.caravansforsale.com.au/listings/";

export async function GET() {
  try {
    const data = regionsData as { success: boolean; paths: string[] };

    if (!data?.success || !Array.isArray(data.paths)) {
      throw new Error("Invalid sitemap data");
    }

    const urls = data.paths
      .map(
        (path: string) => `
    <url>
      <loc>${SITE_URL}${path}</loc>
       <lastmod>${new Date().toISOString()}</lastmod>
             <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`,
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
