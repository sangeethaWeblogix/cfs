import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const pincodes = (req.nextUrl.searchParams.get("p") ?? "")
    .split(",")
    .filter((p) => /^\d{4}$/.test(p.trim()))
    .map((p) => p.trim());

  if (pincodes.length === 0) {
    return NextResponse.json({});
  }

  const coords: Record<string, [number, number] | null> = {};

  await Promise.allSettled(
    pincodes.map(async (pincode) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&countrycodes=au&format=json&limit=1`,
          {
            headers: {
              "User-Agent": "caravansforsale.com.au contact@caravansforsale.com.au",
              "Accept-Language": "en",
            },
            next: { revalidate: false },
          }
        );
        if (!res.ok) { coords[pincode] = null; return; }
        const data = await res.json();
        coords[pincode] =
          data.length > 0
            ? [parseFloat(data[0].lat), parseFloat(data[0].lon)]
            : null;
      } catch {
        coords[pincode] = null;
      }
    })
  );

  return NextResponse.json(coords, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
