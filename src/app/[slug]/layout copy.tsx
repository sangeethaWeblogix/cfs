 // export const dynamic = "force-dynamic"
;

import type { Metadata } from "next";
import "./details.css";
import { ReactNode } from "react";

type RouteParams = { slug: string };

async function fetchBlogDetail(slug: string) {
  try {
    const res = await fetch(
      `https://admin.caravansforsale.com.au/wp-json/cfs/v1/blog-detail-new/?slug=${encodeURIComponent(
        slug
      )}`,
      { cache: "no-store", headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Blog fetch error:", error);
    return null;
  }
}

// ✅ SEO Metadata (title, description, canonical, OG tags)
export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
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

// ✅ Safe JSON encode for <script> tag
function safeJsonLdString(json: object) {
  return JSON.stringify(json, null, 2).replace(/</g, "\\u003c");
}

// ✅ Layout (includes structured data in head SSR)
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const data = await fetchBlogDetail(slug);
  const post = data?.data?.blog_detail || {};
  const seo = data?.seo || {};

  const canonical = `https://www.caravansforsale.com.au/${slug}/`;
  const title = seo.metatitle || post.title || "Caravans for Sale Blog";
  const description =
    seo.metadescription ||
    post.short_description ||
    "Read more on Caravans for Sale.";

  const bannerImage =
    post.banner_image ||
    post.image ||
    "https://www.caravansforsale.com.au/load.svg";

  // ✅ JSON-LD schema (Google Rich Result compatible)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    headline: title,
    description: description,
    image: {
      "@type": "ImageObject",
      url: bannerImage,
      width: 1600,
      height: 900,
    },
    author: {
      "@type": "Person",
      name: "Tom",
      url: "https://www.caravansforsale.com.au/author/tom/",
    },
    publisher: {
      "@type": "Organization",
      name: "Caravans for Sale",
      logo: {
        "@type": "ImageObject",
        url: "https://www.caravansforsale.com.au/images/cfs-logo-black.svg",
        width: 300,
        height: 60,
      },
    },
    datePublished: post.date
      ? new Date(post.date).toISOString()
      : new Date().toISOString(),
    dateModified: post.date
      ? new Date(post.date).toISOString()
      : new Date().toISOString(),
  };

  return (
    <>
      {/* ✅ Correct MIME type (no more detection issue) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdString(jsonLd),
        }}
      />
      <div>{children}</div>
    </>
  );
}



