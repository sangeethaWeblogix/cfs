/* ──────────────────────────────────────────────
   Visitor screening (MaxMind GeoIP Insights) + qualification
   - Each visitor (cfs_vid cookie) is screened once per SCREEN_TTL_S, in the background.
     The result is reused across page views; a new lookup happens only when the
     screening expires or the visitor's IP changes (cfs_scr cookie = IP fingerprint).
   - IP screening status:  eligible | suspicious | unknown (timeouts/errors stay unknown — never passed).
   - Remarketing eligibility (qualified) is stored separately and needs screening = eligible.
   - Nobody is blocked or redirected; results go to Vercel logs + Upstash Redis.
────────────────────────────────────────────── */

import type { QualifyRule, QualifySignals } from '@/utils/qualifyRules';

export type VisitorStatus ='eligible' | 'suspicious' | 'unknown';

export interface VisitorRecord {
  time: string;
  vid: string;
  ip: string;
  path: string;
  ua: string;
  status: VisitorStatus;
  reasons: string[];
  source: 'maxmind' | 'ip_cache' | 'asn' | 'ua' | 'geo' | 'error';
  trigger?: string;
  country?: string;
  registeredCountry?: string;
  asn?: number;
  asnOrg?: string;
  userType?: string;
  risk?: number;
  anonProvider?: string;
  error?: string;
}

type Verdict = Pick<VisitorRecord, 'status' | 'reasons' | 'country' | 'registeredCountry' | 'asn' | 'asnOrg' | 'userType' | 'risk' | 'anonProvider'>;

export const VID_COOKIE = 'cfs_vid';          // visitor ID
export const SCREEN_COOKIE = 'cfs_scr';       // fingerprint of the IP that was screened
export const VID_MAX_AGE_S = 30 * 86400;      // visitor ID + remarketing eligibility: 30 days
// Screening result reused for 7 days while the visitor stays on the same IP / IPv6 /64.
// A new network (e.g. switching to a VPN) is re-screened straight away (ip_changed).
export const SCREEN_TTL_S = 7 * 86400;

const MAXMIND_TIMEOUT_MS = 1500;
const IP_CACHE_TTL_S = 7 * 86400;             // same IP across visitors: 7 days
const IP_ERROR_TTL_S = 60;                    // MaxMind error for an IP: reused for 60 s (not 7 days)
const IP_LOCK_TTL_S = 5;                      // one MaxMind lookup per IP at a time (all sites)
const IP_LOCK_WAIT_MS = [300, 500, 800];      // waits for the lock holder's verdict before looking up anyway
// MaxMind error (e.g. credit ran out): the "unknown" result is retried by /api/visitor-qualify
// once it is this old, so a short outage doesn't block real visitors from qualifying for 7 days
export const ERROR_RETRY_S = 3600;
const LOG_MAX = 5000;
const LOG_TTL_S = 90 * 86400;                 // logs/counters expire 90 days after last write

const K = {
  screening: (vid: string) => `vc:screen:${vid}`,   // IP screening status (per visitor)
  eligibility: (vid: string) => `vc:elig:${vid}`,   // remarketing eligibility (per visitor)
  ip: (ip: string) => `vc:ip:${ipNetworkKey(ip)}`,  // MaxMind verdict cache (per IPv4 / IPv6 /64), shared by all sites
  ipError: (ip: string) => `vc:iperr:${ipNetworkKey(ip)}`,  // last MaxMind error for the IP (60 s)
  ipLock: (ip: string) => `vc:iplock:${ipNetworkKey(ip)}`,  // lookup in progress (5 s)
  asnStats: (asn: number) => `vc:asnstat:${asn}`,   // MaxMind verdicts per network: hosting / eligible (all sites)
  asnListed: (asn: number) => `vc:asnbad:${asn}`,   // network skipped before MaxMind (all sites)
  log: 'vc:log',
  qualifiedLog: 'vc:qualified',
  counts: 'vc:counts',
  flagged: 'ads:flagged',
};

/* Crawlers that don't say "bot" in their user agent (Google-InspectionTool, GoogleOther,
   Google-Read-Aloud, Lighthouse, headless browsers…) plus Cloudflare's verified-bot flag
   (forwarded by a Cloudflare Request Header Transform Rule: X-Verified-Bot = to_string(cf.client.bot);
   Cloudflare doesn't allow setting headers that start with x-cf-).
   Also any client that is not a browser: every real browser's user agent contains "Mozilla/",
   while scripts and scrapers (axios, node-fetch, Java, Go, empty UA…) don't. They never keep
   cookies, so screening them would re-run (and write to Redis) on every single request.
   These skip the paid MaxMind lookup and Redis — Vercel log only. */
const EXTRA_CRAWLER_UA = /support\.google\.com\/webmasters|google-|googleother|chrome-lighthouse|headlesschrome|pagespeed|gtmetrix|crawl|scrapy|python-requests|curl\/|wget\//i;

export function isDeclaredCrawler(ua: string, headers: Headers): boolean {
  return !/mozilla\//i.test(ua) || EXTRA_CRAWLER_UA.test(ua) || headers.get('x-verified-bot') === 'true';
}

/* Visitor country from free edge geolocation. Cloudflare's CF-IPCountry is trusted only when the
   request really came through Cloudflare (same peer check as getClientIp) — otherwise anyone
   calling the Vercel URL directly could send "CF-IPCountry: AU". Falls back to Vercel's header.
   Returns undefined when unknown ("XX", "T1" = Tor) so the visitor still gets a MaxMind check. */
export function getRequestCountry(headers: Headers): string | undefined {
  const cf = isCloudflareIp(getPeerIp(headers)) ? headers.get('cf-ipcountry') : null;
  const c = (cf || headers.get('x-vercel-ip-country') || '').trim().toUpperCase();
  return c && c !== 'XX' && c !== 'T1' ? c : undefined;
}

export const isValidVid = (v: string | undefined): v is string =>
  !!v && /^[0-9a-f-]{36}$/i.test(v);

/* IPv6 → its /64 network ("2001:db8:1:2::/64"); IPv4 (incl. IPv4-mapped IPv6) unchanged.
   Phones and many home connections rotate IPv6 "privacy addresses" every few hours inside
   the same /64 (one subscriber), so comparing / caching by /64 avoids needless re-screens. */
export function ipNetworkKey(ip: string): string {
  const v = ip.trim().toLowerCase();
  if (!v.includes(':')) return v;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return mapped[1];

  const [head, tail] = v.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = v.includes('::') ? 8 - headParts.length - tailParts.length : 0;
  const parts = [...headParts, ...Array(Math.max(missing, 0)).fill('0'), ...tailParts];
  return parts.slice(0, 4).map(h => (parseInt(h, 16) || 0).toString(16)).join(':') + '::/64';
}

export const sameNetwork = (a: string, b: string) => ipNetworkKey(a) === ipNetworkKey(b);

/* Short SHA-256 fingerprint of the IP's network (cookie stores this, not the raw IP) */
export async function ipFingerprint(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`cfs:${ipNetworkKey(ip)}`));
  return Array.from(new Uint8Array(buf).slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}

/* Tunable thresholds (review after the log-only period) */
const RISK_THRESHOLD = 50;
const RESIDENTIAL_PROXY_CONFIDENCE = 50;

export function isScreeningDisabled(): boolean {
  return process.env.VISITOR_CHECK_DISABLED === '1';
}

/* Test mode: env VISITOR_CHECK_TEST_PATHS = comma-separated exact paths
   (e.g. "/product/some-caravan/"). When set, ONLY those pages start a MaxMind
   screening; remove the env var to screen all pages. */
const normPath = (p: string) => p.trim().toLowerCase().replace(/\/+$/, '') || '/';

export function getTestPaths(): string[] | null {
  const raw = process.env.VISITOR_CHECK_TEST_PATHS?.trim();
  if (!raw) return null;
  return raw.split(',').map(s => {
    try { return normPath(new URL(s.trim(), 'https://x').pathname); } catch { return normPath(s); }
  });
}

export function isTestModeAllowedPath(pathname: string): boolean {
  const paths = getTestPaths();
  return !paths || paths.includes(normPath(pathname));
}

/* ── Client IP ──
   Vercel sets x-forwarded-for to the connecting IP. If that connection is from
   Cloudflare (proxied DNS / Worker), trust Cloudflare's CF-Connecting-IP instead.
   CF-Connecting-IP is ignored otherwise, so it can't be spoofed by visitors.
   Keep these in sync with https://www.cloudflare.com/ips/ — the daily cron (/api/cron/redis-usage/)
   compares them with Cloudflare's published list and emails the admin if it changes. */
export const CF_IPV4 = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
];
export const CF_IPV6 = [
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
  '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
];

function ipv4ToInt(ip: string): number | null {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

/* Full 128-bit value of an IPv6 address (null if it isn't one) */
function ipv6ToBigInt(ip: string): bigint | null {
  const v = ip.trim().toLowerCase().split('%')[0];
  if (!v.includes(':') || v.split('::').length > 2) return null;
  const [head, tail] = v.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail !== undefined && tail ? tail.split(':') : [];
  const missing = v.includes('::') ? 8 - headParts.length - tailParts.length : 0;
  const parts = [...headParts, ...Array(Math.max(missing, 0)).fill('0'), ...tailParts];
  if (parts.length !== 8 || parts.some(h => !/^[0-9a-f]{1,4}$/.test(h))) return null;
  return parts.reduce((acc, h) => (acc << BigInt(16)) | BigInt(parseInt(h, 16)), BigInt(0));
}

export function isCloudflareIp(ip: string): boolean {
  if (!ip) return false;
  if (ip.includes(':')) {
    const n = ipv6ToBigInt(ip);
    if (n === null) return false;
    return CF_IPV6.some(cidr => {
      const [base, bits] = cidr.split('/');
      const shift = BigInt(128 - Number(bits));
      return (n >> shift) === (ipv6ToBigInt(base)! >> shift);
    });
  }
  const n = ipv4ToInt(ip);
  if (n === null) return false;
  return CF_IPV4.some(cidr => {
    const [base, bits] = cidr.split('/');
    const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
    return ((n & mask) >>> 0) === ((ipv4ToInt(base)! & mask) >>> 0);
  });
}

/* The IP that actually connected to Vercel (Cloudflare's edge when proxied) */
function getPeerIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  return (xff ? xff.split(',')[0] : headers.get('x-real-ip') || '').trim();
}

export function getClientIp(headers: Headers): string | null {
  const peer = getPeerIp(headers);
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf && peer && isCloudflareIp(peer)) return cf;
  return peer || null;
}

/* Local / private ranges — MaxMind rejects these (IP_ADDRESS_RESERVED), don't waste a call */
export function isPrivateIp(ip: string): boolean {
  return (
    ip === '::1' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')
  );
}

/* ── Upstash Redis via REST (no extra dependency). No-op when env vars are missing. ── */
export async function redis(commands: (string | number)[][]): Promise<any[] | null> {
  // Vercel Marketplace integration may expose these as KV_REST_API_* instead
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      cache: 'no-store',
    });
    if (!res.ok) {
      // Failures stay non-fatal, but make Upstash's quota error easy to find in the Vercel logs
      const body = await res.text().catch(() => '');
      console.error(`[visitor-check] REDIS ERROR ${res.status}${/limit/i.test(body) ? ' (UPSTASH LIMIT REACHED)' : ''}: ${body.slice(0, 200)}`);
      return null;
    }
    const out = await res.json();
    const failed = Array.isArray(out) ? out.find((r: any) => r?.error) : null;
    if (failed) console.error(`[visitor-check] REDIS ERROR${/limit/i.test(failed.error) ? ' (UPSTASH LIMIT REACHED)' : ''}: ${String(failed.error).slice(0, 200)}`);
    return Array.isArray(out) ? out.map((r: any) => r?.result ?? null) : null;
  } catch {
    return null;
  }
}

function parse<T>(s: unknown): T | null {
  if (typeof s !== 'string') return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

/* ── MaxMind Insights lookup. Returns { error } on any failure (fail open, never cached). ── */
async function lookupMaxMind(ip: string): Promise<{ verdict: Verdict } | { error: string }> {
  const accountId = process.env.MAXMIND_ACCOUNT_ID;
  const licenseKey = process.env.MAXMIND_LICENSE_KEY;
  if (!accountId || !licenseKey) return { error: 'MAXMIND_NOT_CONFIGURED' };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), MAXMIND_TIMEOUT_MS);
  try {
    const res = await fetch(`https://geoip.maxmind.com/geoip/v2.1/insights/${encodeURIComponent(ip)}`, {
      headers: { Authorization: `Basic ${btoa(`${accountId}:${licenseKey}`)}`, Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      let code = `HTTP_${res.status}`;
      try { code = (await res.json())?.code ?? code; } catch {}
      return { error: code };
    }
    return { verdict: classify(await res.json()) };
  } catch (e: any) {
    return { error: e?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR' };
  } finally {
    clearTimeout(tid);
  }
}

function classify(d: any): Verdict {
  const a = d?.anonymizer ?? {};
  const t = d?.traits ?? {};
  const reasons: string[] = [];
  if (a.is_anonymous_vpn) reasons.push('vpn');
  if (a.is_public_proxy) reasons.push('public_proxy');
  if (a.is_tor_exit_node) reasons.push('tor');
  if (a.is_hosting_provider) reasons.push('hosting_provider');
  if (a.is_residential_proxy && (a.confidence ?? 0) >= RESIDENTIAL_PROXY_CONFIDENCE) reasons.push('residential_proxy');
  if (t.user_type === 'hosting') reasons.push('user_type_hosting');
  if (typeof t.ip_risk_snapshot === 'number' && t.ip_risk_snapshot >= RISK_THRESHOLD) reasons.push(`risk_${t.ip_risk_snapshot}`);
  // MaxMind must also place the IP in Australia (edge headers can be missing or wrong)
  if (d?.country?.iso_code !== 'AU') reasons.push('non_au');

  return {
    status: reasons.length ? 'suspicious' : 'eligible',
    reasons,
    country: d?.country?.iso_code,
    registeredCountry: d?.registered_country?.iso_code,
    asn: typeof t.autonomous_system_number === 'number' ? t.autonomous_system_number : undefined,
    asnOrg: t.autonomous_system_organization,
    userType: t.user_type,
    risk: t.ip_risk_snapshot,
    anonProvider: a.provider_name,
  };
}


/* ── Network (ASN) pre-check: AU-located hosting / VPN networks never reach MaxMind ──
   Cloudflare forwards the visitor's network number in X-Client-ASN (Request Header Transform Rule:
   X-Client-ASN = to_string(ip.src.asnum)); it is trusted only from Cloudflare's IPs, like CF-IPCountry.
   A network is listed (shared by all sites, for ASN_LISTED_TTL_S) once MaxMind has called at least
   ASN_LIST_MIN_HOSTING of its IPs "hosting" and none of them eligible. While listed, its new IPs are
   "suspicious" (source "asn") without a lookup. The record keeps asn / asnOrg / userType so the visitor
   log and the CF Auto-Block plugin still count the network. An eligible verdict for the network removes it.
   Residential proxies on AU ISPs can't be told apart by network: they still go to MaxMind.
   Env: VISITOR_ASN_CHECK_DISABLED=1 (turn off), ASN_LIST_MIN_HOSTING (default 5). */
const ASN_STATS_TTL_S = 7 * 86400;            // counts kept while the network stays active (refreshed on each lookup)
const ASN_LISTED_TTL_S = 7 * 86400;
const ASN_LIST_MIN_HOSTING = Number(process.env.ASN_LIST_MIN_HOSTING) || 5;
// Seeded: confirmed scraper networks (6 Nov 2026 visitor log)
const SEED_LISTED_ASNS: Record<number, string> = { 133499: 'HostRoyale Technologies Pvt Ltd' };
// Never listed — same defaults as the CF Auto-Block plugin: Google, Microsoft, Amazon, Cloudflare, Meta,
// Apple and the main AU ISPs (Telstra, Optus, TPG, Aussie Broadband, Vocus, Internode, AAPT)
const PROTECTED_ASNS = new Set([15169, 396982, 8075, 16509, 14618, 13335, 32934, 714, 1221, 4804, 7545, 4764, 4826, 4739, 2764]);

interface ListedAsn { asn: number; asnOrg?: string; hosting: number; since: string }

const asnCheckEnabled = () => process.env.VISITOR_ASN_CHECK_DISABLED !== '1';

/* Visitor's network number from Cloudflare (undefined when not via Cloudflare or missing) */
export function getRequestAsn(headers: Headers): number | undefined {
  if (!isCloudflareIp(getPeerIp(headers))) return undefined;
  const n = Number(headers.get('x-client-asn'));
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/* Update the network's counts after a MaxMind verdict; list or unlist it */
async function learnAsn(v: Verdict): Promise<void> {
  if (typeof v.asn !== 'number' || PROTECTED_ASNS.has(v.asn)) return;
  const field = v.status === 'eligible' ? 'eligible'
    : v.userType === 'hosting' || v.reasons.includes('hosting_provider') ? 'hosting' : null;
  if (!field) return;
  const out = await redis([
    ['HINCRBY', K.asnStats(v.asn), field, 1],
    ['EXPIRE', K.asnStats(v.asn), ASN_STATS_TTL_S],
    ['HMGET', K.asnStats(v.asn), 'hosting', 'eligible'],
  ]);
  const [hosting, eligible] = ((out?.[2] as (string | null)[]) ?? []).map(x => Number(x) || 0);
  if (eligible > 0) {
    if (field === 'eligible') await redis([['DEL', K.asnListed(v.asn)]]);
  } else if (hosting >= ASN_LIST_MIN_HOSTING) {
    const entry: ListedAsn = { asn: v.asn, asnOrg: v.asnOrg, hosting, since: new Date().toISOString() };
    const set = await redis([['SET', K.asnListed(v.asn), JSON.stringify(entry), 'NX', 'EX', ASN_LISTED_TTL_S]]);
    if (set?.[0] === 'OK') console.log(`[visitor-check] ASN LISTED asn=${v.asn} org="${v.asnOrg ?? ''}" hosting=${hosting}`);
  }
}

/* Verdicts cached before the AU check (or written by a site without it) are re-checked on read */
function withAuCheck(v: Verdict | null): Verdict | null {
  if (!v || v.country === 'AU' || v.reasons.includes('non_au')) return v;
  return { ...v, status: 'suspicious', reasons: [...v.reasons, 'non_au'] };
}

/* Another request holds the lookup lock for this IP — poll briefly for its verdict (or its error).
   Returns null if neither arrives, and the caller then looks the IP up itself. */
async function waitForIpVerdict(ip: string): Promise<{ verdict: Verdict } | { error: string } | null> {
  for (const ms of IP_LOCK_WAIT_MS) {
    await new Promise(r => setTimeout(r, ms));
    const out = await redis([['GET', K.ip(ip)], ['GET', K.ipError(ip)]]);
    const v = withAuCheck(parse<Verdict>(out?.[0]));
    if (v) return { verdict: v };
    if (typeof out?.[1] === 'string') return { error: out[1] };
  }
  return null;
}

/* new_visitor = new browser (no cfs_vid cookie) AND its IP wasn't seen in the last 7 days.
   A new browser whose IP is already in the IP cache (Incognito, cleared cookies, shared
   connection) is logged as existing_visitor_new_session instead. */
export type ScreenTrigger = 'new_visitor' | 'existing_visitor_new_session' | 'ip_changed' | 'expired' | 'qualify_check';

/**
 * Screen a visitor's IP and store the result against their visitor ID (for SCREEN_TTL_S).
 * Designed to run inside event.waitUntil() so it never delays the page.
 */
export async function screenVisitor(
  vid: string, ip: string, path: string, ua: string, declaredBot: boolean, trigger: ScreenTrigger = 'new_visitor',
  geoCountry?: string, edgeAsn?: number,
): Promise<VisitorRecord> {
  const base = { time: new Date().toISOString(), vid, ip, path, ua: ua.slice(0, 200), trigger };
  let record!: VisitorRecord;
  const cmds: (string | number)[][] = [];

  if (declaredBot) {
    // Self-identified crawlers (Googlebot etc.) — no paid lookup needed
    record = { ...base, status: 'suspicious', reasons: ['bot_user_agent'], source: 'ua' };
  } else if (geoCountry && geoCountry !== 'AU') {
    // Outside Australia (e.g. whitelisted IPs) — never eligible, so skip the paid lookup. Not blocked.
    record = { ...base, status: 'suspicious', reasons: ['non_au'], source: 'geo', country: geoCountry };
    cmds.push(['SET', K.screening(vid), JSON.stringify(record), 'EX', SCREEN_TTL_S]);
  } else {
    // Same IP already looked up in the last 7 days (another visitor / another site / cleared cookies)
    // → reuse, no extra cost. A recent MaxMind error for this IP is reused for IP_ERROR_TTL_S.
    // The network check rides in the same Redis round-trip (only when Cloudflare sent the ASN)
    const asn = asnCheckEnabled() && edgeAsn && !PROTECTED_ASNS.has(edgeAsn) ? edgeAsn : undefined;
    const cachedOut = await redis([
      ['GET', K.ip(ip)], ['GET', K.ipError(ip)],
      ...(asn && !SEED_LISTED_ASNS[asn] ? [['GET', K.asnListed(asn)]] : []),
    ]);
    let cached = withAuCheck(parse<Verdict>(cachedOut?.[0]));
    let cachedError = typeof cachedOut?.[1] === 'string' ? cachedOut[1] : null;
    const seenTrigger = trigger === 'new_visitor' ? 'existing_visitor_new_session' : trigger;
    const listed: ListedAsn | null = !asn ? null
      : SEED_LISTED_ASNS[asn] ? { asn, asnOrg: SEED_LISTED_ASNS[asn], hosting: 0, since: 'seed' }
      : parse<ListedAsn>(cachedOut?.[2]);

    if (!cached && !cachedError && listed) {
      // Listed hosting / VPN network → suspicious without a paid lookup
      record = {
        ...base, status: 'suspicious', reasons: ['asn_listed'], source: 'asn',
        asn: listed.asn, asnOrg: listed.asnOrg, userType: 'hosting',
      };
    } else if (!cached && !cachedError) {
      // One MaxMind lookup per IP: if another request/site is already looking it up, wait for its result
      const lock = await redis([['SET', K.ipLock(ip), '1', 'NX', 'EX', IP_LOCK_TTL_S]]);
      const gotLock = !lock || lock[0] === 'OK';   // Redis down → no lock, look up as before
      if (!gotLock) {
        const waited = await waitForIpVerdict(ip);
        if (waited && 'verdict' in waited) cached = waited.verdict;
        else if (waited) cachedError = waited.error;
      }
      if (!cached && !cachedError) {
        const result = await lookupMaxMind(ip);
        if ('verdict' in result) {
          record = { ...base, ...result.verdict, source: 'maxmind' };
          cmds.push(['SET', K.ip(ip), JSON.stringify(result.verdict), 'EX', IP_CACHE_TTL_S]);
          if (asnCheckEnabled()) await learnAsn(result.verdict).catch(() => {});
        } else {
          // Timeout / error → unknown (never passed); the error is cached briefly so a burst of
          // requests from the same IP doesn't repeat it, the verdict cache is left empty
          record = { ...base, status: 'unknown', reasons: [], source: 'error', error: result.error };
          cmds.push(['SET', K.ipError(ip), result.error, 'EX', IP_ERROR_TTL_S]);
        }
        cmds.push(['DEL', K.ipLock(ip)]);
      }
    }
    if (cached) {
      record = { ...base, trigger: seenTrigger, ...cached, source: 'ip_cache' };
    } else if (cachedError) {
      record = { ...base, status: 'unknown', reasons: [], source: 'error', error: `${cachedError} (cached)` };
    }
    // Crawlers get a new ID on every request, so only real browsers are stored per visitor
    cmds.push(['SET', K.screening(vid), JSON.stringify(record), 'EX', SCREEN_TTL_S]);
  }

  console.log(`[visitor-check] ${record.status.toUpperCase()} vid=${vid} ip=${ip} path=${path} src=${record.source} trigger=${record.trigger}` +
    (record.reasons.length ? ` reasons=${record.reasons.join(',')}` : '') +
    (record.asnOrg ? ` asn="${record.asnOrg}"` : '') +
    (record.error ? ` error=${record.error}` : ''));

  // Declared crawlers (Googlebot etc.) are only written to the Vercel log above — logging them in
  // Redis used over half of the Upstash free-tier commands for no screening value
  if (record.source === 'ua') return record;

  cmds.push(
    ['LPUSH', K.log, JSON.stringify(record)],
    ['LTRIM', K.log, 0, LOG_MAX - 1],
    ['EXPIRE', K.log, LOG_TTL_S],
    ['HINCRBY', K.counts, record.source === 'geo' ? 'non_au' : record.status, 1],
    ['EXPIRE', K.counts, LOG_TTL_S],
  );
  if (record.source === 'asn') cmds.push(['HINCRBY', K.counts, 'skipped_asn', 1]);   // MaxMind lookups saved
  if (record.status === 'suspicious' && record.source !== 'geo') {
    cmds.push(
      ['LPUSH', K.flagged, `${record.time}|${ip}`],
      ['LTRIM', K.flagged, 0, LOG_MAX - 1],
      ['EXPIRE', K.flagged, LOG_TTL_S],
    );
  }
  await redis(cmds);

  return record;
}

/* Current IP screening result for a visitor (null once SCREEN_TTL_S has passed) */
export async function getScreening(vid: string): Promise<VisitorRecord | null> {
  return parse<VisitorRecord>((await redis([['GET', K.screening(vid)]]))?.[0]);
}

/* Remarketing eligibility — separate from IP screening */
export async function getEligibility(vid: string): Promise<{ time: string; rule: QualifyRule } | null> {
  return parse((await redis([['GET', K.eligibility(vid)]]))?.[0]);
}

/* Eligibility for many visitors in one MGET (for the visitor-log report). Map: vid → entry */
export async function getEligibilities(vids: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  if (!vids.length) return map;
  const vals: (string | null)[] = (await redis([['MGET', ...vids.map(K.eligibility)]]))?.[0] ?? [];
  vids.forEach((vid, i) => { const e = parse<any>(vals[i]); if (e) map.set(vid, e); });
  return map;
}

/* Screening + eligibility in one Redis round-trip (for /api/visitor-status) */
export async function getVisitorState(vid: string): Promise<{ screening: VisitorRecord | null; eligibility: { rule: QualifyRule } | null }> {
  const out = await redis([['GET', K.screening(vid)], ['GET', K.eligibility(vid)]]);
  return { screening: parse<VisitorRecord>(out?.[0]), eligibility: parse(out?.[1]) };
}

export async function markEligible(
  record: VisitorRecord, rule: QualifyRule, s: QualifySignals, src?: { source?: string; medium?: string },
): Promise<void> {
  const entry = {
    time: new Date().toISOString(), vid: record.vid, ip: record.ip, rule,
    entrySource: src?.source, entryMedium: src?.medium,
    listings: new Set(s.listingIds).size, filterUsed: s.filterUsed, scrolled: s.scrolled, clicked: s.clicked, activeSeconds: s.activeSeconds,
    country: record.country, asn: record.asn, asnOrg: record.asnOrg,
  };
  console.log(`[visitor-check] QUALIFIED vid=${record.vid} rule=${rule}`);
  await redis([
    ['SET', K.eligibility(record.vid), JSON.stringify(entry), 'EX', VID_MAX_AGE_S],
    ['LPUSH', K.qualifiedLog, JSON.stringify(entry)],
    ['LTRIM', K.qualifiedLog, 0, LOG_MAX - 1],
    ['EXPIRE', K.qualifiedLog, LOG_TTL_S],
    ['HINCRBY', K.counts, 'qualified', 1],
    ['HINCRBY', K.counts, `qualified_${rule}`, 1],
    ['EXPIRE', K.counts, LOG_TTL_S],
  ]);
}

export async function readVisitorLog(limit: number) {
  const out = await redis([
    ['LRANGE', K.log, 0, limit - 1],
    ['HGETALL', K.counts],
    ['LRANGE', K.qualifiedLog, 0, limit - 1],
  ]);
  if (!out) return { configured: false, counts: {}, records: [], qualified: [] };
  const list = (arr: string[] | null) => (arr ?? []).map(s => parse<any>(s)).filter(Boolean);
  const flat: string[] = out[1] ?? [];
  const counts: Record<string, number> = {};
  for (let i = 0; i < flat.length; i += 2) counts[flat[i]] = Number(flat[i + 1]);
  return { configured: true, counts, records: list(out[0]) as VisitorRecord[], qualified: list(out[2]) };
}
