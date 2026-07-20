 import Home from "./home/home";
import "./globals.css?=1";
import { Metadata } from "next";
import { fetchSleepBands } from "@/api/homeApi/sleep/api";
import { fetchRegion } from "@/api/homeApi/region/api";
import { fetchManufactures } from "@/api/homeApi/manufacture/api";
import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
import { fetchUsedCaravansList } from "@/api/homeApi/usedCaravanList/api";
import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRequirements } from "@/api/postRquirements/api";


export const revalidate = 86400;

  export const metadata: Metadata = {
    title: {
      default: "Caravans For Sale – Australia's Marketplace for New & Used Caravans",
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
      title: "Caravans For Sale – Australia's Marketplace for New & Used Caravans",
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
      title: "Caravans For Sale – Australia's Marketplace for New & Used Caravans",
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
   const [
     sleepBands,
     regionBands,
     manufactureBands,
     atmBands,
     lengthBands,
     priceBands,
     usedData,
     stateBands,
      requirements,
   ] = await Promise.all([
     fetchSleepBands(),
     fetchRegion(),
     fetchManufactures(),
     fetchAtmBasedCaravans(),
     fetchLengthBasedCaravans(),
     fetchPriceBasedCaravans(),
     fetchUsedCaravansList(),
     fetchStateBasedCaravans(),
     fetchRequirements(),
   ]);
   return (
     <>
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
       />
       <Home
         sleepBands={sleepBands}
       regionBands={regionBands}
       manufactureBands={manufactureBands}
       atmBands={atmBands}
       lengthBands={lengthBands}
       priceBands={priceBands}
       usedData={usedData}
       stateBands={stateBands}
       requirements={requirements}
       />
     </>
   );
 }
