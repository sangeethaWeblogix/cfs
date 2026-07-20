const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
 const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

// api/productList/api.ts
 export const fetchMakeDetails = async () => {
  try {
    const res = await fetch(`${API_BASE}/make_details`);
    if (!res.ok) return [];
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    const json = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
    return json?.data?.make_options || [];
  } catch {
    return [];
  }
};


// api/productList/api.ts
export const fetchModelsByMake = async (make: string) => {
  let json: { data?: { model_options?: { name: string; slug: string }[] } };
  try {
    const res = await fetch(`${API_BASE}/new-list?make=${make}`, {
      headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
      },
    });
    if (!res.ok) return [];
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    json = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
  } catch {
    return [];
  }
  const modelOptions = json?.data?.model_options || [];
  return modelOptions.map((m: { name: string; slug: string }) => ({
    name: m.name,
    slug: m.slug,
  }));
};
