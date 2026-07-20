 const API_LOCATION = process.env.NEXT_PUBLIC_CFS_API_BASE;
// api/links/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export const fetchLinksData = async (filters: Record<string, any>) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && k !== "page") {
        params.set(k, String(v));
      }
    });
  const res = await fetch(`${API_BASE}/links?${params.toString()}`, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
      },
    });

    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
};
export const fetchLocations = async (keyword: string) => {
  if (!keyword || keyword.trim().length < 2) return [];

  const res = await fetch(
    `/api/location-search/?keyword=${encodeURIComponent(keyword)}`,
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) throw new Error("Location API failed");

  const data = await res.json();

  // ✅ Maintain API order: State → Region → Pincode
  const orderedResults = [
    ...(Array.isArray(data.state_only) ? data.state_only : []),
    ...(Array.isArray(data.region_state) ? data.region_state : []),
    ...(Array.isArray(data.pincode_location_region_state)
      ? data.pincode_location_region_state
      : []),
  ];

  return orderedResults;
};
