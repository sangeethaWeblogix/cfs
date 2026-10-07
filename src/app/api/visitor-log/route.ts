import { NextRequest, NextResponse } from "next/server";
import { readVisitorLog } from "@/lib/visitorCheck";

export const dynamic = "force-dynamic";

/* GET /api/visitor-log/?key=VISITOR_LOG_SECRET[&limit=200][&status=eligible|suspicious|unknown]
   Returns screening counts, the latest screened visitors and the latest qualified visitors. */
export async function GET(request: NextRequest) {
  const secret = process.env.VISITOR_LOG_SECRET;
  const key = request.nextUrl.searchParams.get("key");
  if (!secret || key !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 200, 1), 5000);
  const status = request.nextUrl.searchParams.get("status");

  const { configured, counts, records, qualified } = await readVisitorLog(limit);
  const filtered = status ? records.filter(r => r.status === status) : records;

  return NextResponse.json(
    { redisConfigured: configured, counts, qualified, returned: filtered.length, records: filtered },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
  );
}
