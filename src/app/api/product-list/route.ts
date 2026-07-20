import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;

export async function GET() {
  if (!API_BASE) {
    return NextResponse.json({ message: "API base not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_BASE}/params-product-list`, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      next: { revalidate: 3600 },
    });

    const raw = await res.text();
    let json: object;
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      json = { message: raw || "Invalid JSON from server" };
    }

    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
