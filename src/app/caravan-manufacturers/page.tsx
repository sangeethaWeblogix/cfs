// export const dynamic = "force-dynamic"
;

import Header from "./Header";
import Middle from "./Middle";
import FaqSection from "./FaqSection";
import "./comman.css?=1";
import type { Metadata } from "next";

// Title, description, canonical, robots and the og/twitter text are injected into <head> by
// STATIC_META in app/layout.tsx (this route's metadata streams in after </head>), so repeating
// them here produced duplicate tags. Only what STATIC_META does not render stays here.
export const metadata: Metadata = {
  openGraph: {
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
