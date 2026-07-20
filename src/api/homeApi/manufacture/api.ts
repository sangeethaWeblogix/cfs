const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export const fetchManufactures = async () => {
  try {
    const res = await fetch(`${API_BASE}/manufacturer-based-caravans-list`, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.manufacturers || [];
  } catch {
    return [];
  }
};
