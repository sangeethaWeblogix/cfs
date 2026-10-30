import { NextResponse } from "next/server";
import { getUnmatchedIndexablePaths } from "@/utils/sitemap/indexableListings";

const SITE_URL = "https://www.caravansforsale.com.au";

// Catch-all for the listing sitemaps: every indexable (url.csv) URL that none of the other
// listing sitemaps lists.
export async function GET() {
  try {
    const paths = await getUnmatchedIndexablePaths();
    const lastmod = new Date().toISOString().split("T")[0];

    const urls = paths
      .map(
        (path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`,
      )
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(Buffer.from(sitemap, "utf-8"), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ Sitemap error:", error);
    return new NextResponse("Failed to generate sitemap", { status: 500 });
  }
}
