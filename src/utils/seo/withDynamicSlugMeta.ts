import { metaFromSlug } from "./meta";

type Params = { slug?: string[] };

export async function generateMetadata({ params }: { params: Params }) {
  return metaFromSlug(params.slug ?? []);
}
