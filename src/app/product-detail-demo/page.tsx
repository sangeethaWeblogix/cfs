import { cache } from "react";
import type { Metadata } from "next";
import ProductDetailDemo from "./ProductDetailDemo";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

export const revalidate = 3600;

const DEMO_SLUG = "2025-retreat-caravans-daydream-29ft6-off-road";

const fetchProduct = cache(async () => {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
  const API_KEY  = process.env.CFS_API_KEY;
  try {
    const res = await fetch(
      `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(DEMO_SLUG)}`,
      {
        next: { revalidate: 3600 },
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
      }
    );
    if (!res.ok) return null;
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    return JSON.parse(idx > 0 ? raw.substring(idx) : raw);
  } catch {
    return null;
  }
});

async function fetchSimilarProducts(productId: string | number, seed: number) {
  const API_KEY = process.env.CFS_API_KEY;
  try {
    const res = await fetch(
      `https://admin.caravansforsale.com.au/wp-json/cfs/v1/similar_products?product_id=${productId}&seed=${seed}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
      }
    );
    if (!res.ok) return null;
    const raw = await res.text();
    const idx = raw.indexOf("{");
    const json = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
    return json?.sections ?? json?.data ?? json;
  } catch {
    return null;
  }
}

export default async function ProductDetailDemoPage() {
  const data = await fetchProduct();

  const pd = data?.data?.product_details ?? {};
  const productId = pd.id ?? pd.product_id ?? data?.data?.id ?? data?.id ?? "";
  const seed = Math.ceil(Math.random() * 10);
  const similarData = productId ? await fetchSimilarProducts(productId, seed) : null;

  return (
    <main>
      <ProductDetailDemo data={data} similarData={similarData} />
    </main>
  );
}
