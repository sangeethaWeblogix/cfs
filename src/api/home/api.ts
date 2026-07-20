// src/api/home/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE!;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this
 
export type HomeProduct = {
  id?: number | string;
  title?: string;
  slug?: string;
  image?: string;
  link?: string;
  location?: string;
  regular_price?: string | number;
  sale_price?: string | number;
  price_difference?: string | number;
};
 
export type HomeBlogPost = {
  id?: number;
  title?: string;
  excerpt?: string;
  link?: string;
  image?: string;
  slug?: string;
  date?: string;
};
 
export type HomePageData = {
  featured: HomeProduct[];
  products: HomeProduct[];
  latest_posts: HomeBlogPost[];
};
 
/* ---------------------------- input shapes (typed) ---------------------------- */
type Wrapper<T> = { items?: T[]; list?: T[]; data?: T[] };
 
type ProductRaw = {
  id?: number | string;
  product_id?: number | string;
  title?: string;
  name?: string;
  slug?: string;
  image?: string;
  main_image?: string;
  thumbnail?: string;
  link?: string;
  permalink?: string;
  location?: string;
  regular_price?: string | number;
  sale_price?: string | number;
  price_difference?: string | number;
  save?: string | number;
};
 
type BlogRaw = {
  id?: number;
  title?: string;
  excerpt?: string;
  link?: string;
  image?: string;
  slug?: string;
  date?: string;
};
 
type HomeRoot = {
  // products buckets
  featured?: ProductRaw[] | Wrapper<ProductRaw>;
  featured_products?: ProductRaw[] | Wrapper<ProductRaw>;
  featured_caravans?: ProductRaw[] | Wrapper<ProductRaw>;
  top?: ProductRaw[] | Wrapper<ProductRaw>;
 
  products?: ProductRaw[] | Wrapper<ProductRaw>;
  more_products?: ProductRaw[] | Wrapper<ProductRaw>;
  latest_listings?: ProductRaw[] | Wrapper<ProductRaw>;
  recommended?: ProductRaw[] | Wrapper<ProductRaw>;
 
  // posts buckets
  latest_blog_posts?: BlogRaw[] | Wrapper<BlogRaw>;
  blog?: BlogRaw[] | Wrapper<BlogRaw>;
  posts?: BlogRaw[] | Wrapper<BlogRaw>;
};
 
type ApiEnvelope = HomeRoot & { data?: HomeRoot };
 
/* ------------------------------- helpers ----------------------------------- */
function pickItems<T>(v: T[] | Wrapper<T> | null | undefined): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  const w = v as Wrapper<T>;
  if (Array.isArray(w.items)) return w.items;
  if (Array.isArray(w.list)) return w.list;
  if (Array.isArray(w.data)) return w.data;
  return [];
}
 
function normalizeProduct(src: ProductRaw = {}): HomeProduct {
  return {
    id: src.id ?? src.product_id,
    title: src.title ?? src.name,
    slug: src.slug,
    image: src.image ?? src.main_image ?? src.thumbnail,
    link: src.link ?? src.permalink,
    location: src.location,
    regular_price: src.regular_price,
    sale_price: src.sale_price,
    price_difference: src.price_difference ?? src.save,
  };
}
 
function normalizeBlog(src: BlogRaw = {}): HomeBlogPost {
  return {
    id: src.id,
    title: src.title,
    excerpt: src.excerpt,
    link: src.link,
    image: src.image,
    slug: src.slug,
    date: src.date,
  };
}
 
/* -------------------------------- fetcher ---------------------------------- */
const EMPTY_HOME: HomePageData = { featured: [], products: [], latest_posts: [] };

export async function fetchHomePage(): Promise<HomePageData> {
  const url = `${API_BASE.replace(/\/$/, "")}/home_page`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return EMPTY_HOME;

    const json = (await res.json()) as ApiEnvelope;
    const root: HomeRoot = json.data ?? json;
 
  const featuredRaw =
    root.featured ??
    root.featured_products ??
    root.featured_caravans ??
    root.top;
 
  const productsRaw =
    root.products ??
    root.more_products ??
    root.latest_listings ??
    root.recommended;
 
  const postsRaw = root.latest_blog_posts ?? root.blog ?? root.posts;
 
    const featured = pickItems<ProductRaw>(featuredRaw).map(normalizeProduct);
    const products = pickItems<ProductRaw>(productsRaw).map(normalizeProduct);
    const latest_posts = pickItems<BlogRaw>(postsRaw).map(normalizeBlog);

    return { featured, products, latest_posts };
  } catch {
    return EMPTY_HOME;
  }
}
 
 