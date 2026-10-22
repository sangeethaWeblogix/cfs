import { fetchBlogs } from "@/api/blog/api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_STORE = { headers: { "Cache-Control": "no-store" } };
// A good response is shared on the CDN for 60s so every home view doesn't hit WordPress.
const SHORT_CACHE = { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } };

export async function GET() {
  try {
    const data = await fetchBlogs(1);
    // Never cache a failure (fetchBlogs returns empty items + error instead of throwing)
    if (data.error || !data.items.length) return NextResponse.json([], NO_STORE);
    return NextResponse.json(data.items, SHORT_CACHE);
  } catch {
    return NextResponse.json([], NO_STORE);
  }
}
