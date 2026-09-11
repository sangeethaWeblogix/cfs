const API_KEY = process.env.CFS_API_KEY;
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) return Response.json({ success: false });

    await fetch(`${API_BASE}/impression?slug=${encodeURIComponent(slug)}`, {
      headers: {
        ...(API_KEY && { "X-Secret-Key": API_KEY }),
      },
    });

    return Response.json({ success: true });
  } catch (_e) {
    return Response.json({ success: false });
  }
}
