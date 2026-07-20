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
  /** JSON-encoded string: `[{ "q": "...", "a": "..." }, ...]` */
  faq?: string;
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
