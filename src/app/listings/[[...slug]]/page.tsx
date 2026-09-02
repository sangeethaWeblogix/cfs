import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import StateHome from "../home";
import { parseDemoFilters, buildListingsSlug } from "../urlUtils";
import { metaFromSlug } from "@/utils/seo/meta";
import { fetchBrowseSectionData, fetchGroupCountsServer } from "../fetchBrowseSectionData";
import { fetchInitialPool } from "../fetchInitialPool";
import { fetchProductList, fetchMakeDetails } from "@/api/productList/api";
import { buildCategoryCountScope, buildMakeCountScope } from "../paramsCountScope";
import "../../globals.css";

export const revalidate = 86400;

// Cache the indexed-URL set for the lifetime of this server instance
// (same approach as /api/indexed-url/route.ts — read once, never re-read).
let _indexedPaths: Set<string> | null = null;
function isPathIndexed(urlPath: string): boolean {
  if (!_indexedPaths) {
    const csvPath = path.join(process.cwd(), "src", "app", "url.csv");
    const raw = fs.readFileSync(csvPath, "utf-8");
    const set = new Set<string>();
    for (const line of raw.split("\n").slice(1)) {
      const u = line.split("\t")[1];
      if (u) set.add(u.replace(/^https?:\/\/[^/]+/, "").trim().toLowerCase().replace(/\/+$/, ""));
    }
    _indexedPaths = set;
  }
  const normalized = urlPath.trim().toLowerCase().replace(/\/+$/, "");
  return _indexedPaths.has(normalized);
}

type Params = Promise<{ slug?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const slugArr = slug ?? [];
  const meta = await metaFromSlug(slugArr, query);
  // Only title is returned here — description/canonical/robots/og/twitter are
  // injected directly into <head> JSX by the root layout (see src/app/layout.tsx)
  // to avoid the Next.js 15 async-metadata + streaming = metadata-in-body issue.
  return { title: meta.title };
}

export default async function LocationStateDemoPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const initialFilters = parseDemoFilters(slug ?? [], query);
  console.log("[listings/[[...slug]]/page.tsx] slug:", slug, "query:", query, "initialFilters:", initialFilters);

  // Determine isIndexed server-side so fetchInitialPool buckets products
  // correctly (featured/new/used split vs combined grid) from the first byte.
  // Without this, SSR always uses isIndexed=true and the client-side
  // /api/indexed-url/ check then triggers a second pool fetch to fix the layout.
  const canonicalPath = buildListingsSlug(initialFilters);
  const isIndexed = isPathIndexed(canonicalPath);

  // shuffle_seed is injected by the HTML cache warmer (e.g. ?shuffle_seed=3) so
  // each KV HTML variant gets a genuinely different product pool from WordPress.
  const shuffleSeed = typeof query.shuffle_seed === "string"
    ? (parseInt(query.shuffle_seed, 10) || 0)
    : 0;

  // Category/make counts, scoped to initialFilters via the exact same
  // buildCategoryCountScope/buildMakeCountScope StateFilterBar uses client-side
  // — so whatever filters this URL landed on, the server fetches the identical
  // query the client would have fetched on mount, and StateFilterBar's
  // isInitialFilters guard skips the redundant client refetch.
  const categoryCountScope = Object.fromEntries(buildCategoryCountScope(initialFilters));
  const makeCountScope = Object.fromEntries(buildMakeCountScope(initialFilters));

  const [browseData, initialPool, productList, makeOptions, categoryCounts, makeCounts] = await Promise.all([
    fetchBrowseSectionData(initialFilters),
    fetchInitialPool(initialFilters, isIndexed, shuffleSeed),
    fetchProductList(),
    fetchMakeDetails(),
    fetchGroupCountsServer("category", categoryCountScope),
    fetchGroupCountsServer("make", makeCountScope),
  ]);

  return (
    <StateHome
      initialFilters={initialFilters}
      browseData={browseData}
      initialPool={initialPool}
      serverIsIndexed={isIndexed}
      initialCategories={productList?.data?.all_categories ?? []}
      initialStates={productList?.data?.states ?? []}
      initialMakes={makeOptions}
      initialCategoryCounts={categoryCounts}
      initialMakeCounts={makeCounts}
    />
  );
}
