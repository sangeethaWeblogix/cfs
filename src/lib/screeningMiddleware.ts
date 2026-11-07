/* ──────────────────────────────────────────────
   Visitor screening step of the middleware — LOG-ONLY, never blocks or redirects.
   Shared by every marketplace (copied as-is; site differences live in visitorCheck.ts).
   Call it from middleware() after the site's own handling:
     return screenRequest(request, await handleRequest(request), event);
   - Declared crawlers: Vercel log only (no Redis, no MaxMind, no cookies).
   - New organic visitors: free checks only (shared IP cache, listed networks); the paid MaxMind
     lookup waits until they qualify (/api/visitor-qualify) — fix 4.
   - Paid-ad landings and qualified visitors on a new IP / expired screening: screened straight away.
   - Issues the signed qualify token (fix 5).
   Everything runs in waitUntil, so the page is never delayed. VISITOR_CHECK_DISABLED=1 switches it off.
────────────────────────────────────────────── */
import type { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import {
  screenVisitor, screenVisitorFree, getClientIp, isPrivateIp, isScreeningDisabled, isValidVid, ipFingerprint, isDeclaredCrawler,
  getRequestCountry, getRequestAsn, isTestModeAllowedPath, getTestPaths, isDeferEnabled, isPaidLanding,
  isQualifyTokenEnabled, issueQualifyToken, readQualifyToken,
  VID_COOKIE, VID_MAX_AGE_S, SCREEN_COOKIE, SCREEN_TTL_S, QUALIFIED_COOKIE, DEFER_COOKIE, DEFER_COOKIE_MAX_AGE_S, TOKEN_COOKIE,
} from "@/lib/visitorCheck";

const BOT_UA = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|crawler|spider|bot/i;

export async function screenRequest<R extends Response>(request: NextRequest, result: R, event: NextFetchEvent): Promise<R> {
  // Only a NextResponse can carry cookies; anything else (rare plain Response) is passed through.
  // Duck-typed: `instanceof NextResponse` can be false across bundles in the middleware runtime.
  if (typeof (result as unknown as Partial<NextResponse>).cookies?.set !== 'function') return result;
  const response = result as unknown as NextResponse;

  // Every real page view (home, listings, product, blog, other pages); API calls, Next.js internals and files are skipped
  const { pathname } = request.nextUrl;
  const isScreenedPage =
    !pathname.startsWith('/api/') && !pathname.startsWith('/_next/') &&
    !/\.[a-z0-9]+$/i.test(pathname);

  if (
    isScreeningDisabled() ||
    !isScreenedPage ||
    !isTestModeAllowedPath(pathname) ||           // test mode: only VISITOR_CHECK_TEST_PATHS
    response.status >= 300 ||                     // skip redirects / 410s — the real page view gets screened
    request.method !== 'GET' ||
    request.headers.get('x-skip-middleware') ||
    request.headers.get('x-internal-render') ||
    request.headers.get('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch'
  ) return result;

  const ip = getClientIp(request.headers);
  if (!ip || isPrivateIp(ip)) return result;

  const userAgent = request.headers.get('user-agent') || '';
  const path = pathname + request.nextUrl.search;

  if (BOT_UA.test(userAgent) || isDeclaredCrawler(userAgent, request.headers)) {
    // Declared crawler — Vercel log only (no Redis, no MaxMind call, no cookies)
    event.waitUntil(screenVisitor(crypto.randomUUID(), ip, path, userAgent, true).catch(() => {}));
    return result;
  }

  // Reuse the screening while the screen cookie (7 days) matches the current IP; otherwise screen again —
  // fully (MaxMind) only for paid-ad landings and qualified visitors, free checks only for the rest
  const existingVid = request.cookies.get(VID_COOKIE)?.value;
  const hasVid = isValidVid(existingVid);
  const vid = hasVid ? existingVid : crypto.randomUUID();
  const fp = await ipFingerprint(ip);
  const screenedFp = request.cookies.get(SCREEN_COOKIE)?.value;
  const cookieOpts = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/' };
  const country = getRequestCountry(request.headers);
  const asn = getRequestAsn(request.headers);
  const trigger = !hasVid ? 'new_visitor' : screenedFp ? 'ip_changed' : 'expired';

  if (!hasVid || screenedFp !== fp) {
    const qualified = request.cookies.has(QUALIFIED_COOKIE);
    const paid = isPaidLanding(request.nextUrl.searchParams);
    const immediate = !isDeferEnabled() || !!getTestPaths() || qualified || paid;

    if (immediate) {
      event.waitUntil(screenVisitor(vid, ip, path, userAgent, false, paid && !qualified ? 'paid_landing' : trigger, country, asn).catch(() => {}));
      // Re-set on every screening so the ID lasts 30 days from the last screened visit
      // and outlives the 30-day qualification it is linked to
      response.cookies.set(VID_COOKIE, vid, { ...cookieOpts, maxAge: VID_MAX_AGE_S });
      response.cookies.set(SCREEN_COOKIE, fp, { ...cookieOpts, maxAge: SCREEN_TTL_S });
    } else if (!hasVid || request.cookies.get(DEFER_COOKIE)?.value !== fp) {
      // Deferred: free checks only, at most daily per network. The screen cookie is NOT set, so
      // /api/visitor-status reports "unscreened" (not "pending") until a free check found a result
      // or the visitor qualifies.
      event.waitUntil(screenVisitorFree(vid, ip, path, userAgent, trigger, country, asn).catch(() => null));
      response.cookies.set(VID_COOKIE, vid, { ...cookieOpts, maxAge: VID_MAX_AGE_S });
      response.cookies.set(DEFER_COOKIE, fp, { ...cookieOpts, maxAge: DEFER_COOKIE_MAX_AGE_S });
    }
  }

  // Qualify token (fix 5): /api/visitor-qualify only accepts a valid, old-enough token for this visitor ID
  if (isQualifyTokenEnabled() && (!hasVid || (await readQualifyToken(request.cookies.get(TOKEN_COOKIE)?.value, vid)) === null)) {
    const token = await issueQualifyToken(vid);
    if (token) response.cookies.set(TOKEN_COOKIE, token, { ...cookieOpts, maxAge: VID_MAX_AGE_S });
  }

  return result;
}
