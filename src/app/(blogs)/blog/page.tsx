import Blogs from "./page/[page]/BlogListClient";
import "./blog.css?=3";
import { Metadata } from "next";
import { fetchBlogs } from "@/api/blog/api";

export const metadata: Metadata = {
  title: { default: "Latest News, Reviews & Advice", template: "%s " },
  description:
    "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  icons: { icon: "/favicon.ico" },
  robots: "index, follow",
  alternates: {
    canonical: "https://www.caravansforsale.com.au/blog/",

   },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const data = await fetchBlogs(1);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Caravans for Sale Blog",
      description:
        "Latest news, in-depth reviews, and expert advice on the latest in the caravan market.",
      url: "https://www.caravansforsale.com.au/blog/",
      publisher: {
        "@type": "Organization",
        name: "Caravans for Sale",
        url: "https://www.caravansforsale.com.au",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.caravansforsale.com.au/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.caravansforsale.com.au/blog/" },
      ],
    },
    ...(data.items.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Latest Blog Posts",
            itemListElement: data.items.map((post, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: post.link,
              name: post.title,
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Blogs data={data} currentPage={1} />
    </>
  );
}
