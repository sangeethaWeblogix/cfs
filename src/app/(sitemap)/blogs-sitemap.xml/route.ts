// src/app/blogs-sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { fetchBlogs } from "@/api/blog/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.caravansforsale.com.au";

// Blog slugs that next.config.ts redirects elsewhere ("Blog URL redirects") — a sitemap must
// only list the final 200 URL, so these are skipped (Ahrefs: "3XX redirect in sitemap").
const REDIRECTED_BLOG_SLUGS = new Set(["best-off-road-caravans-in-australia-2026"]);

export async function GET() {
  const firstPage = await fetchBlogs(1);
  let allItems = [...firstPage.items];

  if (firstPage.totalPages > 1) {
    for (let page = 2; page <= firstPage.totalPages; page++) {
      const nextPage = await fetchBlogs(page);
      allItems = [...allItems, ...nextPage.items];
    }
  }

  const urls = allItems
    .filter((blog) => !REDIRECTED_BLOG_SLUGS.has(blog.slug))
    .map(
      (blog) => `
    <url>
      <loc>${SITE_URL}/${blog.slug}/</loc>
      <lastmod>${
        blog.date ? new Date(blog.date).toISOString() : new Date().toISOString()
      }</lastmod>
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
      "Content-Type": "application/xml",
    },
  });
}
