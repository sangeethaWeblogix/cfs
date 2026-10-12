import { NextRequest, NextResponse } from "next/server";
import { getEligibilities, readVisitorLog } from "@/lib/visitorCheck";

export const dynamic = "force-dynamic";

const MAXMIND_INSIGHTS_COST_USD = 0.002;

/* GET /api/visitor-log/?key=VISITOR_LOG_SECRET
     [&minutes=30]   only records from the last N minutes (+ a usage summary)
     [&limit=200]    max records returned
     [&status=eligible|suspicious|unknown]
     [&source=maxmind|ip_cache|ua|geo|error]
     [&qualified=1|0] only visitors who did / didn't qualify
   Returns screening counts, the latest screened visitors and the latest qualified visitors.
   Each record carries visitorStatus (as | uk | ps) and `qualified` (when / rule / source, or false). */
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
  const qualifiedParam = params.get("qualified");   // "1" = only qualified visitors, "0" = only not qualified

  // With a time window, scan the whole log (max 5000) so the summary is complete
  const { configured, counts, records, qualified } = await readVisitorLog(minutes > 0 ? 5000 : limit);

  const since = minutes > 0 ? Date.now() - minutes * 60_000 : 0;
  const inWindow = since ? records.filter(r => Date.parse(r.time) >= since) : records;
  const qualifiedInWindow = since ? qualified.filter((q: any) => Date.parse(q.time) >= since) : qualified;

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
      qualified: qualifiedInWindow.length,
    };
  }

  const matching = inWindow.filter(r => (!status || r.status === status) && (!source || r.source === source));

  // Attach each visitor's qualification (stored separately, 30 days) to their screening records.
  // Declared crawlers get a random ID per request and never qualify, so they're skipped.
  const toJoin = qualifiedParam ? matching : matching.slice(0, limit);
  const vids = [...new Set(toJoin.filter(r => r.source !== "ua").map(r => r.vid as string))];
  const elig = await getEligibilities(vids);

  const filtered = toJoin
    .map(r => {
      const q = elig.get(r.vid);
      return {
        ...r,
        visitorStatus: r.status === "suspicious" ? "as" : q ? "ps" : "uk",
        qualified: q
          ? { time: q.time, rule: q.rule, activeSeconds: q.activeSeconds, entrySource: q.entrySource, entryMedium: q.entryMedium }
          : false,
      };
    })
    .filter(r => !qualifiedParam || (qualifiedParam === "1") === !!r.qualified)
    .slice(0, limit);

  return NextResponse.json(
    { redisConfigured: configured, summary, counts, qualified: qualifiedInWindow, returned: filtered.length, records: filtered },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
  );
}
