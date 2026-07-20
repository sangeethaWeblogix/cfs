 import { Metadata } from "next";
import { ReactNode } from "react";



 export const metadata: Metadata = {
   title: {
     default: "Privacy Policy – Marketplace Network",
     template: "%s ",
   },
   description:
     "Read the Privacy Policy for websites operated by Marketplace Network Pty Ltd (ABN 70 694 987 052), including how we collect, use, and protect your personal information.",
   icons: { icon: "/favicon.ico" },
   robots: "index",
   verification: {
     google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
   },
   alternates: {
    canonical: "https://www.caravansforsale.com.au/privacy-policy/",

   },
   
   openGraph: {
      url: "https://www.caravansforsale.com.au/privacy-policy/",
     title: "Privacy Policy - caravansforsale.com.au - Caravan Marketplace",
       description:
     "Learn about Caravan Marketplace's privacy policy on data collection, usage, security measures, and your rights regarding your information.",
     
   },
 };
 
   export default function Layout({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
