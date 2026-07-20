import { fetchBlogs } from "@/api/blog/api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_STORE = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  try {
    const data = await fetchBlogs(1);
    return NextResponse.json(data.items, NO_STORE);
  } catch {
    return NextResponse.json([], NO_STORE);
  }
}
