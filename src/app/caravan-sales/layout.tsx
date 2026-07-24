import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Caravan Sales Australia | New & Used Caravans for Sale",
  description: "Find the best caravan sales across Australia. Browse thousands of new and used caravans from trusted dealers and private sellers. Compare prices, types, and locations to find your perfect caravan.",
  robots: "index, follow",
  alternates: {
    canonical: "https://www.caravansforsale.com.au/caravan-sales/",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
