// export const dynamic = "force-dynamic"
;

import Header from "./Header";
import Middle from "./Middle";
import FaqSection from "./FaqSection";
import "./comman.css?=1";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caravan Manufacturers in Australia | Brands & Builders",
  description:
    "Explore caravan manufacturers across Australia. Find trusted builders of off-road, luxury, hybrid, pop top and touring caravans for every budget and lifestyle.",
  robots: "index, follow",
  alternates: {
    canonical: "https://www.caravansforsale.com.au/caravan-manufacturers/",
  },
  openGraph: {
    title: "Caravan Manufacturers in Australia | Brands & Builders",
    description:
      "Explore caravan manufacturers across Australia. Find trusted builders of off-road, luxury, hybrid, pop top and touring caravans for every budget and lifestyle.",
    url: "https://www.caravansforsale.com.au/caravan-manufacturers/",
    images: [
      {
        url: "https://www.caravansforsale.com.au/images/cfs-logo.png",
        width: 800,
        height: 600,
        alt: "Caravan Manufacturers Australia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravan Manufacturers in Australia | Brands & Builders",
    description:
      "Explore caravan manufacturers across Australia. Find trusted builders of off-road, luxury, hybrid, pop top and touring caravans for every budget and lifestyle.",
  },
};

export default function Home() {
  return (
    <div>
      <Header />
      <Middle />
      <FaqSection />
    </div>
  );
}
