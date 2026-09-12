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
  common_length: string;
  median_atm: number;
  common_sleeps: number;
};

// most_common_length comes back as a band key ("18_to_20", "under_16",
// "22_plus") — reduce it to the single short value the stat card shows.
function formatCommonLength(band?: string): string {
  if (!band) return "";
  if (band === "22_plus") return "22ft+";
  const match = band.match(/^(\d+)/) ?? band.match(/^under_(\d+)/);
  return match ? `${match[1]}ft` : "";
}

async function fetchOffRoadSnapshot(): Promise<SnapshotData> {
  const empty = {
    total_count: 0, new_count: 0, used_count: 0, price_min: 0, price_max: 0,
    used_price_min: 0, used_price_max: 0, used_price_median: 0, new_price_median: 0,
    common_length: "", median_atm: 0, common_sleeps: 0,
  };
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
      common_length:    formatCommonLength(json.most_common_length),
      median_atm:       json.median_atm_all    ?? 0,
      common_sleeps:    json.most_common_sleep ?? 0,
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
      `${API_BASE}/off-road-by-state`,
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
      offRoadCommonLength={snapshot.common_length}
      offRoadMedianAtm={snapshot.median_atm}
      offRoadCommonSleeps={snapshot.common_sleeps}
      offRoadBlogs={offRoadBlogs}
      offRoadPopularBlogs={offRoadPopularBlogs}
      offRoadBrandBlogs={offRoadBrandBlogs}
      offRoadModelBlogs={offRoadModelBlogs}
      offRoadBrandCounts={offRoadBrandCounts}
    />
  );
}
