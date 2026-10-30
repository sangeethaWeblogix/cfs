import { unstable_cache } from "next/cache";
import indexableUrlsData from "../../../cfs-paths/indexable-urls.json";

/**
 * Listing-page sitemaps only list URLs that are indexable, i.e. the ones in url.csv
 * (cfs-paths/indexable-urls.json is its snapshot, the same source the robots meta and
 * X-Robots-Tag use). Everything else is noindex and has no business in a sitemap.
 */
const INDEXABLE = new Set<string>(indexableUrlsData as string[]);

/** "off-road-category/", "/listings/jayco/" or "listings/jayco" → "/listings/…/" */
export function toListingPath(p: string): string {
  const rest = p.trim().replace(/^\/+/, "").replace(/^listings\/?/, "").replace(/\/+$/, "");
  return rest ? `/listings/${rest}/` : "/listings/";
}

export const isIndexableListing = (p: string): boolean => INDEXABLE.has(toListingPath(p));

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

/** WP /sitemap/<type> types of the other listing sitemaps (attributes-others is the catch-all). */
const OTHER_LISTING_TYPES = [
  "categories",
  "states",
  "regions",
  "makes",
  "atm",
  "price",
  "length",
  "category-state",
  "category-region",
];

async function fetchTypePaths(type: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/sitemap/${type}`, {
    headers: { Accept: "application/json", ...(API_KEY && { "X-Secret-Key": API_KEY }) },
  });
  const data = await res.json();
  if (!data?.success || !Array.isArray(data.paths)) throw new Error(`Invalid sitemap API response: ${type}`);
  return data.paths;
}

/**
 * url.csv URLs that none of the other listing sitemaps (nor the general sitemap's /listings/)
 * contain, in url.csv order. Throws if any lookup fails — a partial "seen" set would dump
 * already-listed URLs in here — so unstable_cache keeps serving the last good result.
 */
export const getUnmatchedIndexablePaths = unstable_cache(
  async (): Promise<string[]> => {
    const lists = await Promise.all(OTHER_LISTING_TYPES.map(fetchTypePaths));
    const seen = new Set<string>(["/listings/"]);
    for (const paths of lists) for (const p of paths) seen.add(toListingPath(p));
    return [...INDEXABLE].filter((p) => !seen.has(p));
  },
  ["sitemap-unmatched-indexable-listings"],
  { revalidate: 3600 },
);
