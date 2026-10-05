const API_KEY = process.env.CFS_API_KEY;
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

// Bulk impression endpoint — takes an array of numeric product ids in one
// call instead of one request per product (see /api/track for the old
// single-slug version this replaces on the listings grid).
export async function POST(req: Request) {
  try {
    const { ids } = await req.json();
    const cleanIds = Array.isArray(ids)
      ? ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
      : [];
    if (cleanIds.length === 0) return Response.json({ success: false });

    await fetch(`${API_BASE}/impressions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { "X-Secret-Key": API_KEY }),
      },
      body: JSON.stringify({ ids: cleanIds }),
    });

    return Response.json({ success: true });
  } catch (_e) {
    return Response.json({ success: false });
  }
}
