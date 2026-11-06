import { NextRequest, NextResponse } from "next/server";
import { getEligibilities, readVisitorLog } from "@/lib/visitorCheck";

export const dynamic = "force-dynamic";

const MAXMIND_INSIGHTS_COST_USD = 0.002;

/* GET /api/visitor-log/?key=VISITOR_LOG_SECRET
     [&minutes=30]   only records from the last N minutes (+ a usage summary)
     [&limit=200]    max records returned
     [&status=eligible|suspicious|unknown]
     [&source=maxmind|ip_cache|asn|ua|geo|error]
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

  // ?groupBy=asn → per-network totals only (used by the WP admin "CF Auto-Block" cron). Small response, no extra Redis reads.
  if (params.get("groupBy") === "asn") {
    return NextResponse.json(
      { redisConfigured: configured, window: since ? `last ${minutes} minutes` : "whole log", networks: groupByNetwork(inWindow, qualifiedInWindow) },
      { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
    );
  }

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

/* Per-network (ASN) totals for the screened visitors in the window. Records cached before the ASN number
   was stored only carry the organisation name, so they are grouped by name and matched to the number
   seen on newer records of the same organisation; sampleIps lets the caller resolve it otherwise. */
type NetworkRow = {
  asn: number | null; org: string; total: number; suspicious: number; eligible: number; unknown: number;
  hosting: number; maxmind: number; ipCache: number; qualified: number; uniqueIps: number; sampleIps: string[];
  reasons: Record<string, number>; lastSeen: string;
};

function groupByNetwork(records: any[], qualified: any[]): NetworkRow[] {
  const asnByOrg = new Map<string, number>();
  for (const r of records) if (typeof r.asn === "number" && r.asnOrg) asnByOrg.set(r.asnOrg, r.asn);

  const rows = new Map<string, NetworkRow & { ips: Set<string> }>();
  const keyOf = (asn: number | undefined, org: string | undefined) => {
    const n = typeof asn === "number" ? asn : org ? asnByOrg.get(org) : undefined;
    return { key: n != null ? `asn:${n}` : `org:${org}`, asn: n ?? null };
  };

  for (const r of records) {
    if (r.source === "ua" || r.source === "geo" || !r.asnOrg) continue;   // no network data
    const { key, asn } = keyOf(r.asn, r.asnOrg);
    let row = rows.get(key);
    if (!row) {
      row = { asn, org: r.asnOrg, total: 0, suspicious: 0, eligible: 0, unknown: 0, hosting: 0, maxmind: 0, ipCache: 0,
        qualified: 0, uniqueIps: 0, sampleIps: [], reasons: {}, lastSeen: r.time, ips: new Set() };
      rows.set(key, row);
    }
    row.total++;
    if (r.status === "suspicious") row.suspicious++;
    else if (r.status === "eligible") row.eligible++;
    else row.unknown++;
    if (r.userType === "hosting") row.hosting++;
    if (r.source === "maxmind") row.maxmind++;
    if (r.source === "ip_cache") row.ipCache++;
    for (const reason of r.reasons ?? []) row.reasons[reason] = (row.reasons[reason] ?? 0) + 1;
    if (r.time > row.lastSeen) row.lastSeen = r.time;
    row.ips.add(r.ip);
  }

  for (const q of qualified) {
    if (!q?.asnOrg) continue;
    const row = rows.get(keyOf(q.asn, q.asnOrg).key);
    if (row) row.qualified++;
  }

  return [...rows.values()]
    .map(({ ips, ...row }) => ({ ...row, uniqueIps: ips.size, sampleIps: [...ips].slice(0, 5) }))
    .sort((a, b) => b.suspicious - a.suspicious || b.total - a.total);
}
