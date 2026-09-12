import type { Metadata } from "next";
import Home from "./home";
import "../globals.css";

export const metadata: Metadata = {
  title: "Off Road Caravan Types Compared | Semi, Full, Hybrid & Extreme",
  description:
    "Compare semi, full, extreme and hybrid off road caravans in Australia. Understand terrain capability, towing, weight, construction and off-grid features.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.caravansforsale.com.au/off-road-caravan-types/" },
};

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;

const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-Secret-Key": API_KEY } : {}),
});

type SnapshotData = {
  total_count: number;
  new_count: number;
  used_count: number;
  used_price_median: number;
  new_price_median: number;
};

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

async function fetchPopularBlogs(seed: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${API_BASE}/blog?per_page=12&page=1&popular=off-road&seed=${seed}`,
      { headers: wpHeaders(), next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    const items: RawBlogItem[] = json?.data ?? [];
    return items.map((p) => ({
      id: p.id,
      title: decodeEntities(p.title),
      excerpt: decodeEntities(p.excerpt),
      link: p.link,
      slug: p.slug,
      date: p.date,
      image: p.featured_image ? sanitizeImageUrl(p.featured_image) : "",
    }));
  } catch { return []; }
}

async function fetchOffRoadSnapshot(): Promise<SnapshotData> {
  const empty = { total_count: 0, new_count: 0, used_count: 0, used_price_median: 0, new_price_median: 0 };
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
      console.error("[off-road-caravan-types] market-snapshot BOT CHALLENGE blocked request");
      return empty;
    }
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    if (!json?.success) return empty;
    return {
      total_count:       json.total_count      ?? 0,
      new_count:         json.new_count        ?? 0,
      used_count:        json.used_count       ?? 0,
      used_price_median: json.used_price_median ?? 0,
      new_price_median:  json.new_price_median  ?? 0,
    };
  } catch (err) {
    console.error("[off-road-caravan-types] market-snapshot fetch failed:", (err as any)?.message);
    return empty;
  }
}

export const revalidate = 0;

export default async function OffRoadCaravanTypesPage() {
  const seed = Math.floor(Math.random() * 100000);
  const [snapshot, popularBlogs] = await Promise.all([
    fetchOffRoadSnapshot(),
    fetchPopularBlogs(seed),
  ]);
  return <Home snapshot={snapshot} popularBlogs={popularBlogs} />;
}
