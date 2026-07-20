import type { Metadata } from "next";
import StateHome from "../home";
import { parseDemoFilters } from "../urlUtils";
import { fetchDemoSeo } from "../fetchDemoSeo";
import "../../globals.css";

export const revalidate = 86400;

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
  const filters = parseDemoFilters(slug ?? [], query);
  const seo = await fetchDemoSeo(filters);

  return {
    title: seo?.meta_title || "Caravans for Sale in Victoria | CaravansForSale.com.au",
    description: seo?.meta_description || "Browse new and used caravans for sale in Victoria from dealers and private sellers.",
    robots: { index: false, follow: false },
  };
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

  return <StateHome initialFilters={initialFilters} />;
}
