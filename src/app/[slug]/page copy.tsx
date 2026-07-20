 import type { Metadata } from "next";
import DeatilsPage from "./details";

import "./details.css";
import { Card, CardContent, Typography, Button } from "@mui/material";
import Link from "next/link";
import TickIcon from "../../../public/images/tick.jpg";
import Image from "next/image";
import { redirect } from "next/navigation"; // ✅ Import notFound

type RouteParams = { slug: string };
type PageProps = { params: Promise<RouteParams> };

async function fetchBlogDetail(slug: string) {
  try {
    const res = await fetch(
      `https://admin.caravansforsale.com.au/wp-json/cfs/v1/blog-detail-new/?slug=${encodeURIComponent(
        slug
      )}`,
      { cache: "no-store", headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      return null; // ❌ Don't throw error, return null
    }

    return res.json();
  } catch (error) {
    console.error("Blog fetch error:", error);
    return null; // ❌ Return null on fetch failure
  }
}

// ✅ SEO from product.seo (NO images)
export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug.startsWith("thank-you-")) {
    return {
      title: "Thank You",
      description: "Your enquiry was submitted successfully.",
      robots: "noindex, nofollow",
      verification: {
        google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ Google site verification
      },
      alternates: {
        canonical: `https://www.caravansforsale.com.au/${slug}/`,
      },
    };
  }
  const data = await fetchBlogDetail(slug);

  const seo = data?.seo ?? data?.product?.seo ?? {};
  const title =
    seo.metatitle ||
    seo.meta_title ||
    data?.title ||
    data?.name ||
    "Product - Caravans for Sale";

  const description =
    seo.metadescription ||
    seo.meta_description ||
    data?.short_description ||
    "View caravan details.";
  const robots = "index, follow";
  const canonicalUrl = `https://www.caravansforsale.com.au/${slug}/`;

  return {
    title,
    description,
    robots,
    alternates: {
      canonical: canonicalUrl, // ✅ canonical link
    },
    verification: {
      google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo", // ✅ this auto generates <meta name="google-site-verification" />
    },
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary", // no image card
      title,
      description,
    },
    other: {
      "og:type": "blog",
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  if (slug.startsWith("thank-you-")) {
    return (
      <div
        style={{
          minHeight: "80vh", // keeps space between header and footer
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: 5,
            maxWidth: 500,
            textAlign: "center",
          }}
        >
          <CardContent>
            <div
              style={{
                width: 80,
                height: 80,
                margin: "0 auto 20px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src={TickIcon}
                alt="Success"
                width={40}
                height={40}
                style={{ objectFit: "contain" }}
              />
            </div>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Thank you for submitting your information with{" "}
              <span style={{ color: "#000" }}>caravansforsale.com.au</span>.
            </Typography>

            <Typography variant="body1" color="text.secondary" gutterBottom>
              Your caravan dealer will contact you as soon as possible.
            </Typography>

            <Link href="/" style={{ textDecoration: "none" }}>
              <Button
                variant="contained"
                sx={{
                  mt: 3,
                  backgroundColor: "orange", // Set background to orange
                  color: "white", // Make text white
                  "&:hover": {
                    backgroundColor: "#ec7200", // Darker orange on hover
                  },
                }}
              >
                Go back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  const data = await fetchBlogDetail(slug);
  if (!data) {
    redirect("/404"); // ✅ Show Next.js 404 page
  }

  return (
    <div>
      <DeatilsPage data={data} />
    </div>
  );
}