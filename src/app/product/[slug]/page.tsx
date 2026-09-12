 // app/product-details/[slug]/page.tsx
 import ProductDetailDemo from "../../product-detail-demo/ProductDetailDemo";
 import { redirect } from "next/navigation";
 import { Metadata } from "next";
 import { cache } from "react";
 import './product.css?=30006'
 
 export const dynamic = "force-dynamic";
 
 // export async function generateStaticParams() {
 //   const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
 //   const API_KEY = process.env.CFS_API_KEY;
 //   if (!API_BASE) return [];
 //
 //   const headers: Record<string, string> = {
 //     Accept: "application/json",
 //     ...(API_KEY ? { "X-Secret-Key": API_KEY } : {}),
 //   };
 //
 //   const fetchPage = async (page: number): Promise<string[]> => {
 //     const res = await fetch(
 //       `${API_BASE}/new_optimize_code?page=${page}&per_page=500`,
 //       { headers, cache: "no-store" }
 //     );
 //     if (!res.ok) return [];
 //     const data = await res.json();
 //     const products: { slug?: string }[] = data?.data?.products ?? [];
 //     return products.map((p) => p.slug ?? "").filter(Boolean);
 //   };
 //
 //   // Page 1 — also tells us total_pages
 //   const firstRes = await fetch(
 //     `${API_BASE}/new_optimize_code?page=1&per_page=500`,
 //     { headers, cache: "no-store" }
 //   );
 //   if (!firstRes.ok) return [];
 //   const firstData = await firstRes.json();
 //   const firstSlugs = (firstData?.data?.products ?? [])
 //     .map((p: { slug?: string }) => p.slug ?? "")
 //     .filter(Boolean) as string[];
 //   const totalPages: number = firstData?.pagination?.total_pages ?? 1;
 //
 //   // Remaining pages — 10 at a time in parallel
 //   const allSlugs = [...firstSlugs];
 //   const BATCH = 10;
 //   for (let i = 2; i <= totalPages; i += BATCH) {
 //     const pages = Array.from(
 //       { length: Math.min(BATCH, totalPages - i + 1) },
 //       (_, j) => fetchPage(i + j)
 //     );
 //     const results = await Promise.all(pages);
 //     allSlugs.push(...results.flat());
 //   }
 //
 //   return allSlugs.map((slug) => ({ slug }));
 // }
 
 export const dynamicParams = true;
 
 type RouteParams = { slug: string };
 type PageProps = { params: Promise<RouteParams> };
 
 export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
   const { slug } = await params;
   const data = await Promise.race([
     fetchProductDetail(slug),
     new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
   ]);
   const pd = data?.data?.product_details ?? {};
   const seo = data?.seo ?? data?.product?.seo ?? {};
   const slugTitle = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
 
   const title = seo.metatitle || seo.meta_title || pd.name || data?.name || slugTitle || "Caravan for Sale";
   const description = seo.metadescription || seo.meta_description || pd.short_description || "View caravan details on Caravans For Sale Australia.";
   const canonicalUrl = `https://www.caravansforsale.com.au/product/${slug}/`;
   const rawImages = pd.image_url ?? pd.images ?? [];
   const images: string[] = (Array.isArray(rawImages) ? rawImages : [rawImages]).filter(Boolean);
 
   return {
     title,
     description,
     robots: seo.index === "noindex" ? "noindex, nofollow" : "index, follow",
     alternates: { canonical: canonicalUrl },
     verification: { google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo" },
     openGraph: {
       title,
       description,
       url: canonicalUrl,
       siteName: "Caravans for Sale",
       ...(images.length > 0 && { images: [{ url: images[0], alt: title }] }),
       type: "website",
     },
     twitter: {
       card: "summary_large_image",
       title,
       description,
     },
   };
 }
 
 function toTitleCase(slug: string): string {
   return slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
 }

 function normalizeMpnProduct(raw: any) {
   const toRegion = (val: string) =>
     val ? { value: val, slug: val.toLowerCase().replace(/\s+/g, "-"), label: val } : undefined;
 
   const specs = [
     { label: "Make",               value: raw.make },
     { label: "Model",              value: raw.model },
     { label: "Years",              value: raw.year != null ? String(raw.year) : null },
     { label: "Conditions",         value: raw.condition },
     { label: "Length",             value: raw.length != null ? `${raw.length}ft` : null },
     { label: "ATM",                value: raw.atm != null ? `${raw.atm} kg` : null },
     { label: "Tare Mass",          value: raw.tare_mass != null ? `${raw.tare_mass} kg` : null },
     { label: "Ball Weight",        value: raw.ball_weight != null ? `${raw.ball_weight} kg` : null },
     { label: "Sleeps",             value: raw.sleep != null ? String(raw.sleep) : null },
     { label: "Axle Configuration", value: raw.axle_configuration },
     { label: "Suspension",         value: raw.suspension },
     { label: "Tyre Size",          value: raw.tyre_size },
     { label: "Brakes",             value: raw.brakes },
     { label: "Fridge",             value: raw.fridge },
     { label: "GPS",                value: raw.gps },
     { label: "Toilet",             value: raw.toilet },
     { label: "Shower",             value: raw.shower },
     { label: "Location",           value: raw.state ? toTitleCase(raw.state) : null },
   ].filter((s) => s.value != null && s.value !== "");
 
   const cats = Array.isArray(raw.category)
     ? raw.category.map((c: any) => {
         const name = typeof c === "string" ? c : (c?.name ?? c?.label ?? c?.value ?? "");
         return { name, label: name, value: name, slug: typeof c === "object" ? c?.slug : undefined };
       })
     : [];
 
   return {
     data: {
       product_details: {
         id: raw.source_id || String(raw.id),
         slug: raw.slug,
         name: raw.title,
         title: raw.title,
         sku: raw.sku,
         description: raw.description,
         image_url: Array.isArray(raw.images_full) ? raw.images_full : [],
         image: Array.isArray(raw.images_full) ? raw.images_full : [],
         regular_price: raw.regular_price,
         sale_price: raw.sale_price,
         seller_type: raw.seller_type,
         region: raw.region ? toRegion(raw.region) : undefined,
         suburb: raw.suburb ? toRegion(raw.suburb) : undefined,
         location: raw.location,
         categories: cats,
         attribute_urls: specs,
       },
     },
     seo: {
       metatitle: raw.seo_title || "",
       metadescription: raw.seo_description || "",
     },
   };
 }
 
 const fetchProductDetail = cache(async (slug: string) => {
   const MPN_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
   const CFS_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
   const API_KEY  = process.env.CFS_API_KEY;
 
   // 1. Try new MPN API first
   if (MPN_BASE) {
     try {
       const res = await fetch(
         `${MPN_BASE}/${encodeURIComponent(slug)}`,
         {
           cache: "no-store",
           headers: {
             Accept: "application/json",
             ...(API_KEY && { "X-Secret-Key": API_KEY }),
           },
         }
       );
       if (res.ok) {
         const raw = await res.json();
         if (raw?.slug) return normalizeMpnProduct(raw);
       }
     } catch {
       // fall through to CFS fallback
     }
   }

   // 2. Fallback to old CFS API
   try {
     const res = await fetch(
       `${CFS_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
       {
         cache: "no-store",
         headers: {
           Accept: "application/json",
           ...(API_KEY && { "X-Secret-Key": API_KEY }),
         },
       }
     );
     if (!res.ok) return null;
     const raw = await res.text();
     const idx = raw.indexOf('{"');
     const parsed = JSON.parse(idx >= 0 ? raw.substring(idx) : raw);
     if (parsed?.slug) return normalizeMpnProduct(parsed);
     return parsed;
   } catch {
     return null;
   }
 });
 
 
 async function fetchSimilarProducts(slug: string) {
   const API_KEY = process.env.CFS_API_KEY;
   const CFS_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
   try {
     const res = await fetch(
       `${CFS_BASE}/${encodeURIComponent(slug)}/similar`,
       {
         cache: "no-store",
         headers: {
           Accept: "application/json",
           ...(API_KEY && { "X-Secret-Key": API_KEY }),
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
 
 export default async function ProductDetailPage({ params }: PageProps) {
   const { slug } = await params;
   const data = await fetchProductDetail(slug);
 
   if (!data || Object.keys(data).length === 0) {
     // Middleware handles 410 for the common path; this covers the rare case where
     // the middleware check timed out and let the request through.
     redirect("/410/");
   }
 
   const pd = data?.data?.product_details ?? {};
   const seo = data?.seo ?? data?.product?.seo ?? {};
   const pdName = seo.metatitle || seo.meta_title || pd.name || data?.name || "";
   const pdDesc = seo.metadescription || seo.meta_description || pd.short_description || data?.short_description || "";
   const canonicalUrl = `https://www.caravansforsale.com.au/product/${slug}/`;
 
   const rawImages = pd.image_url ?? pd.images ?? [];
   const images: string[] = (Array.isArray(rawImages) ? rawImages : [rawImages]).filter(Boolean);
 
   const rawPrice = pd.sale_price || pd.regular_price || pd.price;
   const priceStr = rawPrice ? String(rawPrice).replace(/[^0-9.]/g, "") : null;
 
   const jsonLd: Record<string, unknown> = {
     "@context": "https://schema.org",
     "@type": "Product",
     name: pdName,
     ...(pdDesc && { description: pdDesc }),
     ...(images.length > 0 && { image: images }),
     ...(pd.make && { brand: { "@type": "Brand", name: pd.make } }),
     ...(pd.condition && {
       itemCondition:
         String(pd.condition).toLowerCase() === "new"
           ? "https://schema.org/NewCondition"
           : "https://schema.org/UsedCondition",
     }),
     offers: {
       "@type": "Offer",
       priceCurrency: "AUD",
       ...(priceStr && { price: priceStr }),
       availability: "https://schema.org/InStock",
       url: canonicalUrl,
       seller: { "@type": "Organization", name: "Caravans For Sale" },
     },
   };
 
   const similarData = slug ? await fetchSimilarProducts(slug) : null;
 
   // Shuffle price section server-side (API doesn't shuffle it)
   const priceArr = similarData?.similar_by_price?.products ?? similarData?.price_range;
   if (priceArr?.length) {
     const seed = Math.ceil(Math.random() * 10);
     let s = seed * 9301 + 49297;
     for (let i = priceArr.length - 1; i > 0; i--) {
       s = (s * 9301 + 49297) % 233280;
       const j = Math.floor((s / 233280) * (i + 1));
       [priceArr[i], priceArr[j]] = [priceArr[j], priceArr[i]];
     }
   }
 
   return (
     <main className="mx-auto">
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
       />
       <ProductDetailDemo data={data} similarData={similarData} />
     </main>
   );
 }