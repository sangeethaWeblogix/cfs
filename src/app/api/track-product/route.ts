import { NextResponse } from "next/server";
const API_KEY = process.env.CFS_API_KEY;
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ success: false });

    const headers = {
      ...(API_KEY && { "X-Secret-Key": API_KEY }),
    };

    await Promise.all([
      fetch(`${API_BASE}/click?slug=${encodeURIComponent(slug)}`, { method: "POST", headers }),
      fetch(`${API_BASE}/impression?slug=${encodeURIComponent(slug)}`, { method: "POST", headers }),
    ]);

    return NextResponse.json({ success: true });
  } catch (_e) {
    return NextResponse.json({ error: true });
  }
}
