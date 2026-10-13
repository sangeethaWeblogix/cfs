// src/api/requirements/api.ts
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export type Requirement = {
  id?: number; // if the API returns one
  featured?: "0" | "1";
  type: string; // e.g., "Hybrid"
  condition: string; // e.g., "Used" | "New"
  location: string; // e.g., "2033"
  requirements: string; // text
  budget: string; // number as string
  active?: "0" | "1";
  created_at?: string;
};

type ListResp = {
  success: boolean;
  data: Requirement[]; // screenshot shows an array under data
};

export async function fetchRequirements(): Promise<Requirement[]> {
  if (!API_BASE) return [];
  const url = `${API_BASE}/get-home-enquiries-list`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-Secret-Key": API_KEY }),
      },
    });
    if (!res.ok) return [];
    const json: ListResp = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

 