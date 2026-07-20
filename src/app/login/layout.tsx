  import { Metadata } from "next";
import { ReactNode } from "react";




 export const metadata: Metadata = {
   title: "Login | Caravans For Sale – Dealer & Private Seller Access",
  description:
     "Access your CaravansForSale.com.au account. Private sellers and dealers can log in to manage listings, post caravans for sale, and connect with thousands of buyers across Australia.",
   icons: { icon: "/favicon.ico" },
   robots: "index, follow",
   verification: {
     google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
   },
   alternates: {
    canonical: "https://www.caravansforsale.com.au/login/",
   },
   
 
 };
 
   export default function Layout({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
