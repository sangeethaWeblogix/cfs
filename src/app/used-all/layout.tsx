 import { Metadata } from "next";
import { ReactNode } from "react";



 export const metadata: Metadata = {
   title: {
     default: "Used Caravans for Sale Australia | Dealers & Private Seller",
     template: "%s ",
   },
   description:
     "Browse thousands of used caravans for sale across Australia. Search by price, weight, length, type, brand or location from dealers and private sellers.",
   icons: { icon: "/favicon.ico" },
   robots: "noindex, nofollow",
   verification: {
     google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
   },
   alternates: {
    canonical: "https://www.caravansforsale.com.au/dealer-advertising/",
   },
   
 
 };
 
   export default function Layout({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
