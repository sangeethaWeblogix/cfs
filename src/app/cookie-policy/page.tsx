import { Metadata } from "next";
import Statement from "./statement";
import { OG_IMAGES, SOCIAL_IMAGE_URL } from "@/utils/seo/social-image";
import "./statement.css?=123";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Cookie Policy - Marketplace Network";
  const metaDescription =
    "Read our Cookie Policy for websites operated by Marketplace Network Pty Ltd (ABN 70 694 987 052), including how we collect, use, and protect your personal information.";

  const robots = "index";

  return {
    title: metaTitle,
    description: metaDescription,
    robots: robots,

    alternates: {
      canonical: "https://www.caravansforsale.com.au/cookie-policy/",
    },

    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: "https://www.caravansforsale.com.au/cookie-policy/",
      type: "article",
      images: OG_IMAGES,
    },

    twitter: {
      card: "summary_large_image",
      images: [SOCIAL_IMAGE_URL],
      title: metaTitle,
      description: metaDescription,
    },
  };
}

export default function Home() {
  return <Statement />;
}