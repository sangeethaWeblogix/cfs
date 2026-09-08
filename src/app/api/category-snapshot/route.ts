import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? "";

  if (!category) {
    return NextResponse.json({ success: false, message: "category param is required" }, { status: 400 });
  }

  const url = `${API_BASE}/market-snapshot?category=${encodeURIComponent(category)}`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-Secret-Key": API_KEY }),
      },
      next: { revalidate: 3600 }, // match WP transient TTL
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ success: false }, { status: res.status });
    }

    const raw = await res.text();

    // SiteGround bot-challenge pages return HTTP 200/202 with an HTML captcha
    // redirect instead of JSON — detect it explicitly so a challenge shows up
    // in logs instead of silently failing JSON.parse and returning empty data.
    if (raw.includes("sgcaptcha") || raw.trimStart().startsWith("<html")) {
      console.error(`[category-snapshot] BOT CHALLENGE blocked request | url="${url}"`);
      return NextResponse.json({ success: false, error: "bot_challenge" }, { status: 503 });
    }

    const jsonStart = raw.indexOf("{");
    let data: any;
    try {
      data = JSON.parse(jsonStart > 0 ? raw.substring(jsonStart) : raw);
    } catch {
      console.error(`[category-snapshot] JSON parse failed | preview="${raw.slice(0, 200)}"`);
      return NextResponse.json({ success: false, error: "invalid_json" }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const status = err?.name === "AbortError" ? 504 : 500;
    return NextResponse.json({ success: false }, { status });
  }
}
