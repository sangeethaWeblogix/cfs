// src/api/homeSearch/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export async function fetchKeywordSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<string[]> {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");
  const url = `${API_BASE}/home_search/?keyword=${encodeURIComponent(query)}`;

  const res = await fetch(url, {  headers: {
    Accept: "application/json",
    ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Missing — add this
  }, cache: "no-store", signal });
  if (!res.ok) throw new Error(`Keyword API failed: ${res.status}`);

  let json: { success?: boolean; data?: { keyword?: string }[] };
  try {
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    json = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
  } catch {
    return [];
  }

  const arr = Array.isArray(json?.data) ? json!.data! : [];
  return arr.map((x) => String(x?.keyword ?? "")).filter(Boolean);
}
