import { NextRequest, NextResponse } from "next/server";
import { readVisitorLog } from "@/lib/visitorCheck";

export const dynamic = "force-dynamic";

const MAXMIND_INSIGHTS_COST_USD = 0.002;

/* GET /api/visitor-log/?key=VISITOR_LOG_SECRET
     [&minutes=30]   only records from the last N minutes (+ a usage summary)
     [&limit=200]    max records returned
     [&status=eligible|suspicious|unknown]
     [&source=maxmind|ip_cache|ua|geo|error]
   Returns screening counts, the latest screened visitors and the latest qualified visitors. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const secret = process.env.VISITOR_LOG_SECRET;
  if (!secret || params.get("key") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Math.max(Number(params.get("limit")) || 200, 1), 5000);
  const minutes = Number(params.get("minutes")) || 0;
  const status = params.get("status");
  const source = params.get("source");

  // With a time window, scan the whole log (max 5000) so the summary is complete
  const { configured, counts, records, qualified } = await readVisitorLog(minutes > 0 ? 5000 : limit);

  const since = minutes > 0 ? Date.now() - minutes * 60_000 : 0;
  const inWindow = since ? records.filter(r => Date.parse(r.time) >= since) : records;

  let summary;
  if (since) {
    const tally = (key: "source" | "status") =>
      inWindow.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r[key]]: (acc[r[key]] ?? 0) + 1 }), {});
    const lookups = inWindow.filter(r => r.source === "maxmind").length;
    summary = {
      window: `last ${minutes} minutes`,
      screened: inWindow.length,
      maxmindLookups: lookups,
      estimatedCostUsd: Number((lookups * MAXMIND_INSIGHTS_COST_USD).toFixed(4)),
      bySource: tally("source"),
      byStatus: tally("status"),
      qualified: qualified.filter((q: any) => Date.parse(q.time) >= since).length,
    };
  }

  const filtered = inWindow
    .filter(r => (!status || r.status === status) && (!source || r.source === source))
    .slice(0, limit);

  return NextResponse.json(
    { redisConfigured: configured, summary, counts, qualified: since ? undefined : qualified, returned: filtered.length, records: filtered },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
  );
}
