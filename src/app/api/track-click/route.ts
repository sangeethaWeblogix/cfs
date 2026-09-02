const API_KEY = process.env.CFS_API_KEY; // ✅ Added
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Get user IP from headers
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const user_agent = req.headers.get("user-agent") || "";
  console.log("IP:", ip);
  console.log("IPUA:", user_agent);
    // 🔥 Your existing API call (move here)
    await fetch(
      "https://admin.caravansforsale.com.au/wp-json/cfs/v1/update-clicks",
      {
        method: "POST",
       headers: {
          "Content-Type": "application/json",
          ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Added
        },
        body: JSON.stringify({
          product_id: body.product_id,
          ip,
          user_agent,
        }),
      }
    );

    return Response.json({ success: true });
  } catch (_e) {
    return Response.json({ success: false });
  }
}