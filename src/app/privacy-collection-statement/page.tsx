import { Metadata } from "next";
import Statement from "./statement";
import { OG_IMAGES, SOCIAL_IMAGE_URL } from "@/utils/seo/social-image";
import "./statement.css?=123";

export async function generateMetadata(): Promise<Metadata> {
  const metaTitle = "Privacy Collection Statement - Marketplace Network";
  const metaDescription =
    "Learn how Marketplace Network Pty Ltd collects and uses personal information when you submit enquiries or interact with our marketplace websites.";

  const robots = "index";

  return {
    title: metaTitle,
    description: metaDescription,
    robots: robots,

    alternates: {
      canonical: "https://www.caravansforsale.com.au/privacy-collection-statement/",
    },

    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: "https://www.caravansforsale.com.au/privacy-collection-statement/",
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
