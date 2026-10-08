import { NextRequest, NextResponse } from "next/server";
import {
  VID_COOKIE, SCREEN_COOKIE, VID_MAX_AGE_S, SCREEN_TTL_S,
  getClientIp, getEligibility, getRequestCountry, getTestPaths, getScreening, ipFingerprint, isPrivateIp, isScreeningDisabled, isValidVid,
  markEligible, screenVisitor, type ScreenTrigger,
} from "@/lib/visitorCheck";
import { matchQualifyRule, type QualifySignals } from "@/utils/qualifyRules";

export const dynamic = "force-dynamic";

const json = (body: unknown) =>
  NextResponse.json(body, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

/* POST /api/visitor-qualify/  { listingIds: string[], filterUsed, scrolled, clicked: boolean, activeSeconds: number }
   Remarketing eligibility = IP screening "eligible" (for the visitor's CURRENT IP)
   AND one engagement rule met (see matchQualifyRule). Called by <VisitorQualifier />. */
export async function POST(request: NextRequest) {
  if (isScreeningDisabled()) return json({ qualified: false, status: "disabled" });

  let body: any = {};
  try { body = await request.json(); } catch {}
  const signals: QualifySignals = {
    listingIds: Array.isArray(body?.listingIds) ? body.listingIds.map(String).slice(0, 50) : [],
    filterUsed: body?.filterUsed === true,
    scrolled: body?.scrolled === true,
    clicked: body?.clicked === true,
    activeSeconds: Math.max(0, Math.min(Number(body?.activeSeconds) || 0, 86400)),
  };

  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 60) : undefined);
  const entry = { source: str(body?.entry?.source), medium: str(body?.entry?.medium) };

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

  // Test mode: only visitors already screened on a test URL can qualify — no new MaxMind lookups here
  if (getTestPaths()) {
    if (!record) return json({ qualified: false, status: "disabled", reason: "test_mode" });
    if (record.ip !== ip) return json({ qualified: false, status: "unknown", reason: "test_mode_ip_changed" });
  }

  if (!record || record.ip !== ip) {
    const trigger: ScreenTrigger = !isValidVid(cookieVid) ? "new_visitor" : record ? "ip_changed" : "qualify_check";
    record = await screenVisitor(vid, ip, "/api/visitor-qualify/", request.headers.get("user-agent") || "", false, trigger, getRequestCountry(request.headers));
    screenedNow = true;
  }

  let res: NextResponse;
  if (record.status !== "eligible") {
    res = json({ qualified: false, status: record.status });   // suspicious or unknown — never passed
  } else {
    await markEligible(record, rule, signals, entry);
    res = json({ qualified: true, rule });
  }

  if (screenedNow) {
    const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
    if (vid !== cookieVid) res.cookies.set(VID_COOKIE, vid, { ...cookieOpts, maxAge: VID_MAX_AGE_S });
    res.cookies.set(SCREEN_COOKIE, await ipFingerprint(ip), { ...cookieOpts, maxAge: SCREEN_TTL_S });
  }
  return res;
}
