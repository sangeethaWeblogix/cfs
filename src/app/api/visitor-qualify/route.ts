import { NextRequest, NextResponse } from "next/server";
import {
  VID_COOKIE, SCREEN_COOKIE, VID_MAX_AGE_S, SCREEN_TTL_S,
  getClientIp, getEligibility, getScreening, ipFingerprint, isPrivateIp, isScreeningDisabled, isValidVid,
  markEligible, screenVisitor, type ScreenTrigger,
} from "@/lib/visitorCheck";
import { matchQualifyRule, type QualifySignals } from "@/utils/qualifyRules";

export const dynamic = "force-dynamic";

const json = (body: unknown) =>
  NextResponse.json(body, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

/* POST /api/visitor-qualify/  { listingIds: string[], filterUsed: boolean, activeSeconds: number }
   Remarketing eligibility = IP screening "eligible" (for the visitor's CURRENT IP)
   AND one engagement rule met (see matchQualifyRule). Called by <VisitorQualifier />. */
export async function POST(request: NextRequest) {
  if (isScreeningDisabled()) return json({ qualified: false, status: "disabled" });

  let body: any = {};
  try { body = await request.json(); } catch {}
  const signals: QualifySignals = {
    listingIds: Array.isArray(body?.listingIds) ? body.listingIds.map(String).slice(0, 50) : [],
    filterUsed: body?.filterUsed === true,
    activeSeconds: Math.max(0, Math.min(Number(body?.activeSeconds) || 0, 86400)),
  };

  const rule = matchQualifyRule(signals);
  if (!rule) return json({ qualified: false, reason: "rules_not_met" });

  const cookieVid = request.cookies.get(VID_COOKIE)?.value;
  const vid = isValidVid(cookieVid) ? cookieVid : crypto.randomUUID();

  const already = isValidVid(cookieVid) ? await getEligibility(vid) : null;
  if (already) return json({ qualified: true, rule: already.rule, already: true });

  const ip = getClientIp(request.headers);
  if (!ip || isPrivateIp(ip)) return json({ qualified: false, status: "unknown" });

  // Screen before firing eligibility if there is no current screening for this IP
  // (e.g. visitor only browsed blog pages, screening expired, or IP changed)
  let record = isValidVid(cookieVid) ? await getScreening(vid) : null;
  let screenedNow = false;
  if (!record || record.ip !== ip) {
    const trigger: ScreenTrigger = !isValidVid(cookieVid) ? "new_visitor" : record ? "ip_changed" : "qualify_check";
    record = await screenVisitor(vid, ip, "/api/visitor-qualify/", request.headers.get("user-agent") || "", false, trigger);
    screenedNow = true;
  }

  let res: NextResponse;
  if (record.status !== "eligible") {
    res = json({ qualified: false, status: record.status });   // suspicious or unknown — never passed
  } else {
    await markEligible(record, rule, signals);
    res = json({ qualified: true, rule });
  }

  if (screenedNow) {
    const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
    if (vid !== cookieVid) res.cookies.set(VID_COOKIE, vid, { ...cookieOpts, maxAge: VID_MAX_AGE_S });
    res.cookies.set(SCREEN_COOKIE, await ipFingerprint(ip), { ...cookieOpts, maxAge: SCREEN_TTL_S });
  }
  return res;
}
