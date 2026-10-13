import { NextRequest, NextResponse } from "next/server";
import {
  VID_COOKIE, SCREEN_COOKIE, VID_MAX_AGE_S, SCREEN_TTL_S, ERROR_RETRY_S,
  getClientIp, getEligibility, getRequestCountry, getTestPaths, getScreening, ipFingerprint, isPrivateIp, isScreeningDisabled, isValidVid,
  markEligible, sameNetwork, screenVisitor, type ScreenTrigger,
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
    if (!sameNetwork(record.ip, ip)) return json({ qualified: false, status: "unknown", reason: "test_mode_ip_changed" });
  }

  // A MaxMind error ("unknown") older than ERROR_RETRY_S is retried rather than kept for the full 7 days
  const staleError = !getTestPaths() && !!record && record.status === "unknown" && Date.now() - Date.parse(record.time) > ERROR_RETRY_S * 1000;

  if (!record || !sameNetwork(record.ip, ip) || staleError) {
    const trigger: ScreenTrigger = !isValidVid(cookieVid) ? "new_visitor"
      : !record ? "qualify_check" : staleError && sameNetwork(record.ip, ip) ? "expired" : "ip_changed";
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

  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
  // New ID, or just qualified → (re)start the 30-day ID cookie so it outlives the 30-day qualification
  if (screenedNow || record.status === "eligible") res.cookies.set(VID_COOKIE, vid, { ...cookieOpts, maxAge: VID_MAX_AGE_S });
  if (screenedNow) res.cookies.set(SCREEN_COOKIE, await ipFingerprint(ip), { ...cookieOpts, maxAge: SCREEN_TTL_S });
  return res;
}
