 // src/app/regions-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const API_URL = "https://admin.caravansforsale.com.au/wp-json/cfs/v1/location-search-all";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

export async function GET() {
  try {
    // Fetch all location data (contains region_state)
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const data = await res.json();
    const items = data?.region_state || []; // ✅ correct key based on your screenshot

    if (!Array.isArray(items) || items.length === 0) {
      console.warn("No region_state data found.");
    }

    // Build clean region URLs
    const urls = items
      .map((item) => {
        const uri = item?.uri?.trim();
        if (!uri) return null;

        // Example: "NSW/sydney-region"
        const parts = uri.split("/").filter(Boolean);
        const statePart = parts.find((p) => p.includes("-state") || p.length === 3) || "";
        const regionPart = parts.find((p) => p.includes("-region")) || "";

        if (!regionPart || !statePart) return null;

        return `${SITE_URL}/listings/${statePart}/${regionPart}/`;
      })
      .filter(Boolean);

    // Build XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (loc) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("")}
</urlset>`;

    // Return XML response
    return new NextResponse(Buffer.from(xml, "utf-8"), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error fetching region data:", error);
    return new NextResponse("Error fetching region data", { status: 500 });
  }
}
