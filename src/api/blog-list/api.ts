const BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;
export type BlogDetail = {
  slug: string;
  title: string;
  date?: string;
  image?: string; // hero image
  excerpt?: string;
  content_html?: string; // full HTML body
  seo?: { metatitle?: string; metadescription?: string; index?: string };
};

export async function fetchBlogDetail(
  slug: string
): Promise<BlogDetail | null> {
  if (!slug) return null;
  const res = await fetch(
    `${BASE}/blog-detail-new/?slug=${encodeURIComponent(slug)}`,
    {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ API key added
      },
      // cache strategy: tweak as you like
      next: { revalidate: 60 },

    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  // Some APIs wrap in {data: {...}} — unwrap if needed
  return (data?.data ?? data) as BlogDetail;
}
