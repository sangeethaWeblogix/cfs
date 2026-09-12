import ThemeRegistry from "../components/ThemeRegistry";
import { Metadata } from "next";
import "./details.css";
import { ReactNode } from "react";
import Thankyou from './ThankYouClient '
import { fetchBlogDetail } from "./fetchBlogDetail";
import { isNonBlogSlug } from "@/utils/isNonBlogSlug";
type RouteParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (isNonBlogSlug(slug)) {
    return { robots: "noindex, nofollow" };
  }

    if (slug.startsWith("thank-you-")) {
    return {
      title: "Thank You",
      description: "Thank you for submitting your form.",
    };
  }
  const data = await fetchBlogDetail(slug);
  const seo = data?.seo ?? {};
  const post = data?.data?.blog_detail || {};

  const title = seo.metatitle || post.title || "Caravans for Sale Blog";
  const description =
    seo.metadescription ||
    post.short_description ||
    "Read more on Caravans for Sale.";
  const canonical = `https://www.caravansforsale.com.au/${slug}/`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<RouteParams>;
}) {
     const { slug } = await params;

  /** 🛑 STOP BLOG FETCH FOR NON-BLOG SLUGS (favicons, crawler probes, etc.) **/
  if (isNonBlogSlug(slug)) {
    return <ThemeRegistry>{children}</ThemeRegistry>;
  }

  /** 🛑 STOP BLOG FETCH FOR THANK-YOU PAGES **/
  if (slug.startsWith("thank-you-")) {
    return (
      <ThemeRegistry>
        <Thankyou />
      </ThemeRegistry>
    );
  }

  return (
    <ThemeRegistry>
      <div>{children}</div>
    </ThemeRegistry>
  );
}
