// src/api/sitemapSearchKeyword/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
 const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export async function fetchSearchkeywords(
  signal?: AbortSignal
): Promise<{ name: string; url: string }[]> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");

  const url = `${API_BASE}/search-keyword`;

  const res = await fetch(url, {headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
      }, cache: "no-store", signal });
  if (!res.ok) throw new Error(`Keyword API failed: ${res.status}`);

  let json: { success?: boolean; data?: { name?: string; url?: string }[] };
  try {
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    json = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
  } catch {
    return [];
  }

  const arr = Array.isArray(json?.data) ? json.data : [];

  // ✅ Return full object (not just name)
  const result = arr.map((x) => ({
    name: x?.name?.trim() || "",
    url: x?.url?.trim() || "",
  }));

  // console.log("✅ Keywords fetched:", result);
  return result;
}
