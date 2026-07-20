import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

export async function GET(req: NextRequest) {
  if (!API_BASE) {
    return NextResponse.json({ error: "Missing API base" }, { status: 500 });
  }

  const keyword = req.nextUrl.searchParams.get("keyword");
  const url = keyword
    ? `${API_BASE}/home_search_new?keyword=${encodeURIComponent(keyword)}`
    : `${API_BASE}/home_search_new`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API failed: ${res.status}` },
        { status: res.status }
      );
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ error: "Invalid upstream response" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
