import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY;

export async function POST(req: NextRequest) {
  if (!API_BASE) {
    return NextResponse.json({ message: "API base not configured" }, { status: 500 });
  }
  console.log("[enquiry] API_KEY present:", !!API_KEY, "length:", API_KEY?.length ?? 0);

  const payload = await req.json();

  const res = await fetch(`${API_BASE}/product_enquiry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(API_KEY && { "X-API-Key": API_KEY }),
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let json: object;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = { message: raw || "Invalid JSON from server" };
  }

  return NextResponse.json(json, { status: res.status });
}
