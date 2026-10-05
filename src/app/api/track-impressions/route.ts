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

    // Without this, WP sees the outbound request coming from our own server
    // (this route calls WP server-side) and records OUR server's IP/location
    // as the visitor's, instead of the real visitor's. Same fix as
    // /api/track-product/ — forward the real visitor's IP/UA.
    const visitorIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || "";

    await fetch(`${API_BASE}/impressions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { "X-Secret-Key": API_KEY }),
        ...(visitorIp && { "X-Forwarded-For": visitorIp, "X-Real-IP": visitorIp }),
        ...(userAgent && { "User-Agent": userAgent }),
      },
      body: JSON.stringify({ ids: cleanIds }),
    });

    return Response.json({ success: true });
  } catch (_e) {
    return Response.json({ success: false });
  }
}
