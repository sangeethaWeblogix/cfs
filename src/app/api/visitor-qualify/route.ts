import { NextRequest, NextResponse } from "next/server";
import {
  VID_COOKIE, getClientIp, getQualified, getVisitorRecord, isPrivateIp, isScreeningDisabled,
  markQualified, screenVisitor,
} from "@/lib/visitorCheck";
import { matchQualifyRule, type QualifySignals } from "@/utils/qualifyRules";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

/* POST /api/visitor-qualify/  { listingIds: string[], filterUsed: boolean, activeSeconds: number }
   A visitor qualifies when their IP screening is "eligible" AND the engagement signals
   meet one rule (see matchQualifyRule). Called by <VisitorQualifier /> once a rule is met. */
export async function POST(request: NextRequest) {
  if (isScreeningDisabled()) return json({ qualified: false, status: "disabled" });

  const vid = request.cookies.get(VID_COOKIE)?.value;
  if (!vid) return json({ qualified: false, status: "no_visitor" });

  let body: any = {};
  try { body = await request.json(); } catch {}
  const signals: QualifySignals = {
    listingIds: Array.isArray(body?.listingIds) ? body.listingIds.map(String).slice(0, 50) : [],
    filterUsed: body?.filterUsed === true,
    activeSeconds: Math.max(0, Math.min(Number(body?.activeSeconds) || 0, 86400)),
  };

  const already = await getQualified(vid);
  if (already) return json({ qualified: true, rule: already.rule, already: true });

  let record = await getVisitorRecord(vid);
  if (!record) {
    // Screening not stored yet (e.g. cookie set but Redis write failed) — screen once now
    const ip = getClientIp(request.headers);
    if (!ip || isPrivateIp(ip)) return json({ qualified: false, status: "unknown" });
    record = await screenVisitor(vid, ip, "/api/visitor-qualify/", request.headers.get("user-agent") || "", false);
  }

  if (record.status !== "eligible") return json({ qualified: false, status: record.status });

  const rule = matchQualifyRule(signals);
  if (!rule) return json({ qualified: false, status: "eligible", reason: "rules_not_met" });

  await markQualified(record, rule, signals);
  return json({ qualified: true, rule });
}
