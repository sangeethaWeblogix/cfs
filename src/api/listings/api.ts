const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

interface Filters {
  page?: number;
  seller_type?: string;
  category?: string;
  make?: string;
  from_price?: string;
  to_price?: string;
  minKg?: string;
  maxKg?: string;
  condition?: string;
  sleeps?: string;
  state?: string;
  region?: string;
  suburb?: string;
  acustom_fromyears?: string | number;
  acustom_toyears?: string | number;
  from_length?: string;
  to_length?: string;
  model?: string;
  pincode?: string;
  orderby?: string;
  slug?: string;
  radius_kms?: string;
  search?: string;
  keyword?: string;
  from_sleep?: string | number;
  to_sleep?: string | number;
  msid?: string | null;
  shuffle_seed?: string | number; // NEW: For Cloudflare cache variants
  indexed?: boolean; // Tells the Cloudflare Worker whether this page is eligible for KV caching
}

export type Item = {
  id: number;
  name: string;
  length: string;
  kg: string;
  regular_price: string;
  sale_price?: string;
  price_difference?: string;
  image: string;
  link: string;
  condition: string;
  location?: string;
  region?: string;
  suburb?: string;
  pincode?: string;
  categories?: string[];
  people?: string;
  make?: string;
  slug?: string;
  description?: string;
  sku?: string;
  gallery?: string[];
  is_exclusive?: boolean;
  is_premium?: boolean;
  model?: string;
  image_format?: string[];
  image_url?: string[];
  seller_type?: string;
  axle?: string;
};

export interface ApiSEO {
  metadescription?: string;
  metatitle?: string;
  metaimage?: string;
  index?: string;
  canonical?: string;
  follow?: string;
  h1?: string;
  list_page_metatitle?: string;
  meta_title?: string;
  meta_description?: string;
  short_description?: string;
  footer_description?: string;
  /** JSON-encoded string: `[{ "q": "...", "a": "..." }, ...]` */
  faq?: string;
  cacheable?: boolean; // NEW: Cache hint for CDN
}

export interface ApiPagination {
  current_page: number;
  total_pages: number;
  total_products: number;
  per_page: number;
}

export interface ApiData {
  products?: Item[];
  exclusive_products?: Item[];
  featured_products?: Item[];
  emp_exclusive_products?: Item[];
  premium_products?: Item[];
  all_categories?: { name: string; slug: string }[];
  make_options?: { name: string; slug: string }[];
  model_options?: { name: string; slug: string }[];
  states?: { value: string; name: string }[];
}

export type ApiResponse = {
  success?: boolean;
  list_page_title?: string;
  seo_v2?: ApiSEO;
  pagination?: ApiPagination;
  data?: ApiData;
  emp_exclusive_products?: Item[]; // top-level in 0-product (410) responses
  message?: string;
  errors?: string[];
  msid?: string | null;
  canonical?: string;
  h1?: string;
};

/** Normalize "+", spaces for search/keyword */
const normalizeQuery = (s?: string) =>
  (s ?? "").replace(/\+/g, " ").trim().replace(/\s+/g, " ");

// NOTE: no client-side result cache here by design — Cloudflare KV (fed by the WP
// admin warmer) is the single source of truth for cached listings JSON. A separate
// browser-local cache could serve a visitor stale data for minutes after the admin
// has already pushed a fresh version to KV, so every call goes straight through.

export const fetchListings = async (
  filters: Filters = {}
): Promise<ApiResponse> => {
  const {
    page = 1,
    category,
    make,
    model,
    from_price,
    to_price,
    minKg,
    maxKg,
    from_length,
    to_length,
    condition,
    state,
    region,
    suburb,
    pincode,
    orderby,
    slug,
    radius_kms,
    search,
    acustom_fromyears,
    acustom_toyears,
    from_sleep,
    to_sleep,
    shuffle_seed, // NEW: Extract shuffle_seed
    indexed,
  } = filters;

  const params = new URLSearchParams();
  params.append("page", page.toString());
  if (category) params.append("category", category);
  if (slug) params.append("category", slug);
  if (make) params.append("make", make);
  if (model) params.append("model", model);
  if (pincode) params.append("pincode", pincode);
  if (state) params.append("state", state);
  if (region) params.append("region", region);
  if (suburb) params.append("suburb", suburb);
  if (from_price) params.append("from_price", `${from_price}`);
  if (to_price) params.append("to_price", `${to_price}`);
  if (minKg) params.append("from_atm", `${minKg}`);
  if (maxKg) params.append("to_atm", `${maxKg}`);
  if (from_length) params.append("from_length", `${from_length}`);
  if (to_length) params.append("to_length", `${to_length}`);
  if (acustom_fromyears)
    params.append("acustom_fromyears", `${acustom_fromyears}`);
  if (acustom_toyears) params.append("acustom_toyears", `${acustom_toyears}`);
  if (condition)
    params.append("condition", condition.toLowerCase().replace(/\s+/g, "-"));
  if (filters.sleeps) params.append("sleep", filters.sleeps);
  if (orderby) params.append("orderby", orderby);
  if (radius_kms) params.append("radius_kms", radius_kms);
  if (from_sleep) params.append("from_sleep", `${from_sleep}`);
  if (to_sleep) params.append("to_sleep", `${to_sleep}`);

  // NEW: Pass shuffle_seed to API for deterministic shuffle (CDN cache variants)
  if (shuffle_seed) params.append("shuffle_seed", `${shuffle_seed}`);

  // Tells the Cloudflare Worker this page is indexed/curated and eligible for KV
  // caching. Non-indexed (long-tail) requests omit this and are always live-proxied.
  if (indexed) params.append("indexed", "1");

  const s = normalizeQuery(search);
  if (s) params.append("search", s);

  // Client-side: use internal proxy to avoid CORS. Server-side: call admin API directly.
  const isClient = typeof window !== "undefined";
  const url = isClient
    ? `/api/listings/?${params.toString()}`
    : `${API_BASE}/new_optimize_code?${params.toString()}`;

  const controller = new AbortController();
  const timeoutMs = Number(process.env.CFS_API_TIMEOUT_MS) || 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(!isClient && process.env.CFS_API_KEY
          ? { "X-API-Key": process.env.CFS_API_KEY }
          : {}),
      },
      ...(!isClient && { cache: 'no-store' }),
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === "AbortError") {
      console.error("[BACKEND ERROR] API no response — timed out after 30s:", url);
      throw new Error("API no response — timed out after 30s");
    }

    // iOS Safari "Load failed" — network offline or CORS
    console.error("[FRONTEND ERROR] Fetch failed — client cannot reach server:", err?.message, url);
    throw new Error("Fetch failed: " + (err?.message ?? "Load failed"));
  }

  clearTimeout(timeoutId);

  if (!res.ok) {
    const errText = await res.text();

    // WordPress returns HTTP 410 for 0-product pages — parse body and return data normally
    if (res.status === 410) {
      try {
        const idx410 = errText.indexOf('{"');
        const json: ApiResponse = JSON.parse(idx410 > 0 ? errText.substring(idx410) : errText);
        return {
          success: json.success,
          list_page_title: json.h1,
          seo_v2: json.seo_v2,
          pagination: json.pagination,
          data: {
            products: json.data?.products ?? [],
            exclusive_products: json.data?.exclusive_products ?? [],
            emp_exclusive_products: json.emp_exclusive_products ?? json.data?.emp_exclusive_products ?? [],
            featured_products: json.data?.featured_products ?? [],
            premium_products: json.data?.premium_products ?? [],
            make_options: json.data?.make_options ?? [],
            model_options: json.data?.model_options ?? [],
            all_categories: json.data?.all_categories ?? [],
            states: json.data?.states ?? [],
          },
        };
      } catch {
        // JSON parse failed — still return empty data so noindex is set correctly
        return {
          success: false,
          data: {
            products: [],
            exclusive_products: [],
            emp_exclusive_products: [],
            featured_products: [],
            premium_products: [],
            make_options: [],
            model_options: [],
            all_categories: [],
            states: [],
          },
        };
      }
    }

    if (res.status >= 500) {
      console.error(`[BACKEND ERROR] HTTP ${res.status} from API:`, errText.substring(0, 300));
      throw new Error(`Backend server error (HTTP ${res.status})`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Missing or invalid API key");
    }
    if (res.status === 404) {
      throw new Error("API endpoint not found (404)");
    }
    throw new Error(`API failed: HTTP ${res.status}`);
  }

  const raw = await res.text();
  let json: ApiResponse;
  try {
    // Fast path — clean response
    json = JSON.parse(raw);
  } catch {
    // WordPress WP_DEBUG ON can prepend PHP notices before JSON.
    // Find the start of the actual JSON object ({"success":...) and retry.
    const jsonIdx = raw.indexOf('{"');
    if (jsonIdx > 0) {
      try {
        json = JSON.parse(raw.substring(jsonIdx));
      } catch {
        console.error("[BACKEND ERROR] Invalid JSON from API (after strip):", raw.substring(0, 300));
        throw new Error("Invalid API response — unexpected non-JSON reply");
      }
    } else {
      console.error("[BACKEND ERROR] Invalid JSON from API:", raw.substring(0, 300));
      throw new Error("Invalid API response — unexpected non-JSON reply");
    }
  }

  const result: ApiResponse = {
    success: json.success,
    list_page_title: json.h1,
    seo_v2: json.seo_v2,
    pagination: json.pagination,
    data: {
      products: json.data?.products ?? [],
      exclusive_products: json.data?.exclusive_products ?? [],
      emp_exclusive_products: json.emp_exclusive_products ?? json.data?.emp_exclusive_products ?? [],
      featured_products: json.data?.featured_products ?? [],
      premium_products: json.data?.premium_products ?? [],
      make_options: json.data?.make_options ?? [],
      model_options: json.data?.model_options ?? [],
      all_categories: json.data?.all_categories ?? [],
      states: json.data?.states ?? [],
    },
  };

  return result;
};

// Re-export for page imports
export { fetchListings as getCachedListings };
