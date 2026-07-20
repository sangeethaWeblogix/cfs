// src/api/homeSearch/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export interface KeywordSuggestion {
  keyword: string;
  url: string;
  id: string | number;
}
// export type HomeSearchItem = Record<string, unknown>;
export interface HomeSearchItem {
  id: string | number;
  name?: string;
  url?: string;
}
type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function extractList(payload: unknown): HomeSearchItem[] {
  if (!isRecord(payload)) return [];

  // prefer payload.data when it's an object, else use payload itself
  const d: unknown = isRecord(payload.data) ? payload.data : payload;

  // common shapes
  if (isRecord(d) && Array.isArray(d.home_search)) {
    return d.home_search as HomeSearchItem[];
  }
  if (isRecord(d) && Array.isArray(d.items)) {
    return d.items as HomeSearchItem[];
  }

  // fallback: first array under `data` (or under root)
  if (isRecord(d)) {
    const firstArrayUnderData = Object.values(d).find(Array.isArray) as
      | unknown[]
      | undefined;
    if (Array.isArray(firstArrayUnderData)) {
      return firstArrayUnderData as HomeSearchItem[];
    }
  }

  const firstArrayAtRoot = Object.values(payload).find(Array.isArray) as
    | unknown[]
    | undefined;

  return (firstArrayAtRoot as HomeSearchItem[]) ?? [];
}

export async function fetchHomeSearchList(): Promise<HomeSearchItem[]> {
  const url = `/api/home-search`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HomeSearch API failed: ${res.status}`);

  try {
    const json = await res.json();
    return extractList(json);
  } catch {
    return [];
  }
}

export async function fetchKeywordSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<KeywordSuggestion[]> {
  const url = `/api/home-search/?keyword=${encodeURIComponent(query)}`;

  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`Keyword API failed: ${res.status}`);

  let json: { success?: boolean; data?: { keyword?: string; url?: string; id?: string | number }[] };
  try {
    json = await res.json();
  } catch {
    return [];
  }

  const arr = Array.isArray(json?.data) ? json.data : [];

  // ✅ return both keyword + url
  return arr
    .map((x) => ({
      id: x?.id ?? "",
      keyword: String(x?.keyword ?? "").trim(),
      url: String(x?.url ?? "").trim(),
    }))
    .filter((x) => !!x.keyword);
}
