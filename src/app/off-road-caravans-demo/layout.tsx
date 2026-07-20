import { Metadata } from "next";
import { ReactNode } from "react";
 
export const metadata: Metadata = {
  title: "Off-Road Caravans For Sale – Australia’s Best Off-Road & 4WD Caravans",
  description: "Browse off-road caravans for sale across Australia. Compare prices on rugged 4WD, hybrid and semi off-road models built for adventure and remote touring.",
  robots: "noindex, nofollow",
  alternates: {
    canonical: "https://www.caravansforsale.com.au/off-road-caravans-demo/",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
