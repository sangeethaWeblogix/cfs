 const MPN_BLOG_BASE = process.env.MPN_API_BASE ?? "https://admin.marketplacenetwork.com.au/wp-json/mpn/v1";
const MPN_API_KEY   = process.env.MPN_API_KEY;
const PER_PAGE = 12;

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image: string;
  slug: string;
  date: string;
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

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(MPN_API_KEY && { Authorization: `Bearer ${MPN_API_KEY}` }),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

export const fetchBlogs = async (page: number = 1): Promise<BlogPageResult> => {
  const url = `${MPN_BLOG_BASE}/blog?vehicle_type=caravans&per_page=${PER_PAGE}&page=${page}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[Blog API] GET ${url} (attempt ${attempt}/${MAX_ATTEMPTS})`);
    try {
      const res = await fetchWithTimeout(url);

      if (!res.ok) {
        console.error(`❌ Blog API failed: ${res.status} (attempt ${attempt}/${MAX_ATTEMPTS})`);
        lastErr = new Error(`Blog API status ${res.status}`);
        continue;
      }

      const data = await res.json();
      const posts: BlogPost[] = (data?.data ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        excerpt: p.excerpt,
        link: p.link,
        image: p.featured_image ?? p.image ?? "",
        slug: p.slug,
        date: p.date,
      }));

      const totalPages = data?.meta?.total_pages ?? 1;

      return {
        items: posts,
        currentPage: page,
        totalPages,
        total_pages: totalPages,
      };
    } catch (err) {
      console.error(`❌ fetchBlogs error (attempt ${attempt}/${MAX_ATTEMPTS}):`, err);
      lastErr = err;
    }
  }

  console.error("❌ fetchBlogs: all attempts failed", lastErr);
  return { items: [], currentPage: page, totalPages: 1, total_pages: 1, error: true };
};