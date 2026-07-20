import { Metadata } from "next";
import { notFound } from "next/navigation";
import RegionSeller from "../../../sell-my-caravan-region/RegionSeller";
import "../../seller-demo.css";
import {
  ALL_REGIONS,
  getRegionByStateAndPageSlug,
  buildRegionMetadata,
  buildRegionJsonLd,
} from "../../../sell-my-caravan-region/regions-data";

export const dynamicParams = true;

type RouteParams = { state: string; region: string };
type PageProps = { params: Promise<RouteParams> };

export async function generateStaticParams() {
  return ALL_REGIONS.map((r) => ({
    state: r.state.slug,
    region: r.pageSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { state, region } = await params;
  const regionData = getRegionByStateAndPageSlug(state, region);
  if (!regionData) return {};
  return buildRegionMetadata(regionData);
}

export default async function SellMyCaravanRegionPage({ params }: PageProps) {
  const { state, region } = await params;
  const regionData = getRegionByStateAndPageSlug(state, region);

  if (!regionData) {
    notFound();
  }

  const jsonLd = buildRegionJsonLd(regionData);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RegionSeller region={regionData} />
    </>
  );
}
