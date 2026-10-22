const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;
const SERVER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const MAX_ATTEMPTS = 2;
const ATTEMPT_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 400;

export type FeaturedListing = {
  id: number;
  name: string;
  slug: string;
  condition: string;
  location: string;
  state?: string;
  regular_price: string;
  sale_price: string;
  categories: string[];
  image_format: string[];
  seller_type?: string;
  berths?: string | number;
};

// Normalize each product so components always get the fields they expect
// (WP home-featured returns title/category/r2_thumbnails instead of name/categories/image_format)
function normalizeProduct(p: any): FeaturedListing {
  if (!p.name) p.name = p.title ?? "";
  if (!p.categories) {
    p.categories = Array.isArray(p.category) ? p.category : p.category ? [p.category] : [];
  }
  if (!p.location) {
    p.location = [p.suburb, p.region, p.state]
      .filter(Boolean)
      .map((s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()))
      .slice(0, 2)
      .join(", ");
  }
  if (!p.image_format) {
    const img = p.thumbnail ?? p.image ?? p.main_image ?? p.r2_thumbnails?.[0] ?? null;
    p.image_format = img ? [img] : [];
  } else if (typeof p.image_format === "string") {
    p.image_format = [p.image_format];
  }
  if (!p.seller_type) p.seller_type = "dealer";
  return p;
}

export async function fetchHomeFeatured(params: {
  type?: "all" | "new" | "used";
  seed?: number;
  category?: string;
  visitorIp?: string;
}): Promise<FeaturedListing[]> {
  const { type = "all", seed, category, visitorIp } = params;

  if (!API_BASE) return [];

  const url = `${API_BASE}/home-featured?type=${encodeURIComponent(type)}${
    seed ? `&seed=${encodeURIComponent(seed)}` : ""
  }${category ? `&category=${encodeURIComponent(category)}` : ""}`;

  // The home page HTML is CDN-cached for 24h, so a single failed call here (→ [])
  // would be baked into the cached page for every visitor — retry before giving up.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt - 1)));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    const tag = `[home_featured] type=${type} (attempt ${attempt}/${MAX_ATTEMPTS})`;

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": SERVER_UA,
          ...(API_KEY && { "X-Secret-Key": API_KEY }),
          ...(visitorIp && { "X-Visitor-IP": visitorIp }),
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error(`${tag} non-OK status: ${res.status}`);
        continue;
      }

      const raw = await res.text();

      if (raw.includes("sgcaptcha") || raw.includes("cf-chl") || raw.trimStart().startsWith("<html")) {
        console.error(`${tag} CLOUDFLARE CHALLENGE blocked request`);
        continue;
      }

      const jsonStart = raw.indexOf("{");
      const json = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);

      const rawProducts: any[] = json?.items ?? json?.products ?? json?.data?.products ?? [];
      return rawProducts.map(normalizeProduct);
    } catch (err: any) {
      console.error(`${tag} fetch error:`, err?.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return [];
}
