import { Metadata } from "next";
import { notFound } from "next/navigation";
import StateSeller from "../StateSeller";
import "../seller-demo.css";
import {
  ALL_STATE_SLUGS,
  getStateBySlug,
  buildStateMetadata,
  buildStateJsonLd,
} from "../../sell-my-caravan-region/states-data";

export const dynamicParams = true;

type RouteParams = { state: string };
type PageProps = { params: Promise<RouteParams> };

export async function generateStaticParams() {
  return ALL_STATE_SLUGS.map((slug) => ({ state: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) return {};
  return buildStateMetadata(state);
}

export default async function SellMyCaravanStatePage({ params }: PageProps) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    notFound();
  }

  const jsonLd = buildStateJsonLd(state);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StateSeller state={state} />
    </>
  );
}
