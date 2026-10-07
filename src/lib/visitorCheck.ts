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
  source: 'maxmind' | 'ip_cache' | 'ua' | 'geo' | 'error';
  trigger?: string;
  country?: string;
  registeredCountry?: string;
  asnOrg?: string;
  userType?: string;
  risk?: number;
  anonProvider?: string;
  error?: string;
}

type Verdict = Pick<VisitorRecord, 'status' | 'reasons' | 'country' | 'registeredCountry' | 'asnOrg' | 'userType' | 'risk' | 'anonProvider'>;

export const VID_COOKIE = 'cfs_vid';          // visitor ID
export const SCREEN_COOKIE = 'cfs_scr';       // fingerprint of the IP that was screened
export const VID_MAX_AGE_S = 30 * 86400;      // visitor ID + remarketing eligibility: 30 days
export const SCREEN_TTL_S = 86400;            // IP screening result reused for 24h

const MAXMIND_TIMEOUT_MS = 1500;
const IP_CACHE_TTL_S = 86400;                 // same IP across visitors: 24h
const LOG_MAX = 5000;
const LOG_TTL_S = 90 * 86400;                 // logs/counters expire 90 days after last write

const K = {
  screening: (vid: string) => `vc:screen:${vid}`,   // IP screening status (per visitor)
  eligibility: (vid: string) => `vc:elig:${vid}`,   // remarketing eligibility (per visitor)
  ip: (ip: string) => `vc:ip:${ip}`,                // MaxMind verdict cache (per IP)
  log: 'vc:log',
  qualifiedLog: 'vc:qualified',
  counts: 'vc:counts',
  flagged: 'ads:flagged',
};

/* Crawlers that don't say "bot" in their user agent (Google-InspectionTool, GoogleOther,
   Google-Read-Aloud, Lighthouse, headless browsers…) plus Cloudflare's verified-bot flag
   (forwarded by a Cloudflare Request Header Transform Rule: X-Verified-Bot = to_string(cf.client.bot);
   Cloudflare doesn't allow setting headers that start with x-cf-).
   These skip the paid MaxMind lookup. */
const EXTRA_CRAWLER_UA = /support\.google\.com\/webmasters|google-|googleother|chrome-lighthouse|headlesschrome|pagespeed|gtmetrix|crawl|scrapy|python-requests|curl\/|wget\//i;

export function isDeclaredCrawler(ua: string, headers: Headers): boolean {
  return EXTRA_CRAWLER_UA.test(ua) || headers.get('x-verified-bot') === 'true';
}

/* Visitor country from free edge geolocation (Cloudflare first, then Vercel).
   Returns undefined when unknown ("XX") so the visitor still gets a MaxMind check. */
export function getRequestCountry(headers: Headers): string | undefined {
  const c = (headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country') || '').trim().toUpperCase();
  return c && c !== 'XX' ? c : undefined;
}

export const isValidVid = (v: string | undefined): v is string =>
  !!v && /^[0-9a-f-]{36}$/i.test(v);

/* Short SHA-256 fingerprint of the IP (cookie stores this, not the raw IP) */
export async function ipFingerprint(ip: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`cfs:${ip}`));
  return Array.from(new Uint8Array(buf).slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}

/* Tunable thresholds (review after the log-only period) */
const RISK_THRESHOLD = 50;
const RESIDENTIAL_PROXY_CONFIDENCE = 50;

export function isScreeningDisabled(): boolean {
  return process.env.VISITOR_CHECK_DISABLED === '1';
}

/* ── Client IP ──
   Vercel sets x-forwarded-for to the connecting IP. If that connection is from
   Cloudflare (proxied DNS / Worker), trust Cloudflare's CF-Connecting-IP instead.
   CF-Connecting-IP is ignored otherwise, so it can't be spoofed by visitors. */
const CF_IPV4 = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
];
const CF_IPV6_PREFIXES = ['2400:cb00:', '2606:4700:', '2803:f800:', '2405:b500:', '2405:8100:', '2c0f:f248:', /^2a06:98c[0-7]:/];

function ipv4ToInt(ip: string): number | null {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function isCloudflareIp(ip: string): boolean {
  if (ip.includes(':')) {
    const v6 = ip.toLowerCase();
    return CF_IPV6_PREFIXES.some(p => (typeof p === 'string' ? v6.startsWith(p) : p.test(v6)));
  }
  const n = ipv4ToInt(ip);
  if (n === null) return false;
  return CF_IPV4.some(cidr => {
    const [base, bits] = cidr.split('/');
    const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
    return ((n & mask) >>> 0) === ((ipv4ToInt(base)! & mask) >>> 0);
  });
}

export function getClientIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  const peer = (xff ? xff.split(',')[0] : headers.get('x-real-ip') || '').trim();
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
async function redis(commands: (string | number)[][]): Promise<any[] | null> {
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
    if (!res.ok) return null;
    const out = await res.json();
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

  return {
    status: reasons.length ? 'suspicious' : 'eligible',
    reasons,
    country: d?.country?.iso_code,
    registeredCountry: d?.registered_country?.iso_code,
    asnOrg: t.autonomous_system_organization,
    userType: t.user_type,
    risk: t.ip_risk_snapshot,
    anonProvider: a.provider_name,
  };
}


export type ScreenTrigger = 'new_visitor' | 'ip_changed' | 'expired' | 'qualify_check';

/**
 * Screen a visitor's IP and store the result against their visitor ID (for SCREEN_TTL_S).
 * Designed to run inside event.waitUntil() so it never delays the page.
 */
export async function screenVisitor(
  vid: string, ip: string, path: string, ua: string, declaredBot: boolean, trigger: ScreenTrigger = 'new_visitor',
  geoCountry?: string,
): Promise<VisitorRecord> {
  const base = { time: new Date().toISOString(), vid, ip, path, ua: ua.slice(0, 200), trigger };
  let record: VisitorRecord;
  const cmds: (string | number)[][] = [];

  if (declaredBot) {
    // Self-identified crawlers (Googlebot etc.) — no paid lookup needed
    record = { ...base, status: 'suspicious', reasons: ['bot_user_agent'], source: 'ua' };
  } else if (geoCountry && geoCountry !== 'AU') {
    // Outside Australia (e.g. whitelisted IPs) — never eligible, so skip the paid lookup. Not blocked.
    record = { ...base, status: 'suspicious', reasons: ['non_au'], source: 'geo', country: geoCountry };
    cmds.push(['SET', K.screening(vid), JSON.stringify(record), 'EX', SCREEN_TTL_S]);
  } else {
    // Same IP already looked up in the last 24h (another visitor / cleared cookies) → reuse, no extra cost
    const cached = parse<Verdict>((await redis([['GET', K.ip(ip)]]))?.[0]);
    if (cached) {
      record = { ...base, ...cached, source: 'ip_cache' };
    } else {
      const result = await lookupMaxMind(ip);
      if ('verdict' in result) {
        record = { ...base, ...result.verdict, source: 'maxmind' };
        cmds.push(['SET', K.ip(ip), JSON.stringify(result.verdict), 'EX', IP_CACHE_TTL_S]);
      } else {
        // Timeout / error → unknown (never passed), IP not cached
        record = { ...base, status: 'unknown', reasons: [], source: 'error', error: result.error };
      }
    }
    // Crawlers get a new ID on every request, so only real browsers are stored per visitor
    cmds.push(['SET', K.screening(vid), JSON.stringify(record), 'EX', SCREEN_TTL_S]);
  }

  console.log(`[visitor-check] ${record.status.toUpperCase()} vid=${vid} ip=${ip} path=${path} src=${record.source} trigger=${trigger}` +
    (record.reasons.length ? ` reasons=${record.reasons.join(',')}` : '') +
    (record.asnOrg ? ` asn="${record.asnOrg}"` : '') +
    (record.error ? ` error=${record.error}` : ''));

  cmds.push(
    ['LPUSH', K.log, JSON.stringify(record)],
    ['LTRIM', K.log, 0, LOG_MAX - 1],
    ['EXPIRE', K.log, LOG_TTL_S],
    ['HINCRBY', K.counts, record.source === 'ua' ? 'declared_bot' : record.source === 'geo' ? 'non_au' : record.status, 1],
    ['EXPIRE', K.counts, LOG_TTL_S],
  );
  if (record.status === 'suspicious' && record.source !== 'ua' && record.source !== 'geo') {
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

export async function markEligible(record: VisitorRecord, rule: QualifyRule, s: QualifySignals): Promise<void> {
  const entry = {
    time: new Date().toISOString(), vid: record.vid, ip: record.ip, rule,
    listings: new Set(s.listingIds).size, filterUsed: s.filterUsed, activeSeconds: s.activeSeconds,
    country: record.country, asnOrg: record.asnOrg,
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
