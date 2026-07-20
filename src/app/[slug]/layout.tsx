import ThemeRegistry from "../components/ThemeRegistry";
import { Metadata } from "next";
import "./details.css";
import { ReactNode } from "react";
import Thankyou from './ThankYouClient '
import { fetchBlogDetail } from "./fetchBlogDetail";
type RouteParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;

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

 
function safeJsonLdString(json: object) {
  return JSON.stringify(json, null, 2).replace(/</g, "\\u003c");
}

function safeIso(dateStr?: string) {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}


export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<RouteParams>;
}) {
     const { slug } = await params;


  /** 🛑 STOP BLOG FETCH FOR THANK-YOU PAGES **/
  if (slug.startsWith("thank-you-")) {
    return (
      <ThemeRegistry>
        <Thankyou />
      </ThemeRegistry>
    );
  }

  /** ✅ SAFE BLOG FETCH FOR NORMAL PAGES **/
  const data = await fetchBlogDetail(slug);

  const post = data?.data?.blog_detail ?? {};
  const seo = data?.seo ?? {};
  const faqs: { heading: string; content: string }[] = data?.data?.blog_detail?.faq ?? [];

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

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      headline: title,
      description: description,
      image: bannerImage,
      author: { "@type": "Person", name: "Tom" },
      publisher: { "@type": "Organization", name: "Caravans for Sale" },
      datePublished: safeIso(post.date),
      dateModified: safeIso(post.date),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.caravansforsale.com.au/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.caravansforsale.com.au/blog/" },
        { "@type": "ListItem", position: 3, name: title, item: canonical },
      ],
    },
    ...(faqs.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.heading,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.content.replace(/<[^>]*>/g, "").trim(),
              },
            })),
          },
        ]
      : []),
  ];

  return (
    <ThemeRegistry>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(schemas) }}
      />
      <div>{children}</div>
    </ThemeRegistry>
  );
}
