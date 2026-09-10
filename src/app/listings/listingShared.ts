export type Listing = {
  id: number;
  name: string;
  slug?: string;
  condition: string;
  location?: string;
  state?: string;
  region?: string;
  suburb?: string;
  regular_price: string;
  sale_price?: string;
  categories?: string[];
  image_format?: string[];
  image_url?: string[];
  image?: string;
  seller_type?: string;
  kg?: string;
  length?: string;
  make?: string;
  is_premium?: boolean;
  is_exclusive?: boolean;
  is_featured?: boolean;
  slot_bucket?: string;
};

export type SeoV2 = {
  h1?: string;
  meta_title?: string;
  meta_description?: string;
  short_description?: string;
  footer_description?: string;
  /** Either a real array or a JSON-encoded string of `{ q, a }` pairs, depending on API version. */
  faq?: string | { q: string; a: string }[];
};

/** Featured-tab ordering: slots 1 & 2 are regular featured vans, slot 3 is the
 * exclusive spotlight van, slots 4 & 5 are premium vans, then the rest of the
 * pool fills in after. Shared by the internal fetch path and any caller doing
 * its own shared fetch (e.g. StateHome splitting one response across grids). */
export function buildFeaturedOrder(products: Listing[], premiumsRaw: Listing[], exclusivesRaw: Listing[]): Listing[] {
  const premiums   = premiumsRaw.map((p) => ({ ...p, is_premium: true }));
  const exclusives = exclusivesRaw.map((p) => ({ ...p, is_exclusive: true }));
  const heroFeatured = products.slice(0, 2);
  const hero = [...heroFeatured, ...exclusives.slice(0, 1), ...premiums.slice(0, 2)];
  const heroIds = new Set(hero.map((p) => p.id));
  const rest = products.filter((p) => !heroIds.has(p.id));
  return [...hero, ...rest];
}

/** Raw product item as returned by the `/caravans/pool` WP endpoint (the
 * "listing-page API") — distinct schema from the old pool_test endpoint:
 * different field names (title/category/atm/sleep/r2_thumbnails) and numeric
 * (not string) prices/dimensions. */
type RawPoolProduct = Record<string, any>;

/** Adapt one raw `/pool` product into the shared Listing shape so every
 * existing renderer (ListingCard, formatPrice, getImages, etc.) keeps working
 * unchanged — only this mapping needs to know about the new field names. */
export function normalizePoolProduct(raw: RawPoolProduct): Listing {
  const numToStr = (v: unknown): string | undefined =>
    v === null || v === undefined ? undefined : String(v);

  return {
    id: raw.id,
    name: raw.title ?? raw.name ?? "",
    slug: raw.slug,
    condition: raw.condition || "",
    state: raw.state || undefined,
    region: raw.region || undefined,
    suburb: raw.suburb || undefined,
    regular_price: numToStr(raw.regular_price) ?? "",
    sale_price: numToStr(raw.sale_price),
    categories: raw.category ?? raw.categories ?? [],
    image_format: raw.r2_thumbnails ?? raw.image_format ?? [],
    seller_type: raw.seller_type,
    kg: raw.atm != null ? String(raw.atm) : raw.kg,
    length: raw.length != null ? String(raw.length) : raw.length,
    make: raw.make,
    is_premium: raw.premium ?? raw.is_premium ?? false,
    is_exclusive: raw.exclusive ?? raw.is_exclusive ?? false,
    is_featured: raw.is_featured ?? raw.featured ?? false,
  };
}

/** A pool with 0 total products but a pinned exclusive listing still shows
 * that one spotlight van (dealer paid for exclusive placement even on an
 * otherwise-empty pool) instead of rendering nothing. */
function poolTotalCount(json: any): number {
  return json?.counts?.total ?? json?.pagination?.total_products ?? 0;
}

/** Bucket a raw `/pool` JSON response — already split server-side into
 * featured/new/used/premium/exclusive — into the three Listing[] grids the
 * indexed listings page renders. */
export function bucketPoolResponse(json: any): {
  featured: Listing[];
  new: Listing[];
  used: Listing[];
  seo: SeoV2 | null;
  totalPages: number;
} {
  const seo = json?.seo ?? json?.seo_v2 ?? null;
  const totalPages = Math.max(1, json?.pagination?.total_pages ?? 1);
  const exclusives = (json?.exclusive_products ?? []).map(normalizePoolProduct);

  if (poolTotalCount(json) === 0 && exclusives.length > 0) {
    const empItems = exclusives.map((p: Listing) => ({ ...p, is_exclusive: true }));
    return { featured: empItems, new: [], used: [], seo, totalPages: 1 };
  }

  const premiums = (json?.premium_products ?? []).map(normalizePoolProduct);
  const featuredRaw = (json?.featured_products ?? []).map(normalizePoolProduct);
  const featured = buildFeaturedOrder(featuredRaw, premiums, exclusives);
  const featuredIds = new Set(featured.map((p) => p.id));

  const newItems = (json?.new_products ?? [])
    .map(normalizePoolProduct)
    .filter((p: Listing) => !featuredIds.has(p.id));
  const usedItems = (json?.used_products ?? [])
    .map(normalizePoolProduct)
    .filter((p: Listing) => !featuredIds.has(p.id));

  return { featured, new: newItems, used: usedItems, seo, totalPages };
}

/** Same as bucketPoolResponse but for non-indexed pages, which render one
 * combined grid (featured + new + used flattened together) instead of a
 * three-way split. */
export function bucketPoolResponseCombined(json: any): {
  combined: Listing[];
  seo: SeoV2 | null;
  totalPages: number;
} {
  const seo = json?.seo ?? json?.seo_v2 ?? null;
  const totalPages = Math.max(1, json?.pagination?.total_pages ?? 1);
  const exclusives = (json?.exclusive_products ?? []).map(normalizePoolProduct);

  if (poolTotalCount(json) === 0 && exclusives.length > 0) {
    const empItems = exclusives.map((p: Listing) => ({ ...p, is_exclusive: true }));
    return { combined: empItems, seo, totalPages: 1 };
  }

  const premiums = (json?.premium_products ?? []).map(normalizePoolProduct);
  // Page 1 of /pool returns pre-split featured_products/new_products/used_products;
  // page 2+ instead returns one flat `products` array (no split) — merge whichever
  // the response actually has.
  const flatRaw = json?.products
    ? json.products
    : [
        ...(json?.featured_products ?? []),
        ...(json?.new_products ?? []),
        ...(json?.used_products ?? []),
      ];
  const flat = flatRaw.map(normalizePoolProduct);
  const combined = buildFeaturedOrder(flat, premiums, exclusives);

  return { combined, seo, totalPages };
}
