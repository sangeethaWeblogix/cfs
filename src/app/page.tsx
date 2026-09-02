import Home from "./home-demo/home";
import "./globals.css?=1";
import { Metadata } from "next";
import { headers } from "next/headers";

import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRequirements } from "@/api/postRquirements/api";
import { fetchHomePage } from "@/api/home/api";
import { fetchTypeCounts } from "@/api/homeApi/typeCounts/api";
import { fetchHomeFeatured } from "@/api/homeApi/featured/api";
import { fetchBlogs } from "@/api/blog/api";

const FEATURED_SEED_MAX = 15;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Caravans For Sale – New & Used Caravan Marketplace in Australia",
    template: "%s ",
  },
  description:
    "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  icons: { icon: "/favicon.ico" },
  robots: "index, follow",
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au",
  },
  openGraph: {
    title: "Caravans For Sale – New & Used Caravan Marketplace in Australia",
    description: "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
    url: "https://www.caravansforsale.com.au",
    siteName: "Caravans for Sale",
    images: [
      {
        url: "https://www.caravansforsale.com.au/images/cfs-logo.png",
        width: 800,
        height: 600,
        alt: "Caravans for Sale Australia",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravans For Sale – New & Used Caravan Marketplace in Australia",
    description: "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  },
};

const BASE_URL = "https://www.caravansforsale.com.au";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      "url": BASE_URL,
      "name": "Caravans For Sale",
      "description": "Australia's Marketplace for New & Used Caravans",
      "inLanguage": "en-AU",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${BASE_URL}/listings/{search_term_string}-search/`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "Caravans For Sale",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/images/cfs-logo-black.png`,
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "areaServed": "AU",
        "availableLanguage": "English",
      },
    },
  ],
};

export default async function Page() {
  const h = await headers();
  const visitorIp =
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "";
  const featuredSeed = Math.floor(Math.random() * FEATURED_SEED_MAX) + 1;

  const [
    stateBands,
    requirements,
    homeblog,
    typeCounts,
    featuredAll,
    featuredNew,
    featuredUsed,
    blogPosts,
  ] = await Promise.all([
    fetchStateBasedCaravans(),
    fetchRequirements(),
    fetchHomePage(),
    fetchTypeCounts(),
    fetchHomeFeatured({ type: "all", seed: featuredSeed, visitorIp }),
    fetchHomeFeatured({ type: "new", seed: featuredSeed, visitorIp }),
    fetchHomeFeatured({ type: "used", seed: featuredSeed, visitorIp }),
    fetchBlogs(1),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <Home
        stateBands={stateBands}
        requirements={requirements}
        homeblog={homeblog?.latest_posts ?? []}
        typeCounts={typeCounts}
        featuredAll={featuredAll}
        featuredNew={featuredNew}
        featuredUsed={featuredUsed}
        blogPosts={blogPosts.items}
        visitorIp={visitorIp}
      />
    </>
  );
}
