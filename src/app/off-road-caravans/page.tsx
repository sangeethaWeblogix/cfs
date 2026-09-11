import type { Metadata } from "next";
import Home from "./home";
import "../globals.css";
 
export const metadata: Metadata = {
  title: "Off Road Caravans Australia | Compare Models, Prices & Listings",
  description:
    "Explore off road caravans across Australia. Compare new and used listings, prices, brands, models, sizes and locations, plus expert buying guides and reviews.",
};
 import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRequirements } from "@/api/postRquirements/api";
import { fetchHomePage } from "@/api/home/api";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || "https://www.caravansforsale.com.au";

const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-Secret-Key": API_KEY } : {}),
});

type SnapshotData = {
  total_count: number;
  new_count: number;
  used_count: number;
  price_min: number;
  price_max: number;
  used_price_min: number;
  used_price_max: number;
  used_price_median: number;
  new_price_median: number;
};

async function fetchOffRoadSnapshot(): Promise<SnapshotData> {
  const empty = { total_count: 0, new_count: 0, used_count: 0, price_min: 0, price_max: 0, used_price_min: 0, used_price_max: 0, used_price_median: 0, new_price_median: 0 };
  try {
    const res = await fetch(
      `${API_BASE}/market-snapshot?category=off-road`,
      { headers: wpHeaders(), next: { revalidate: 0 } }
    );
    if (!res.ok) return empty;
    const raw = await res.text();
    // SiteGround bot-challenge pages return HTTP 200/202 with an HTML captcha
    // redirect instead of JSON — bail out to the zeroed fallback explicitly
    // instead of letting JSON.parse throw silently.
    if (raw.includes("sgcaptcha") || raw.trimStart().startsWith("<html")) {
      console.error("[off-road-caravans] market-snapshot BOT CHALLENGE blocked request");
      return empty;
    }
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    if (!json?.success) return empty;
    return {
      total_count:      json.total_count      ?? 0,
      new_count:        json.new_count        ?? 0,
      used_count:       json.used_count       ?? 0,
      price_min:        json.price_min        ?? 0,
      price_max:        json.price_max        ?? 0,
      used_price_min:   json.used_price_min   ?? 0,
      used_price_max:   json.used_price_max   ?? 0,
      used_price_median:json.used_price_median ?? 0,
      new_price_median: json.new_price_median  ?? 0,
    };
  } catch (err) {
    console.error("[off-road-caravans] market-snapshot fetch failed:", (err as any)?.message);
    return empty;
  }
}

async function fetchOffRoadBrandCounts(): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `${API_BASE}/category-makes-count?category=off-road`,
      { headers: wpHeaders(), next: { revalidate: 0 } }
    );
    if (!res.ok) return {};
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    const makes: any[] = json?.makes ?? [];
    return Object.fromEntries(makes.map((m: any) => [m.make, m.count]));
  } catch { return {}; }
}

async function fetchOffRoadStateBands(): Promise<any[]> {
  try {
    const res = await fetch(
      `${API_BASE}/off-road-state-caravans-list`,
      { headers: wpHeaders(), next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return json?.states ?? [];
  } catch { return []; }
}

// WP occasionally stores featured_image with a doubled protocol
// (e.g. "https://https://...") from a bad admin copy-paste — that malformed
// URL crashes next/image's hostname check and takes down the whole page.
const sanitizeImageUrl = (url: string): string =>
  url ? url.replace(/^(https?:\/\/)+(?=https?:\/\/)/i, "") : url;

// WP blog titles/excerpts come HTML-entity-encoded (e.g. "&#038;" for "&") —
// decode before rendering as plain text, or entities show up literally on screen.
const decodeEntities = (s = "") =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

type RawBlogItem = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  link: string;
  date: string;
  featured_image?: string;
};

function normalizeBlogItems(raw: RawBlogItem[]): any[] {
  return raw.map((p) => ({
    id: p.id,
    title: decodeEntities(p.title),
    excerpt: decodeEntities(p.excerpt),
    link: p.link,
    slug: p.slug,
    date: p.date,
    image: p.featured_image ? sanitizeImageUrl(p.featured_image) : "",
  }));
}

// The four off-road blog sections (main list, popular, by-make, by-model) all
// go through this one /blog endpoint now — differentiated only by which of
// product_category/popular/make/model is filled in.
async function fetchOffRoadBlogSection(extraParams: Record<string, string>): Promise<any[]> {
  try {
    const params = new URLSearchParams({ per_page: "20", page: "1", ...extraParams });
    const res = await fetch(
      `${API_BASE}/blog?${params.toString()}`,
      { headers: wpHeaders(), next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return normalizeBlogItems(json?.data ?? []);
  } catch { return []; }
}

const fetchOffRoadBlogs = () => fetchOffRoadBlogSection({ product_category: "off-road" });
const fetchOffRoadPopularBlogs = (seed: number) => fetchOffRoadBlogSection({ popular: "off-road", seed: String(seed) });
const fetchOffRoadBrandBlogs = (seed: number) => fetchOffRoadBlogSection({ make: "off-road", seed: String(seed) });
const fetchOffRoadModelBlogs = (seed: number) => fetchOffRoadBlogSection({ model: "off-road", seed: String(seed) });


export const revalidate = 0;

const CANONICAL = "https://www.caravansforsale.com.au/off-road-caravans/";

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": CANONICAL,
      "url": CANONICAL,
      "name": "Off Road Caravans Australia | New & Used Off Road Caravans for Sale",
      "description": "Discover Australia's largest collection of off road caravans. Compare full off road, semi off road and hybrid caravans, browse live listings, read expert reviews and explore detailed buying guides.",
      "inLanguage": "en-AU",
      "breadcrumb": { "@id": `${CANONICAL}#breadcrumb` },
      "isPartOf": { "@type": "WebSite", "url": "https://www.caravansforsale.com.au/" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${CANONICAL}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",             "item": "https://www.caravansforsale.com.au/" },
        { "@type": "ListItem", "position": 2, "name": "Off Road Caravans", "item": CANONICAL },
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is an off road caravan?",
          "acceptedAnswer": { "@type": "Answer", "text": "An off road caravan is a caravan built to handle rough, unsealed tracks and remote terrain. They typically feature heavy-duty chassis, independent suspension, reinforced bodywork, larger water and battery capacity, and off-road tyres to handle Australia's outback and bush conditions." },
        },
        {
          "@type": "Question",
          "name": "What is the difference between semi off road and full off road caravans?",
          "acceptedAnswer": { "@type": "Answer", "text": "Semi off road caravans are built for light unsealed roads and easy bush tracks, with upgraded suspension and stronger construction. Full off road caravans are engineered for extreme terrain — think river crossings, rocky tracks and remote touring — with independent suspension, heavy-duty chassis and full off-grid capability." },
        },
        {
          "@type": "Question",
          "name": "Can off road caravans go off grid?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. Most off road caravans come with or can be fitted with solar panels, lithium batteries, large fresh water tanks and composting or cassette toilets, allowing extended stays in remote areas without external power or water hookups." },
        },
        {
          "@type": "Question",
          "name": "Do I need a special vehicle to tow an off road caravan?",
          "acceptedAnswer": { "@type": "Answer", "text": "Yes. Off road caravans are heavier and wider than standard caravans. You'll need a high-capacity 4WD with a tow bar rated to the caravan's ATM. Always check the caravan's ATM and the tow vehicle's GVM and tow rating before purchasing." },
        },
        {
          "@type": "Question",
          "name": "Are off road caravans suitable for families?",
          "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. Many off road models come in family-friendly layouts with bunk beds, multiple sleeping berths, full kitchens and ensuites. Brands like Jayco, New Age and Trakmaster offer popular family off road models across a range of budgets." },
        },
        {
          "@type": "Question",
          "name": "What is the average price of an off road caravan in Australia?",
          "acceptedAnswer": { "@type": "Answer", "text": "Off road caravan prices in Australia typically range from around $40,000 for entry-level semi off road models to over $150,000 for premium full off road expedition caravans. The most popular mid-range models sit between $60,000 and $100,000." },
        },
      ],
    },
  ],
};

export default async function OffRoadCaravansDemoPage() {
  const seed = Math.floor(Math.random() * 7) + 1;

  const [
    stateBands,
    requirements,
    homeblog,
    snapshot,
    offRoadBlogs,
    offRoadPopularBlogs,
    offRoadBrandBlogs,
    offRoadModelBlogs,
    offRoadStateBands,
    offRoadBrandCounts,
  ] = await Promise.all([
    fetchStateBasedCaravans(),
    fetchRequirements(),
    fetchHomePage(),
    fetchOffRoadSnapshot(),
    fetchOffRoadBlogs(),
    fetchOffRoadPopularBlogs(seed),
    fetchOffRoadBrandBlogs(seed),
    fetchOffRoadModelBlogs(seed),
    fetchOffRoadStateBands(),
    fetchOffRoadBrandCounts(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <Home
      stateBands={offRoadStateBands.length > 0 ? offRoadStateBands : stateBands}
      requirements={requirements}
      homeblog={homeblog?.latest_posts ?? []}
      offRoadCount={snapshot.total_count}
      offRoadNewCount={snapshot.new_count}
      offRoadUsedCount={snapshot.used_count}
      offRoadPriceMin={snapshot.price_min}
      offRoadPriceMax={snapshot.price_max}
      offRoadUsedPriceMin={snapshot.used_price_min}
      offRoadUsedPriceMax={snapshot.used_price_max}
      offRoadUsedPriceMedian={snapshot.used_price_median}
      offRoadNewPriceMedian={snapshot.new_price_median}
      offRoadBlogs={offRoadBlogs}
      offRoadPopularBlogs={offRoadPopularBlogs}
      offRoadBrandBlogs={offRoadBrandBlogs}
      offRoadModelBlogs={offRoadModelBlogs}
      offRoadBrandCounts={offRoadBrandCounts}
    />
    </>
  );
}
