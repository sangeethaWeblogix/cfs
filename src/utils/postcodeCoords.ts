import { haversineKm } from "./distanceCalc";

async function fetchPincodeCoords(pincode: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&countrycodes=au&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "caravansforsale.com.au contact@caravansforsale.com.au",
          "Accept-Language": "en",
        },
        next: { revalidate: false }, // Permanently cached by Next.js data cache
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.length > 0
      ? [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      : null;
  } catch {
    return null;
  }
}

export async function calculateDistances(
  searchPincode: string,
  productPincodes: string[]
): Promise<Record<string, number>> {
  const uniquePincodes = [...new Set([searchPincode, ...productPincodes])].filter(
    (p) => /^\d{4}$/.test(p)
  );

  const results = await Promise.allSettled(
    uniquePincodes.map(async (pincode) => ({ pincode, coords: await fetchPincodeCoords(pincode) }))
  );

  const coordsMap: Record<string, [number, number] | null> = {};
  for (const r of results) {
    if (r.status === "fulfilled") coordsMap[r.value.pincode] = r.value.coords;
  }

  const fromCoords = coordsMap[searchPincode];
  if (!fromCoords) return {};

  const distances: Record<string, number> = {};
  for (const pincode of productPincodes) {
    const toCoords = coordsMap[pincode];
    if (toCoords) {
      distances[pincode] = haversineKm(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1]);
    }
  }
  return distances;
}
