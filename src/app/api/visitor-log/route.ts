import { NextRequest, NextResponse } from "next/server";
import { readVisitorLog } from "@/lib/visitorCheck";

export const dynamic = "force-dynamic";

/* GET /api/visitor-log?key=VISITOR_LOG_SECRET[&limit=200][&status=bot]
   Returns the latest visitor-check records from Upstash Redis. */
export async function GET(request: NextRequest) {
  const secret = process.env.VISITOR_LOG_SECRET;
  const key = request.nextUrl.searchParams.get("key");
  if (!secret || key !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 200, 1), 5000);
  const status = request.nextUrl.searchParams.get("status");

  const { configured, counts, records } = await readVisitorLog(limit);
  const filtered = status ? records.filter(r => r.status === status) : records;

  return NextResponse.json(
    { redisConfigured: configured, counts, returned: filtered.length, records: filtered },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
  );
}
