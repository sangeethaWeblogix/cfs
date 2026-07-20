// src/app/sitemap.xml/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

  const sitemaps = [
    "general-sitemap.xml",
    "listings-sitemap.xml",
    "categories-sitemap.xml",
    "states-sitemap.xml",
    "regions-sitemap.xml",
    "makes-sitemap.xml",
    "blogs-sitemap.xml",
    "models-sitemap.xml",
    "weights-sitemap.xml",
    "prices-sitemap.xml",
    "length-sitemap.xml",
    "category-state-sitemap.xml",
    "category-region-sitemap.xml",
    "attributes-others-sitemap.xml",
    // "sleep-sitemap.xml",
    // "state-make-sitemap.xml",
    // "region-make-sitemap.xml",
    // "category-sleep-sitemap.xml",
  ];

  const lastModified = new Date().toISOString().split("T")[0];

  // 🚀 Build XML — no trim, no space before XML declaration
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map(
      (file) => `  <sitemap>
    <loc>${siteUrl}/${file}</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>`,
    ),
    "</sitemapindex>",
  ].join("\n");

  // ✅ Send as raw UTF-8 bytes (so header stays visible)
  return new NextResponse(Buffer.from(xml, "utf-8"), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
