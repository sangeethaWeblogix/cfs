import { NextRequest, NextResponse } from "next/server";
import {
  VID_COOKIE, SCREEN_COOKIE, VID_MAX_AGE_S, SCREEN_TTL_S, ERROR_RETRY_S, QUALIFIED_COOKIE, TOKEN_COOKIE, QUALIFY_MIN_AGE_S,
  getClientIp, getEligibility, getRequestAsn, getRequestCountry, getTestPaths, getScreening, ipFingerprint, isPrivateIp, isScreeningDisabled, isValidVid,
  isQualifyTokenEnabled, markEligible, qualifyRateLimited, readQualifyToken, sameNetwork, screenVisitor, spendTokenLookup, type ScreenTrigger,
} from "@/lib/visitorCheck";
import { matchQualifyRule, type QualifySignals } from "@/utils/qualifyRules";

export const dynamic = "force-dynamic";

const json = (body: unknown) =>
  NextResponse.json(body, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

/* POST /api/visitor-qualify/  { listingIds: string[], filterUsed, scrolled, clicked: boolean, activeSeconds: number }
   Remarketing eligibility = IP screening "eligible" (for the visitor's CURRENT IP)
   AND one engagement rule met (see matchQualifyRule). Called by <VisitorQualifier />.
   Since screening is deferred (fix 4), this is where most paid MaxMind lookups happen, so (fix 5) a call
   is only accepted with the middleware's signed token for the same visitor ID, issued at least
   QUALIFY_MIN_AGE_S ago, within per-visitor / per-IP rate limits, and each token may cause at most a
   few lookups. Rejections return qualified:false with a status, and the client simply retries later. */
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

  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };

  const already = isValidVid(cookieVid) ? await getEligibility(vid) : null;
  if (already) {
    const res = json({ qualified: true, rule: already.rule, already: true });
    res.cookies.set(QUALIFIED_COOKIE, "1", { ...cookieOpts, maxAge: VID_MAX_AGE_S });
    return res;
  }

  // Fix 5: signed token from the middleware, bound to this visitor ID and old enough for the 40 s rule
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (isQualifyTokenEnabled()) {
    const issuedAt = isValidVid(cookieVid) ? await readQualifyToken(token, vid) : null;
    if (issuedAt === null) return json({ qualified: false, status: "no_token" });
    if (Date.now() - issuedAt < QUALIFY_MIN_AGE_S * 1000) return json({ qualified: false, status: "too_early" });
  }

  const ip = getClientIp(request.headers);
  if (!ip || isPrivateIp(ip)) return json({ qualified: false, status: "unknown" });
  if (await qualifyRateLimited(vid, ip)) return json({ qualified: false, status: "rate_limited" });

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
    // Each token may cause only a few lookups (IP changes, MaxMind error retries)
    if (token && isQualifyTokenEnabled() && !(await spendTokenLookup(token))) {
      return json({ qualified: false, status: "unknown", reason: "lookup_budget" });
    }
    record = await screenVisitor(vid, ip, "/api/visitor-qualify/", request.headers.get("user-agent") || "", false, trigger, getRequestCountry(request.headers), getRequestAsn(request.headers));
    screenedNow = true;
  }

  let res: NextResponse;
  if (record.status !== "eligible") {
    res = json({ qualified: false, status: record.status });   // suspicious or unknown — never passed
  } else {
    await markEligible(record, rule, signals, entry);
    res = json({ qualified: true, rule });
  }

  // New ID, or just qualified → (re)start the 30-day ID cookie so it outlives the 30-day qualification
  if (screenedNow || record.status === "eligible") res.cookies.set(VID_COOKIE, vid, { ...cookieOpts, maxAge: VID_MAX_AGE_S });
  // Screened now, or qualified on a screening of this IP (e.g. from the free check) → the middleware
  // won't screen this IP again for 7 days. cfs_q makes it re-screen a qualified visitor straight away
  // on a new IP or once that screening expires (fix 4).
  if (screenedNow || record.status === "eligible") res.cookies.set(SCREEN_COOKIE, await ipFingerprint(ip), { ...cookieOpts, maxAge: SCREEN_TTL_S });
  if (record.status === "eligible") res.cookies.set(QUALIFIED_COOKIE, "1", { ...cookieOpts, maxAge: VID_MAX_AGE_S });
  return res;
}
