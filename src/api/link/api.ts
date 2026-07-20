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
    ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Missing — add this
  },
    });

    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
};