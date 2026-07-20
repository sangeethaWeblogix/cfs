import { NextResponse } from "next/server";
const API_KEY = process.env.CFS_API_KEY; // ✅ Added

export async function POST(req: Request) {
  try {
    const { product_id } = await req.json();

    const ip = req.headers.get("x-forwarded-for") || "";
    const user_agent = req.headers.get("user-agent") || "";

    // 🔥 Call WordPress API from server (hidden)
    await fetch(
      "https://admin.caravansforsale.com.au/wp-json/cfs/v1/update-clicks",
      {
        method: "POST",
       headers: {
          "Content-Type": "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
        },
        body: JSON.stringify({
          product_id,
          ip,
          user_agent,
        }),
      }
    );

    await fetch(
      "https://admin.caravansforsale.com.au/wp-json/cfs/v1/update-impressions",
      {
        method: "POST",
       headers: {
          "Content-Type": "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
        },
        body: JSON.stringify({
          product_id,
          ip,
          user_agent,
        }),
      }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";

    return NextResponse.json({ error: true, });
  }
}