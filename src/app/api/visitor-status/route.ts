import { NextRequest, NextResponse } from "next/server";
import { VID_COOKIE, SCREEN_COOKIE, getVisitorState, isScreeningDisabled, isValidVid } from "@/lib/visitorCheck";

export const dynamic = "force-dynamic";

const json = (body: unknown) =>
  NextResponse.json(body, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

/* GET /api/visitor-status/ → { status } for the GTM dataLayer (read by <VisitorStatus />). Read-only, never screens.
     as         = IP screening flagged the visitor (beats an earlier qualification)
     ps         = passed screening AND met an engagement rule (remarketing eligible, 30 days)
     uk         = screened, engagement pending (also screening timeouts/errors — those can never reach ps)
     pending    = screening started on this page view but hasn't finished yet — ask again shortly
     unscreened = never screened (blog-only visit, test mode, screening disabled) */
export async function GET(request: NextRequest) {
  if (isScreeningDisabled()) return json({ status: "unscreened" });

  const vid = request.cookies.get(VID_COOKIE)?.value;
  if (!isValidVid(vid)) return json({ status: "unscreened" });

  const { screening, eligibility } = await getVisitorState(vid);
  if (screening?.status === "suspicious") return json({ status: "as" });
  if (eligibility) return json({ status: "ps" });
  if (screening) return json({ status: "uk" });
  return json({ status: request.cookies.has(SCREEN_COOKIE) ? "pending" : "unscreened" });
}
