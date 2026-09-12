import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

const MPN_API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const MPN_API_KEY = process.env.CFS_API_KEY;

export async function GET() {
  try {
    const res = await fetch(`${MPN_API_BASE}/sitemap/listings`, {
      headers: {
        Accept: "application/json",
        ...(MPN_API_KEY && { "X-Secret-Key": MPN_API_KEY }),
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Sitemap API HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data?.success || !Array.isArray(data.paths)) {
      throw new Error("Invalid sitemap API response");
    }

    const today = new Date().toISOString().split("T")[0];

    const urls = data.paths
      .map(
        (path: string) => `
          <url>
            <loc>${SITE_URL}/product/${path}</loc>
            <lastmod>${today}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.7</priority>
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
    console.error("Sitemap error:", error);
    return new NextResponse("Failed to generate sitemap", { status: 500 });
  }
}
