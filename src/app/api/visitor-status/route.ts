import { NextRequest, NextResponse } from "next/server";
import { VID_COOKIE, SCREEN_COOKIE, QUALIFIED_COOKIE, VID_MAX_AGE_S, getVisitorState, isScreeningDisabled, isValidVid } from "@/lib/visitorCheck";

export const dynamic = "force-dynamic";

const json = (body: unknown) =>
  NextResponse.json(body, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

/* GET /api/visitor-status/ → { status } for the GTM dataLayer (read by <VisitorStatus />). Read-only, never screens.
     as         = IP screening flagged the visitor (beats an earlier qualification)
     ps         = passed screening AND met an engagement rule (remarketing eligible, 30 days)
     uk         = screened, engagement pending (also screening timeouts/errors — those can never reach ps)
     pending    = screening started on this page view but hasn't finished yet — ask again shortly
     unscreened = not screened: deferred until the visitor qualifies (fix 4), or screening disabled */
export async function GET(request: NextRequest) {
  if (isScreeningDisabled()) return json({ status: "unscreened" });

  const vid = request.cookies.get(VID_COOKIE)?.value;
  if (!isValidVid(vid)) return json({ status: "unscreened" });

  const { screening, eligibility } = await getVisitorState(vid);
  if (screening?.status === "suspicious") return json({ status: "as" });
  if (eligibility) {
    // Visitors who qualified before deferred screening get cfs_q here, so the middleware re-screens
    // them straight away on a new IP (fix 4)
    const res = json({ status: "ps" });
    if (!request.cookies.has(QUALIFIED_COOKIE)) {
      res.cookies.set(QUALIFIED_COOKIE, "1", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: VID_MAX_AGE_S });
    }
    return res;
  }
  if (screening) return json({ status: "uk" });
  return json({ status: request.cookies.has(SCREEN_COOKIE) ? "pending" : "unscreened" });
}
