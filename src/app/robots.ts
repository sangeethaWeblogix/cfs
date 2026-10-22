import { MetadataRoute } from "next";

const BASE_URL = "https://www.caravansforsale.com.au";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*", // applies to all crawlers
        allow: "/", // allow all public pages
        disallow: [
          "/*?add-to-cart=", // block WooCommerce cart query URLs
          "/*&add-to-cart=",
          "/admin", // block admin area
          "/dashboard", // block dashboard
          "/api", // block backend APIs
          // "/*feed*",
          // "*/feed/",
         "/*?*page=",
          // "/*feedfeed*",
          // "/*feedfeedfeed*",
"/listings/404",
          // Block keyword search + any other filter (state/make/region/band combos)
          // Direct /listings/*-search/ stays crawlable; only combinations are blocked
          "/listings/*/*-search/",
          // ?keyword= / ?search= result pages (junk keywords from spam links) — never crawl targets
          "/listings/*?keyword=",
          "/listings/*&keyword=",
          "/listings/*?search=",
          "/listings/*&search="

          
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
