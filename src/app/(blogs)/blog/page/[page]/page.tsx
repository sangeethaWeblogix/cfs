 // "use client" வேண்டாம் — இது Server Component
import { fetchBlogs } from "@/api/blog/api";
import BlogListClient from "./BlogListClient";
import { redirect } from "next/navigation";
import "../../blog.css?=3";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = Promise<{ page?: string }>;
 
export const metadata: Metadata = {
title: "Latest News, Reviews & Advice",
  description:
    "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  robots: "index, follow",
  openGraph: {
  title: "Latest News, Reviews & Advice",
  description:
    "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Latest News, Reviews & Advice",
    description:
      "Latest news, in-depth reviews, and expert advice on the latest in the caravan market. Stay informed and make smarter decisions.",
  },
  alternates: {
    canonical: "https://www.caravansforsale.com.au/blog/",
  },
   
};
export default async function BlogPage({ params }: { params: Params }) {
  const { page } = await params;
  const pageNum = Math.max(1, Number(page || 1));

  // page=1 இருந்தா /blog/ redirect
  if (page === "1") redirect("/blog/");

  const data = await fetchBlogs(pageNum); // ✅ Server-side — Network tab-ல் தெரியாது

  return <BlogListClient data={data} currentPage={pageNum} />;
}