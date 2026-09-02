import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? "";

  if (!category) {
    return NextResponse.json({ success: false, message: "category param is required" }, { status: 400 });
  }

  const url = `${API_BASE}/market_snapshot?category=${encodeURIComponent(category)}`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 3600 }, // match WP transient TTL
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ success: false }, { status: res.status });
    }

    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const data = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const status = err?.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ success: false }, { status });
  }
}
