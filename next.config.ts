import type { NextConfig } from "next";

const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: false,
  //  productionBrowserSourceMaps: false,
  images: {
    domains: [
      "media.caravansforsale.com.au",
      "www.caravansforsale.com.au",
      "admin.caravansforsale.com.au",
      "caravansforsale.b-cdn.net",
      "wb79vudhmjvv4ng6.public.blob.vercel-storage.com",
      "caravansforsale.imagestack.net",
    ],
    remotePatterns: [
      { protocol: "https", hostname: "**.caravansforsale.com.au", pathname: "/**" },
      { protocol: "https", hostname: "caravansforsale.b-cdn.net", pathname: "/**" },
      { protocol: "https", hostname: "caravansforsale.imagestack.net", pathname: "/**" },
      { protocol: "https", hostname: "wb79vudhmjvv4ng6.public.blob.vercel-storage.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  compress: true,

  async rewrites() {
    return [
      {
        source: "/blob/:path*",
        destination:
          "https://wb79vudhmjvv4ng6.public.blob.vercel-storage.com/:path*",
      },
      // NOTE: old /sell-my-caravan-:slug rewrite removed — replaced by 301 redirects below.
    ];
  },
  experimental: {
    // ✅ Built-in critical CSS inlining
    optimizeCss: true,
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },

  
  // compiler: {
  //  removeConsole: {
  //    exclude: ["error"],
  //   },
  // },

  // ✅ Redirects: malformed URLs + old sell-my-caravan URL structure → new nested URLs
  async redirects() {
    return [
      // ── Malformed feed URLs ──────────────────────────────────────────────
      {
        source: "/:path*/feed/:rest*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/:path*/feedfeed/:rest*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/:path*/feedfeedfeed/:rest*",
        destination: "/:path*",
        permanent: true,
      },

      // ── Old flat state pages → new nested state pages ────────────────────
      {
        source: "/sell-my-caravan-victoria/",
        destination: "/sell-my-caravan/victoria/",
        permanent: true,
      },
      {
        source: "/sell-my-caravan-new-south-wales/",
        destination: "/sell-my-caravan/new-south-wales/",
        permanent: true,
      },
      {
        source: "/sell-my-caravan-queensland/",
        destination: "/sell-my-caravan/queensland/",
        permanent: true,
      },
      {
        source: "/sell-my-caravan-south-australia/",
        destination: "/sell-my-caravan/south-australia/",
        permanent: true,
      },
      {
        source: "/sell-my-caravan-tasmania/",
        destination: "/sell-my-caravan/tasmania/",
        permanent: true,
      },
      {
        source: "/sell-my-caravan-western-australia/",
        destination: "/sell-my-caravan/western-australia/",
        permanent: true,
      },

      // ── Old region pages (/sell-my-caravan-region/[slug]/) → new nested ──
      // Victoria
      { source: "/sell-my-caravan-region/melbourne-region/", destination: "/sell-my-caravan/victoria/melbourne/", permanent: true },
      { source: "/sell-my-caravan-region/geelong-region/", destination: "/sell-my-caravan/victoria/geelong/", permanent: true },
      { source: "/sell-my-caravan-region/ballarat-region/", destination: "/sell-my-caravan/victoria/ballarat/", permanent: true },
      { source: "/sell-my-caravan-region/latrobe-gippsland-region/", destination: "/sell-my-caravan/victoria/latrobe-gippsland/", permanent: true },
      { source: "/sell-my-caravan-region/mornington-peninsula-region/", destination: "/sell-my-caravan/victoria/mornington-peninsula/", permanent: true },
      { source: "/sell-my-caravan-region/shepparton-region/", destination: "/sell-my-caravan/victoria/shepparton/", permanent: true },
      { source: "/sell-my-caravan-region/hume-region/", destination: "/sell-my-caravan/victoria/hume/", permanent: true },
      { source: "/sell-my-caravan-region/bendigo-region/", destination: "/sell-my-caravan/victoria/bendigo/", permanent: true },
      { source: "/sell-my-caravan-region/north-west-region/", destination: "/sell-my-caravan/victoria/north-west/", permanent: true },
      { source: "/sell-my-caravan-region/warrnambool-and-south-west-region/", destination: "/sell-my-caravan/victoria/warrnambool-and-south-west/", permanent: true },
      // New South Wales
      { source: "/sell-my-caravan-region/sydney-region/", destination: "/sell-my-caravan/new-south-wales/sydney/", permanent: true },
      { source: "/sell-my-caravan-region/hunter-region/", destination: "/sell-my-caravan/new-south-wales/hunter/", permanent: true },
      { source: "/sell-my-caravan-region/coffs-harbour-region/", destination: "/sell-my-caravan/new-south-wales/coffs-harbour/", permanent: true },
      { source: "/sell-my-caravan-region/newcastle-region/", destination: "/sell-my-caravan/new-south-wales/newcastle/", permanent: true },
      { source: "/sell-my-caravan-region/southern-highlands-region/", destination: "/sell-my-caravan/new-south-wales/southern-highlands/", permanent: true },
      { source: "/sell-my-caravan-region/richmond-tweed-region/", destination: "/sell-my-caravan/new-south-wales/richmond-tweed/", permanent: true },
      { source: "/sell-my-caravan-region/central-coast-region/", destination: "/sell-my-caravan/new-south-wales/central-coast/", permanent: true },
      { source: "/sell-my-caravan-region/central-west-region/", destination: "/sell-my-caravan/new-south-wales/central-west/", permanent: true },
      { source: "/sell-my-caravan-region/mid-north-coast-region/", destination: "/sell-my-caravan/new-south-wales/mid-north-coast/", permanent: true },
      { source: "/sell-my-caravan-region/murray-region/", destination: "/sell-my-caravan/new-south-wales/murray/", permanent: true },
      { source: "/sell-my-caravan-region/new-england-region/", destination: "/sell-my-caravan/new-south-wales/new-england/", permanent: true },
      { source: "/sell-my-caravan-region/riverina-region/", destination: "/sell-my-caravan/new-south-wales/riverina/", permanent: true },
      { source: "/sell-my-caravan-region/capital-region/", destination: "/sell-my-caravan/new-south-wales/capital/", permanent: true },
      { source: "/sell-my-caravan-region/orana-region/", destination: "/sell-my-caravan/new-south-wales/orana/", permanent: true },
      { source: "/sell-my-caravan-region/illawarra-region/", destination: "/sell-my-caravan/new-south-wales/illawarra/", permanent: true },
      { source: "/sell-my-caravan-region/canberra-region/", destination: "/sell-my-caravan/new-south-wales/canberra/", permanent: true },
      // Queensland
      { source: "/sell-my-caravan-region/moreton-bay-north-region/", destination: "/sell-my-caravan/queensland/moreton-bay-north/", permanent: true },
      { source: "/sell-my-caravan-region/wide-bay-region/", destination: "/sell-my-caravan/queensland/wide-bay/", permanent: true },
      { source: "/sell-my-caravan-region/gold-coast-region/", destination: "/sell-my-caravan/queensland/gold-coast/", permanent: true },
      { source: "/sell-my-caravan-region/brisbane-region/", destination: "/sell-my-caravan/queensland/brisbane/", permanent: true },
      { source: "/sell-my-caravan-region/sunshine-coast-region/", destination: "/sell-my-caravan/queensland/sunshine-coast/", permanent: true },
      { source: "/sell-my-caravan-region/logan-beaudesert-region/", destination: "/sell-my-caravan/queensland/logan-beaudesert/", permanent: true },
      { source: "/sell-my-caravan-region/moreton-bay-south-region/", destination: "/sell-my-caravan/queensland/moreton-bay-south/", permanent: true },
      { source: "/sell-my-caravan-region/townsville-region/", destination: "/sell-my-caravan/queensland/townsville/", permanent: true },
      { source: "/sell-my-caravan-region/mackay-isaac-whitsunday-region/", destination: "/sell-my-caravan/queensland/mackay-isaac-whitsunday/", permanent: true },
      { source: "/sell-my-caravan-region/ipswich-region/", destination: "/sell-my-caravan/queensland/ipswich/", permanent: true },
      { source: "/sell-my-caravan-region/toowoomba-region/", destination: "/sell-my-caravan/queensland/toowoomba/", permanent: true },
      { source: "/sell-my-caravan-region/cairns-region/", destination: "/sell-my-caravan/queensland/cairns/", permanent: true },
      // Tasmania
      { source: "/sell-my-caravan-region/tasmania-north-west-region/", destination: "/sell-my-caravan/tasmania/north-west/", permanent: true },
      { source: "/sell-my-caravan-region/hobart-region/", destination: "/sell-my-caravan/tasmania/hobart/", permanent: true },
      { source: "/sell-my-caravan-region/launceston-region/", destination: "/sell-my-caravan/tasmania/launceston/", permanent: true },
      // South Australia
      { source: "/sell-my-caravan-region/adelaide-region/", destination: "/sell-my-caravan/south-australia/adelaide/", permanent: true },
      { source: "/sell-my-caravan-region/south-australia-south-east-region/", destination: "/sell-my-caravan/south-australia/south-east/", permanent: true },
      // Western Australia
      { source: "/sell-my-caravan-region/perth-region/", destination: "/sell-my-caravan/western-australia/perth/", permanent: true },
      { source: "/sell-my-caravan-region/mandurah-region/", destination: "/sell-my-caravan/western-australia/mandurah/", permanent: true },
      { source: "/sell-my-caravan-region/western-australia-outback-south-region/", destination: "/sell-my-caravan/western-australia/outback-south/", permanent: true },
      { source: "/sell-my-caravan-region/bunbury-region/", destination: "/sell-my-caravan/western-australia/bunbury/", permanent: true },

      // ── Blog URL redirects ────────────────────────────────────────────────
      { source: "/best-off-road-caravans-in-australia-2026/", destination: "/best-off-road-caravans-australia/", permanent: true },
    ];
  },
  async headers() {
    return [
      // ===========================================
      // HOME PAGE
      // ===========================================
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=604800",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },

      // ===========================================
      // LISTINGS PAGES - Main caching targets
      // ===========================================

      // Main listings page
      {
        source: "/listings/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },

      // All listing subpages (filters, categories, makes, etc.)
      {
        source: "/listings/:path*/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },

      // ===========================================
      // CATEGORY PAGES
      // ===========================================
      {
        source: "/:slug-category/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },

      // ===========================================
      // CONDITION PAGES
      // ===========================================
      {
        source: "/new-condition/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/used-condition/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },

      // ===========================================
      // STATE/LOCATION PAGES
      // ===========================================
      {
        source: "/:state-state/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },

      // ===========================================
      // STATIC ASSETS - Long cache
      // ===========================================
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Expires", value: farFuture },
        ],
      },

      // ===========================================
      // IMAGES - 1 year cache (cache-bust via filename/query when changed)
      // ===========================================
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Expires", value: farFuture },
        ],
      },

      // ===========================================
      // FONTS - 1 year cache
      // ===========================================
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Expires", value: farFuture },
        ],
      },

      // ===========================================
      // FAVICON & ROOT STATIC FILES
      // ===========================================
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
          { key: "Expires", value: farFuture },
        ],
      },
      {
        source: "/:file*.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Expires", value: farFuture },
        ],
      },

      // ===========================================
      // API ROUTES - No cache
      // ===========================================
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
