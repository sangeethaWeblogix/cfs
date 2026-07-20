
  // export const dynamic = "force-dynamic"

  import "bootstrap/dist/css/bootstrap.min.css";
  import "bootstrap-icons/font/bootstrap-icons.css";
  import "./globals.css?=41";
  import Navbar from "./navbar/Navbar";
  import NavbarSkeleton from "./navbar/NavbarSkeleton";
  import Footer from "./footer/Footer";
  import React, { Suspense } from "react";
  import Script from "next/script";
  import { Metadata } from "next";
  import { Montserrat } from "next/font/google";
  import ScrollToTop from "./navigation/ScrollToTopGlobal";
  import UTMTracker from "./UTMTracker";
  // import NextTopLoader from "nextjs-toploader";
import NavigationHistory from "@/components/NavigationHistory";
import { BannerProvider } from "@/components/BannerHandler";
import GlobalErrorTracker from "@/components/GlobalErrorTracker";
import { headers } from "next/headers";
import { metaFromSlug } from "@/utils/seo/meta";
import { fetchProductMeta } from "@/utils/fetchProductMeta";
import fetchListingsForHead, { buildListingsJsonLd, buildBreadcrumbs } from "@/utils/fetchListingsHead";

  const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    display: "swap",
    variable: "--font-montserrat",
    preload: true,
  });

  
  export const metadata: Metadata = {
    icons: { icon: "/favicon.ico" },
    // robots: "index, follow",
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
    },

  };
  
  
  export default async function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    // Per-slug metadata for /listings/* pages — injected directly into <head> JSX
    // (avoids async generateMetadata + streaming = metadata-in-body issue in Next.js 15)
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "";
    const xRobots = h.get("x-robots") ?? "";
    const isListingSlug =
      pathname.startsWith("/listings/") &&
      pathname !== "/listings/" &&
      pathname !== "/listings";

    let slugTitle = "";
    let slugDescription = "";
    let slugCanonical = "";
    let slugRobots = "";

    const isProductPage =
      pathname.startsWith("/product/") &&
      pathname !== "/product/" &&
      pathname !== "/product";

    const isContactPage = pathname === "/contact/" || pathname === "/contact";
    const isMainListings = pathname === "/listings/" || pathname === "/listings";

    // Static pages whose metadata ends up after </head> due to streaming — inject directly
    const STATIC_META: Record<string, { title: string; description: string; canonical: string }> = {
      "/caravan-manufacturers/": {
        title: "Top 10 Caravan Manufacturers in Australia: Best Brands of 2024",
        description: "See how top Australian caravan manufacturers excel with the best in innovative designs, quality construction, cost efficiency, and expert craftsmanship.",
        canonical: "https://www.caravansforsale.com.au/caravan-manufacturers/",
      },
      "/off-road-caravans-manufacturers/": {
        title: "Top Off-Road Caravan Manufacturers in Australia: Best Brands 2024",
        description: "Discover Australia's leading off-road caravan manufacturers. Compare top brands known for rugged build quality, innovative design, and outback-ready performance.",
        canonical: "https://www.caravansforsale.com.au/off-road-caravans-manufacturers/",
      },
    };
    const staticMeta = STATIC_META[pathname] ?? null;

    let productMeta = { title: "", description: "", canonical: "", ogImage: "" };

    if (isProductPage) {
      const slug = pathname.replace(/^\/product\//, "").replace(/\/$/, "");
      productMeta = await fetchProductMeta(slug);
    }

    // Listings JSON-LD — fetched here so both schemas render inside <head>
    // Second call hits Next.js data cache (revalidate: 3600), no extra network round-trip.
    let listingsCollectionLd: object | null = null;
    let listingsSearchResultsLd: object | null = null;
    if (isMainListings || isListingSlug) {
      const normalizedPath = pathname.endsWith("/") ? pathname : pathname + "/";
      const listingsData = await fetchListingsForHead(normalizedPath);
      if (listingsData) {
        const crumbs = buildBreadcrumbs(pathname);
        const pageUrl = `https://www.caravansforsale.com.au${normalizedPath}`;
        const { collectionPageLd, searchResultsLd } = buildListingsJsonLd(
          listingsData,
          pageUrl,
          crumbs
        );
        listingsCollectionLd = collectionPageLd;
        listingsSearchResultsLd = searchResultsLd;
      }
    }

    if (isListingSlug) {
      const slugString = pathname.replace(/^\/listings\//, "").replace(/\/$/, "");
      const slugParts = slugString.split("/").filter(Boolean);

      // Middleware signals 0 products via x-robots: noindex — use it directly, no API call needed
      if (xRobots === "noindex") {
        slugRobots = "noindex";
        slugCanonical = `https://www.caravansforsale.com.au/listings/${slugParts.join("/")}/`;
        slugDescription = "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.";
      } else {
        // try {
          // All SEO from metaFromSlug — pure computation, no API call
          const meta = await metaFromSlug(slugParts, {});
          slugCanonical = (meta.alternates?.canonical as string) ?? "";
          if (meta.robots && typeof meta.robots === "object" && "index" in meta.robots) {
            slugRobots = (meta.robots as { index: boolean }).index ? "index, follow" : "noindex";
          } else {
            slugRobots = "index, follow";
          }
          if (meta.title && typeof meta.title === "object" && "absolute" in meta.title) {
            slugTitle = (meta.title as { absolute: string }).absolute;
          }
          slugDescription = "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.";
        // } catch {
        //   const parts = slugParts
        //     .map((p: string) =>
        //       p.replace(/-(category|state|region|condition|search|suburb)$/, "")
        //        .replace(/-/g, " ")
        //        .replace(/\b\w/g, (c: string) => c.toUpperCase())
        //     )
        //     .filter(Boolean);
        //   slugTitle = parts.length
        //     ? `${parts.join(" ")} Caravans for Sale in Australia`
        //     : "Caravans for Sale in Australia";
        //   slugCanonical = `https://www.caravansforsale.com.au/listings/${slugParts.join("/")}/`;
        //   slugDescription = "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.";
        //   slugRobots = "index, follow";
        // }
      }
    }

    return (
      <html lang="en">
        <head>
          {/* Static pages SEO — injected here to avoid metadata-in-body streaming issue */}
          {staticMeta && <title>{staticMeta.title}</title>}
          {staticMeta && <meta name="description" content={staticMeta.description} />}
          {staticMeta && <link rel="canonical" href={staticMeta.canonical} />}
          {staticMeta && <meta name="robots" content="index, follow" />}
          {staticMeta && <meta property="og:title" content={staticMeta.title} />}
          {staticMeta && <meta property="og:description" content={staticMeta.description} />}
          {staticMeta && <meta property="og:url" content={staticMeta.canonical} />}
          {staticMeta && <meta name="twitter:title" content={staticMeta.title} />}
          {staticMeta && <meta name="twitter:description" content={staticMeta.description} />}
          {/* Product page SEO — injected here to avoid metadata-in-body streaming issue */}
          {isProductPage && productMeta.title && <title>{productMeta.title}</title>}
          {isProductPage && productMeta.description && <meta name="description" content={productMeta.description} />}
          {isProductPage && productMeta.canonical && <link rel="canonical" href={productMeta.canonical} />}
          {isProductPage && <meta name="robots" content="index, follow" />}
          {isProductPage && productMeta.title && <meta property="og:title" content={productMeta.title} />}
          {isProductPage && productMeta.description && <meta property="og:description" content={productMeta.description} />}
          {isProductPage && productMeta.ogImage && <meta property="og:image" content={productMeta.ogImage} />}
          {isProductPage && productMeta.canonical && <meta property="og:url" content={productMeta.canonical} />}
          {isProductPage && productMeta.title && <meta name="twitter:title" content={productMeta.title} />}
          {isProductPage && productMeta.description && <meta name="twitter:description" content={productMeta.description} />}
          {/* Per-slug SEO tags for /listings/* — rendered before streaming starts */}
          {/* <title> is set by generateMetadata in [...slug]/page.tsx via fast metaFromSlug (no API call) */}
          {isListingSlug && slugDescription && <meta name="description" content={slugDescription} />}
          {isListingSlug && slugCanonical && <link rel="canonical" href={slugCanonical} />}
          {isListingSlug && <meta name="robots" content={slugRobots} />}
          {isListingSlug && slugTitle && <meta property="og:title" content={slugTitle} />}
          {isListingSlug && slugDescription && <meta property="og:description" content={slugDescription} />}
          {isListingSlug && slugCanonical && <meta property="og:url" content={slugCanonical} />}
          {isListingSlug && slugTitle && <meta name="twitter:title" content={slugTitle} />}
          {isListingSlug && slugDescription && <meta name="twitter:description" content={slugDescription} />}
          {/* Contact page JSON-LD */}
          {isContactPage && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@graph": [
                    {
                      "@type": "WebSite",
                      "@id": "https://www.caravansforsale.com.au/#website",
                      "url": "https://www.caravansforsale.com.au/",
                      "name": "Caravans For Sale",
                      "alternateName": "Caravans For Sale by Marketplace Network",
                    },
                    {
                      "@type": "Organization",
                      "@id": "https://www.caravansforsale.com.au/#organization",
                      "name": "Marketplace Network Pty Ltd",
                      "legalName": "Marketplace Network Pty Ltd",
                      "taxID": "ABN 70 694 987 052",
                      "url": "https://www.caravansforsale.com.au/",
                      "logo": {
                        "@type": "ImageObject",
                        "url": "https://www.caravansforsale.com.au/images/cfs-logo-black.svg",
                        "caption": "Caravans For Sale by Marketplace Network",
                      },
                      "contactPoint": {
                        "@type": "ContactPoint",
                        "contactType": "customer service",
                        "url": "https://www.caravansforsale.com.au/contact/",
                        "availableLanguage": "en",
                        "areaServed": "AU",
                      },
                    },
                    {
                      "@type": "ContactPage",
                      "@id": "https://www.caravansforsale.com.au/contact/#webpage",
                      "url": "https://www.caravansforsale.com.au/contact/",
                      "name": "Contact Us | Get in Touch with Caravans For Sale",
                      "isPartOf": { "@id": "https://www.caravansforsale.com.au/#website" },
                      "about": { "@id": "https://www.caravansforsale.com.au/#organization" },
                      "description": "Have a question about buying, selling, or dealer advertising solutions? Fill out our online contact form to get in touch with the Caravans For Sale customer support team.",
                      "breadcrumb": { "@id": "https://www.caravansforsale.com.au/contact/#breadcrumb" },
                    },
                    {
                      "@type": "BreadcrumbList",
                      "@id": "https://www.caravansforsale.com.au/contact/#breadcrumb",
                      "itemListElement": [
                        {
                          "@type": "ListItem",
                          "position": 1,
                          "name": "Home",
                          "item": "https://www.caravansforsale.com.au/",
                        },
                        {
                          "@type": "ListItem",
                          "position": 2,
                          "name": "Contact Us",
                          "item": "https://www.caravansforsale.com.au/contact/",
                        },
                      ],
                    },
                  ],
                }),
              }}
            />
          )}
          {/* Listings page JSON-LD — CollectionPage + BreadcrumbList */}
          {listingsCollectionLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(listingsCollectionLd) }}
            />
          )}
          {/* Listings page JSON-LD — SearchResultsPage with product list */}
          {listingsSearchResultsLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(listingsSearchResultsLd) }}
            />
          )}
          {/* ✅ Google Tag Manager (Head) */}
          <Script
            id="gtm-head"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){
                  w[l]=w[l]||[];
                  w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
                  var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),
                    dl=l!='dataLayer'?'&l='+l:'';
                  j.async=true;
                  j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                  f?f.parentNode.insertBefore(j,f):d.head.appendChild(j);
                })(window,document,'script','dataLayer','GTM-N3362FGQ');
              `,
            }}
          />



        </head>
        <body
          className={`flex flex-col min-h-screen new_font ${montserrat.className}`}
        >
          {/* ✅ Google Tag Manager (noscript) - right after body */}
         <noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-N3362FGQ"
    height="0"
    width="0"
    style={{ display: "none", visibility: "hidden" }}
  />
</noscript>

  
         <Suspense fallback={null}>
  <UTMTracker />
</Suspense>
<Suspense fallback={null}>
  <NavigationHistory />
</Suspense>
<Suspense fallback={<NavbarSkeleton />}>
  <Navbar />
</Suspense>
                  <Suspense fallback={null}>

          <ScrollToTop />
          </Suspense>
          <main className="product-page style-5 flex-1">
            {/* <NextTopLoader
          color="#ff6600"
          height={3}
          showSpinner={false}
        /> */}
          <GlobalErrorTracker />
          <BannerProvider>
          {children}
          </BannerProvider>
                    </main>
          <Footer />
        </body>
      </html>
      
    );
  }
  