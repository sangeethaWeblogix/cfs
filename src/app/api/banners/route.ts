
// src/app/api/banners/route.ts
import { NextResponse } from "next/server";

const PLACEMENTS = ["listings", "home"];

export async function GET() {
  try {
    const results = await Promise.allSettled(
      PLACEMENTS.map(async (placement) => {
        const url = `http://admin.caravansforsale.com.au/wp-json/ads-manager/v1/banners?placement=${placement}&limit=50&paged=1`; // ✅ http://

        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          cache: "no-store",
        });

        if (!res.ok) {
          console.error(`❌ ${placement}: ${res.status}`);
          return [];
        }

        const raw = await res.text();
        const idx = raw.search(/[[{]/);
        if (idx === -1) return [];
        let data;
        try {
          data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
        } catch {
          return [];
        }
        return Array.isArray(data) ? data : data.data || [];
      })
    );

    const merged = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : []
    );

    const unique = merged.filter(
      (banner, index, self) =>
        index === self.findIndex((b) => b.id === banner.id)
    );

    console.log(`✅ Total banners: ${unique.length}`);
    return NextResponse.json(unique);

  } catch (error) {
    console.error("🔴 Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}