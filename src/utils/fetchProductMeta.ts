import { cache } from "react";

export interface ProductMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
}

export const fetchProductMeta = cache(async (slug: string): Promise<ProductMeta> => {
  const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
  const API_KEY = process.env.CFS_API_KEY;
  const empty: ProductMeta = { title: "", description: "", canonical: "", ogImage: "" };
  try {
    const res = await fetch(
      `${API_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 3600 },
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }),
        },
      }
    );
    if (!res.ok) return empty;
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    const data = JSON.parse(idx >= 0 ? raw.substring(idx) : raw);
    const seo = data?.seo ?? data?.product?.seo ?? {};
    const pd = data?.data?.product_details ?? {};
    const title = seo.metatitle || seo.meta_title || pd.name || data?.name || "";
    const description = seo.metadescription || seo.meta_description || pd.short_description || "";
    const canonical = `https://www.caravansforsale.com.au/product/${slug}/`;
    const imageUrlRaw = pd.image_url;
    const ogImage: string = Array.isArray(imageUrlRaw)
      ? imageUrlRaw.filter(Boolean)[0] ?? ""
      : typeof imageUrlRaw === "string"
      ? imageUrlRaw
      : "";
    return { title, description, canonical, ogImage };
  } catch {
    return empty;
  }
});
