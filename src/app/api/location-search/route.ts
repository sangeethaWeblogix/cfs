import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword") ?? "";

  if (!API_BASE) {
    return NextResponse.json({ message: "API base not configured" }, { status: 500 });
  }

  const res = await fetch(
    `${API_BASE}/location-search?keyword=${encodeURIComponent(keyword)}`,
    {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 86400 }, // location data is static — cache for 24h
    }
  );

  const raw = await res.text();
  let json: object;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = { message: raw || "Invalid JSON from server" };
  }

  const response = NextResponse.json(json, { status: res.status });
  response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  return response;
}
