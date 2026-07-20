import { cache } from "react";
import { type ApiResponse, type Item } from "@/api/listings/api";
import { parseSlugToFilters } from "@/app/components/urlBuilder";

const BASE_URL = "https://www.caravansforsale.com.au";
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

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
  params.set("orderby", "default");
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
  if (filters.acustom_fromyears) params.set("acustom_fromyears", String(filters.acustom_fromyears));
  if (filters.acustom_toyears) params.set("acustom_toyears", String(filters.acustom_toyears));
  if (filters.from_length) params.set("from_length", String(filters.from_length));
  if (filters.to_length) params.set("to_length", String(filters.to_length));
  if (filters.condition) params.set("condition", String(filters.condition));
  if (filters.search || filters.keyword) params.set("search", String(filters.search ?? filters.keyword));

  const url = `${API_BASE}/pool_test?${params.toString()}&engine=typesense`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 3600 },
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

  return {
    success: json.success,
    seo_v2: json.seo_v2,
    pagination: json.pagination,
    data: {
      products: json.products ?? [],
      exclusive_products: json.exclusive_products ?? [],
      emp_exclusive_products: json.emp_exclusive_products ?? [],
      premium_products: json.premium_products ?? [],
    },
    emp_exclusive_products: json.emp_exclusive_products ?? [],
  };
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

function buildProductListItem(item: Item, position: number) {
  const rawPrice = item.sale_price && item.sale_price !== "" ? item.sale_price : item.regular_price;
  const price = cleanPrice(rawPrice ?? "");
  const lengthFt = parseLengthFt(item.length ?? "");
  const widthMt =
    !isNaN(lengthFt) && lengthFt > 0
      ? (lengthFt * 0.3048).toFixed(2)
      : "";
  const images =
    item.image_format && item.image_format.length > 0
      ? item.image_format
          .slice(0, 5)
          .map((url) => ({ "@type": "ImageObject", url }))
      : item.image
      ? [{ "@type": "ImageObject", url: item.image }]
      : [];
  return {
    "@type": "ListItem",
    position,
    item: {
      "@type": "Caravan",
      bodyType: item.categories && item.categories.length > 0
        ? item.categories.join(", ")
        : "",
      vehicleConfiguration: item.axle ?? "",
      width: {
        "@type": "QuantitativeValue",
        unitCode: "MT",
        value: widthMt,
      },
      url: item.link,
      name: item.name,
      model: item.model ?? "",
      brand: {
        "@type": "Brand",
        name: item.make ?? "",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "AUD",
        price: price,
      },
      image: images,
    },
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
  const totalProducts = response?.pagination?.total_products ?? 0;

  const allProducts = [
    ...(response.data?.products || []),
    ...(response.data?.emp_exclusive_products || []),
  ];
const weburl = "https://www.caravansforsale.com.au"

  const footerDescription = response?.seo_v2?.footer_description
    ? stripHtml(response.seo_v2.footer_description)
    : "";
  const pageDescription =
    footerDescription || response?.seo_v2?.meta_description || "";

  const faqItems = parseFaq(response?.seo_v2?.faq);

  const collectionPageLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        name: pageTitle,
        url: pageUrl,
        inLanguage: "en-AU",
        ...(pageDescription && { description: pageDescription }),
        ...(totalProducts > 0 && { numberOfItems: totalProducts }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      },
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

  const searchResultsLd = {
    "@context": "https://schema.org/",
    "@type": "SearchResultsPage",
    audience: { "@type": "Audience", audienceType: "caravan buyers" },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: weburl },
    },
    mainEntity: {
      "@type": "OfferCatalog",
      numberOfItems: allProducts.length,
      itemListElement: allProducts.map((item, idx) =>
        buildProductListItem(item, idx + 1)
      ),
    },
  };

  return { collectionPageLd, searchResultsLd };
}

// React.cache deduplicates within a single request — the page component calling
// getCachedListings with the same URL hits Next.js data cache (revalidate: 3600).
const fetchListingsForHead = cache(
  async (pathnameKey: string): Promise<ApiResponse | null> => {
    try {
      if (pathnameKey === "/listings/") {
        return await fetchPoolListingsForHead({}, 1);
      }
      const slugString = pathnameKey
        .replace(/^\/listings\//, "")
        .replace(/\/$/, "");
      const slugParts = slugString.split("/").filter(Boolean);
      const rawFilters = parseSlugToFilters(slugParts, {});
      const page = rawFilters.page ? Number(rawFilters.page) : 1;
      return await fetchPoolListingsForHead(rawFilters, page);
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
