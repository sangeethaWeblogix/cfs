import { NextResponse } from "next/server";
const API_KEY = process.env.CFS_API_KEY;
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ success: false });

    // Without this, WP sees the outbound request coming from our own server
    // (this route calls WP server-side) and records OUR server's IP/location
    // as the visitor's — e.g. an AWS Sydney IP for every single click, no
    // matter where the real visitor is. Forward the real visitor's IP/UA so
    // WP's click/impression logging attributes them correctly.
    const visitorIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || "";

    const headers = {
      ...(API_KEY && { "X-Secret-Key": API_KEY }),
      ...(visitorIp && { "X-Forwarded-For": visitorIp, "X-Real-IP": visitorIp }),
      ...(userAgent && { "User-Agent": userAgent }),
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
