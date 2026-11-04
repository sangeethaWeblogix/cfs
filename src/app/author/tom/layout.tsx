
  import { Metadata } from 'next';
import "./author.css";
import { OG_IMAGES, SOCIAL_IMAGE_URL } from "@/utils/seo/social-image";
import { ReactNode } from 'react';


 export const metadata: Metadata = {
title: "Latest News, Reviews & Advice",
  description:
    "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  robots: "index, follow",
  openGraph: {
  type: "website",
  url: "https://www.caravansforsale.com.au/author/tom/",
  images: OG_IMAGES,
  title: "Latest News, Reviews & Advice",
  description:
    "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  },
  twitter: {
    card: "summary_large_image",
    images: [SOCIAL_IMAGE_URL],
    title: "Latest News, Reviews & Advice",
    description:
      "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/author/tom/",
  },
   
};
 export default function Layout({ children }: { children: ReactNode }) {
   return <div>{children}</div>;
 }
 