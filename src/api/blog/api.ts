const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image: string;
  slug: string;
  date: string;
}

interface RawBlogPost {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  slug: string;
  date: string;
  featured_image?: string;
}

export interface BlogApiResponse {
  success: boolean;
  data: RawBlogPost[];
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export type BlogPageResult = {
  items: BlogPost[];
  currentPage: number;
  totalPages: number;
  total_pages: number;
  error?: boolean;
};

const FETCH_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;

// WP occasionally stores featured_image with a doubled protocol
// (e.g. "https://https://...") from a bad copy-paste in the admin — that
// malformed URL crashes next/image's hostname check and takes down the
// whole page for every visitor. Collapse it instead of passing it through.
const sanitizeImageUrl = (url: string): string =>
  url.replace(/^(https?:\/\/)+(?=https?:\/\/)/i, "");

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-Secret-Key": API_KEY }), // ✅ API key added
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

export const fetchBlogs = async (page: number = 1): Promise<BlogPageResult> => {
  if (!API_BASE) {
    console.error("❌ CFS_API_BASE env missing"); // ✅ Server log
    return { items: [], currentPage: page, totalPages: 1, total_pages: 1, error: true };
  }

  const url = `${API_BASE}/blog?vehicle_type=caravans&page=${page}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[Blog API] GET ${url} (attempt ${attempt}/${MAX_ATTEMPTS})`); // ✅ Server terminal-ல் தெரியும்
    try {
      const res = await fetchWithTimeout(url);

      if (!res.ok) {
        console.error(`❌ Blog API failed: ${res.status} (attempt ${attempt}/${MAX_ATTEMPTS})`);
        lastErr = new Error(`Blog API status ${res.status}`);
        continue;
      }

      const raw = await res.text();
      const idx = raw.indexOf('{"');
      const data = JSON.parse(idx >= 0 ? raw.substring(idx) : raw) as BlogApiResponse;

      const items: BlogPost[] = (data?.data ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        excerpt: p.excerpt,
        link: p.link,
        slug: p.slug,
        date: p.date,
        image: p.featured_image ? sanitizeImageUrl(p.featured_image) : "",
      }));

      return {
        items,
        currentPage: data?.meta?.page ?? page,
        totalPages: data?.meta?.total_pages ?? 1,
        total_pages: data?.meta?.total_pages ?? 1,
      };
    } catch (err) {
      console.error(`❌ fetchBlogs error (attempt ${attempt}/${MAX_ATTEMPTS}):`, err);
      lastErr = err;
    }
  }

  console.error("❌ fetchBlogs: all attempts failed", lastErr);
  return { items: [], currentPage: page, totalPages: 1, total_pages: 1, error: true };
};