 import { cache } from "react";
import { parseSlugToFilters } from "@/app/components/urlBuilder";

/** Local shapes for the /pool response fields this file actually reads —
 * kept here instead of importing from the (removed) old listings API module. */
type Item = {
  id?: number;
  sku?: string;
  title: string;
  slug?: string;
  make?: string;
  model?: string;
  condition?: string;
  length?: number | string | null;
  atm?: number | string | null;
  regular_price?: number | string | null;
  sale_price?: number | string | null;
  r2_thumbnails?: string[];
  category?: string[];
};

type ApiResponse = {
  success?: boolean;
  seo_v2?: {
    h1?: string;
    meta_title?: string;
    meta_description?: string;
    footer_description?: string;
    faq?: string;
  };
  pagination?: {
    total_products?: number;
  };
  data?: {
    products?: Item[];
    exclusive_products?: Item[];
    emp_exclusive_products?: Item[];
    premium_products?: Item[];
  };
  emp_exclusive_products?: Item[];
  /** Make names (e.g. "Jayco Caravans"), longest first — /pool items carry no make/model, so the brand is matched from the title. */
  makes?: string[];
};

const BASE_URL = "https://www.caravansforsale.com.au";
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

/** Manual TTL cache (mirrors seoCache/productCache in middleware.ts) instead of
 * Next's `next: { revalidate }` fetch Data Cache — that internal stream-teeing
 * mechanism races with bots that disconnect mid-render, throwing
 * "controller[kState].transformAlgorithm is not a function". Plain in-memory
 * Map, server-side only — doesn't touch response headers, so it has no effect
 * on Cloudflare's edge cache. */
const headPoolCache = new Map<string, { data: ApiResponse | null; expires: number }>();
const HEAD_POOL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/** Same backend endpoint as /api/pool-listings/ (pool_test, engine=typesense) —
 * used here instead of new_optimize_code because pool_test has proven far more
 * reliable (new_optimize_code intermittently returns a PHP notice from the ACF
 * plugin instead of JSON). Response is flat (products/premium_products/etc. at
 * the top level); adapted into the nested ApiResponse shape buildListingsJsonLd
 * already expects, so no caller changes are needed. */
async function fetchPoolListingsForHead(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: any,
  page: number
): Promise<ApiResponse | null> {
  const params = new URLSearchParams();
  params.set("order_by", "default");
  params.set("seed", "1"); // fixed seed — this is for SEO schema, not user-facing shuffle
  params.set("page", String(page));
  if (filters.state) params.set("state", String(filters.state));
  if (filters.category) params.set("category", String(filters.category));
  if (filters.make) params.set("make", String(filters.make));
  if (filters.model) params.set("model", String(filters.model));
  if (filters.region) params.set("region", String(filters.region));
  if (filters.suburb) params.set("suburb", String(filters.suburb));
  if (filters.pincode) params.set("pincode", String(filters.pincode));
  if (filters.from_price) params.set("from_price", String(filters.from_price));
  if (filters.to_price) params.set("to_price", String(filters.to_price));
  if (filters.minKg) params.set("from_atm", String(filters.minKg));
  if (filters.maxKg) params.set("to_atm", String(filters.maxKg));
  if (filters.from_sleep) params.set("from_sleep", String(filters.from_sleep));
  if (filters.to_sleep) params.set("to_sleep", String(filters.to_sleep));
  if (filters.from_year) params.set("from_year", String(filters.from_year));
  if (filters.to_year) params.set("to_year", String(filters.to_year));
  if (filters.from_length) params.set("from_length", String(filters.from_length));
  if (filters.to_length) params.set("to_length", String(filters.to_length));
  if (filters.condition) params.set("condition", String(filters.condition));
  if (filters.search || filters.keyword) params.set("search", String(filters.search ?? filters.keyword));

  const url = `${API_BASE}/pool?${params.toString()}`;

  const cached = headPoolCache.get(url);
  if (cached && cached.expires > Date.now()) return cached.data;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-Secret-Key": API_KEY }),
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const raw = await res.text();
  const jsonStart = raw.indexOf("{");
  const cleaned = jsonStart <= 0 ? raw : raw.substring(jsonStart);

  let json: any;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return null;
  }

  // /pool buckets products into featured/new/used (+ premium/exclusive) —
  // flatten the non-exclusive buckets into the flat `products` list this
  // module's JSON-LD builder expects (no more top-level flat `products`).
  const combinedProducts = [
    ...(json.featured_products ?? []),
    ...(json.new_products ?? []),
    ...(json.used_products ?? []),
  ];
  const data: ApiResponse = {
    success: json.success,
    seo_v2: json.seo ?? json.seo_v2,
    pagination: json.pagination,
    data: {
      products: combinedProducts,
      exclusive_products: json.exclusive_products ?? [],
      emp_exclusive_products: json.exclusive_products ?? [],
      premium_products: json.premium_products ?? [],
    },
    emp_exclusive_products: json.exclusive_products ?? [],
  };
  headPoolCache.set(url, { data, expires: Date.now() + HEAD_POOL_CACHE_TTL });
  return data;
}

function parseLengthFt(raw: string): number {
  // handles "19'6 ft" (feet+inches) and "24.93 ft" (decimal feet)
  const feetInches = raw.match(/^(\d+)'(\d+)/);
  if (feetInches) return parseInt(feetInches[1]) + parseInt(feetInches[2]) / 12;
  return parseFloat(raw);
}

function cleanPrice(raw: string): string {
  return raw.replace(/[$,]/g, "").trim();
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<\/(h[1-6]|p|div|li|br)\s*>/gi, ". ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\s*\.\s*\.\s*/g, ". ") // collapse doubled periods from adjacent block tags
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

type Faq = { q: string; a: string };

function parseFaq(raw?: string): Faq[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((f): f is Faq => !!f?.q && !!f?.a);
  } catch {
    return [];
  }
}

const SCHEMA = "https://schema.org";
const titleCase = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function splitYearAndBrand(title: string, makes: string[]): { year?: string; brand?: string } {
  const m = title.match(/^((?:19|20)\d{2})\s+(.*)$/);
  const rest = (m ? m[2] : title).toLowerCase();
  const brand = makes.find((n) => rest.startsWith(n.toLowerCase() + " ") || rest === n.toLowerCase());
  return { year: m?.[1], brand };
}

function conditionUrl(raw?: string): string | undefined {
  const c = String(raw ?? "").trim().toLowerCase();
  if (c === "new") return `${SCHEMA}/NewCondition`;
  if (c === "used" || c.includes("near")) return `${SCHEMA}/UsedCondition`;
  return undefined;
}

function buildVehicle(item: Item, makes: string[]) {
  if (!item.slug) return null;
  const url = `${BASE_URL}/product/${item.slug}/`;
  const { year, brand } = splitYearAndBrand(item.title, makes);
  const itemCondition = conditionUrl(item.condition);

  const rawPrice = item.sale_price != null && item.sale_price !== "" ? item.sale_price : item.regular_price;
  const price = Number(cleanPrice(String(rawPrice ?? "")));
  const lengthFt = parseLengthFt(String(item.length ?? ""));
  const atm = Number(item.atm);

  const additionalProperty = [
    ...(item.category && item.category.length > 0
      ? [{ "@type": "PropertyValue", name: "Category", value: item.category.map(titleCase).join(", ") }]
      : []),
    ...(lengthFt > 0 ? [{ "@type": "PropertyValue", name: "Length", value: Math.round(lengthFt * 100) / 100, unitCode: "FOT" }] : []),
    ...(atm > 0 ? [{ "@type": "PropertyValue", name: "ATM", value: atm, unitCode: "KGM" }] : []),
  ];
  const images = (item.r2_thumbnails ?? []).slice(0, 5);

  return {
    "@type": "Vehicle",
    "@id": `${url}#vehicle`,
    name: item.title,
    url,
    ...(item.sku && { sku: item.sku }),
    bodyType: "Caravan",
    ...(brand && { brand: { "@type": "Brand", name: brand } }),
    ...(year && { vehicleModelDate: year }),
    ...(additionalProperty.length > 0 && { additionalProperty }),
    ...(images.length > 0 && { image: images }),
    ...(itemCondition && { itemCondition }),
    // No Offer without a real price (POA listings) — Google requires one
    ...(price > 0 && {
      offers: {
        "@type": "Offer",
        url,
        price,
        priceCurrency: "AUD",
        availability: `${SCHEMA}/InStock`,
        ...(itemCondition && { itemCondition }),
      },
    }),
  };
}

export function buildListingsJsonLd(
  response: ApiResponse,
  pageUrl: string,
  breadcrumbs: { name: string; url: string }[]
) {
  const pageTitle =
    response?.seo_v2?.h1 ||
    response?.seo_v2?.meta_title ||
    "Caravans for Sale in Australia";

  // Every product shown on the page: regular + premium + exclusive, de-duplicated
  const seen = new Set<string>();
  const products = [
    ...(response.data?.products || []),
    ...(response.data?.premium_products || []),
    ...(response.data?.emp_exclusive_products || []),
  ].filter((p) => {
    const key = String(p.id ?? p.slug ?? p.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const makes = response.makes ?? [];
  const vehicles = products
    .map((p) => buildVehicle(p, makes))
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const footerDescription = response?.seo_v2?.footer_description
    ? stripHtml(response.seo_v2.footer_description)
    : "";
  const pageDescription =
    footerDescription || response?.seo_v2?.meta_description || "";

  const faqItems = parseFaq(response?.seo_v2?.faq);

  const siteId = `${BASE_URL}/#website`;
  const pageId = `${pageUrl}#webpage`;
  const crumbId = `${pageUrl}#breadcrumb`;
  const listId = `${pageUrl}#itemlist`;
  // "6,909 Caravans for Sale in Australia" → "Caravans for Sale in Australia – Page 1"
  const listName = `${pageTitle.replace(/^[\d,]+\s+/, "")} – Page 1`;

  const collectionPageLd = {
    "@context": SCHEMA,
    "@graph": [
      {
        "@type": "WebSite",
        "@id": siteId,
        url: `${BASE_URL}/`,
        name: "Caravans For Sale",
        inLanguage: "en-AU",
      },
      {
        "@type": "CollectionPage",
        "@id": pageId,
        url: pageUrl,
        name: pageTitle,
        ...(pageDescription && { description: pageDescription }),
        inLanguage: "en-AU",
        isPartOf: { "@id": siteId },
        breadcrumb: { "@id": crumbId },
        ...(vehicles.length > 0 && { mainEntity: { "@id": listId } }),
      },
      {
        "@type": "BreadcrumbList",
        "@id": crumbId,
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      },
      ...(vehicles.length > 0
        ? [
            {
              "@type": "ItemList",
              "@id": listId,
              name: listName,
              numberOfItems: vehicles.length,
              itemListOrder: `${SCHEMA}/ItemListUnordered`,
              itemListElement: vehicles.map((v, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: v.url,
                item: v,
              })),
            },
          ]
        : []),
      ...(faqItems.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqItems.map((f) => ({
                "@type": "Question",
                name: stripHtml(f.q),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: stripHtml(f.a),
                },
              })),
            },
          ]
        : []),
    ],
  };

  return { collectionPageLd };
}

let makeNamesCache: { names: string[]; expires: number } | null = null;

/** Make names from params-count, longest first so "Snowy River Caravans" wins over "Snowy". */
async function getMakeNames(): Promise<string[]> {
  if (makeNamesCache && makeNamesCache.expires > Date.now()) return makeNamesCache.names;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE}/params-count?group_by=make`, {
      headers: { Accept: "application/json", ...(API_KEY && { "X-Secret-Key": API_KEY }) },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const raw = await res.text();
    const json = JSON.parse(raw.substring(Math.max(0, raw.indexOf("{"))));
    const names = (Array.isArray(json?.data) ? json.data : [])
      .map((m: { name?: string }) => String(m?.name ?? "").trim())
      .filter(Boolean)
      .sort((x: string, y: string) => y.length - x.length);
    if (names.length === 0) throw new Error("empty make list");
    makeNamesCache = { names, expires: Date.now() + HEAD_POOL_CACHE_TTL };
    return names;
  } catch {
    // Brand is optional in the schema — retry soon, but don't hammer the API during an outage
    makeNamesCache = { names: [], expires: Date.now() + 60 * 1000 };
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// React.cache deduplicates within a single request; the 1hr cross-request cache
// is handled by headPoolCache above.
async function fetchListingsPool(pathnameKey: string): Promise<ApiResponse | null> {
  if (pathnameKey === "/listings/") {
    return fetchPoolListingsForHead({}, 1);
  }
  const slugString = pathnameKey
    .replace(/^\/listings\//, "")
    .replace(/\/$/, "");
  const slugParts = slugString.split("/").filter(Boolean);
  const rawFilters = parseSlugToFilters(slugParts, {});
  const page = rawFilters.page ? Number(rawFilters.page) : 1;
  return fetchPoolListingsForHead(rawFilters, page);
}

const fetchListingsForHead = cache(
  async (pathnameKey: string): Promise<ApiResponse | null> => {
    try {
      const data = await fetchListingsPool(pathnameKey);
      return data ? { ...data, makes: await getMakeNames() } : null;
    } catch {
      return null;
    }
  }
);

export function buildBreadcrumbs(pathname: string): { name: string; url: string }[] {
  const crumbs: { name: string; url: string }[] = [
    { name: "Home", url: `${BASE_URL}/` },
    { name: "Caravans for Sale", url: `${BASE_URL}/listings/` },
  ];
  if (pathname === "/listings/" || pathname === "/listings") return crumbs;

  const slugString = pathname.replace(/^\/listings\//, "").replace(/\/$/, "");
  const slugParts = slugString.split("/").filter(Boolean);
  slugParts.forEach((segment, i) => {
    const label = segment
      .replace(/-(category|state|region|condition|search|suburb)$/, "")
      .replace(/[-+]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({
      name: label,
      url: `${BASE_URL}/listings/${slugParts.slice(0, i + 1).join("/")}/`,
    });
  });
  return crumbs;
}

export default fetchListingsForHead;
