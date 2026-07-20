// src/app/general-sitemap.xml/route.ts
import { NextResponse } from "next/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

// Static URLs (you can extend this later with categories, states, regions)
const staticUrls = [
  "caravan-manufacturers",
  "off-road-caravans-manufacturers",
  "listings",
  "blog",
  "about-us",
  "contact",
  "dealer-advertising",
  "sell-my-caravan",
];

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const homepage = `<url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    </url>`;
  const urls = staticUrls
    .map((path) => {
      return `
        <url>
          <loc>${SITE_URL}/${path}/</loc>
          <lastmod>${today}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${homepage}
    ${urls}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
