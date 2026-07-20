import React, { ReactNode } from "react";
import "./listings.css?=7";
import { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  // title intentionally omitted — listings/page.tsx sets it for /listings/,
  // and [...slug]/layout.tsx uses title:null to let root layout JSX inject per-slug title
  description:
      "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
  robots: "noindex, nofollow",
  openGraph: {
    title: "Caravans for Sale in Australia",
    description:
      "Browse caravans for sale across Australia. Compare new and used caravans including off road, hybrid, family and pop top caravans from dealers and private sellers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravans for Sale in Australia ",
    description:
      "Browse caravans for sale across Australia. Compare new and used caravans including off road, hybrid, family and pop top caravans from dealers and private sellers.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/listings",
  },
  verification: {
    google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ add here
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
