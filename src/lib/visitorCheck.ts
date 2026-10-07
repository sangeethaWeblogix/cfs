/* ──────────────────────────────────────────────
   Visitor screening (MaxMind GeoIP Insights) + qualification
   - Each visitor (cfs_vid cookie) is screened ONCE, in the background.
   - Status: eligible | suspicious | unknown (timeouts/errors stay unknown).
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
  source: 'maxmind' | 'ip_cache' | 'ua' | 'error';
  country?: string;
  registeredCountry?: string;
  asnOrg?: string;
  userType?: string;
  risk?: number;
  anonProvider?: string;
  error?: string;
}

type Verdict = Pick<VisitorRecord, 'status' | 'reasons' | 'country' | 'registeredCountry' | 'asnOrg' | 'userType' | 'risk' | 'anonProvider'>;

export const VID_COOKIE = 'cfs_vid';
export const VID_MAX_AGE_S = 30 * 86400;

const MAXMIND_TIMEOUT_MS = 1500;
const IP_CACHE_TTL_S = 86400;
const LOG_MAX = 5000;

const K = {
  visitor: (vid: string) => `vc:v:${vid}`,
  qualified: (vid: string) => `vc:q:${vid}`,
  ip: (ip: string) => `vc:ip:${ip}`,
  log: 'vc:log',
  qualifiedLog: 'vc:qualified',
  counts: 'vc:counts',
};

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

/**
 * Screen a visitor once and store the result against their visitor ID.
 * Designed to run inside event.waitUntil() so it never delays the page.
 */
export async function screenVisitor(vid: string, ip: string, path: string, ua: string, declaredBot: boolean): Promise<VisitorRecord> {
  const base = { time: new Date().toISOString(), vid, ip, path, ua: ua.slice(0, 200) };
  let record: VisitorRecord;
  const cmds: (string | number)[][] = [];

  if (declaredBot) {
    // Self-identified crawlers (Googlebot etc.) — no paid lookup needed
    record = { ...base, status: 'suspicious', reasons: ['bot_user_agent'], source: 'ua' };
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
        // Timeout / error → stays unknown for this visitor (IP not cached)
        record = { ...base, status: 'unknown', reasons: [], source: 'error', error: result.error };
      }
    }
    // Crawlers get a new ID on every request, so only real browsers are stored per visitor
    cmds.push(['SET', K.visitor(vid), JSON.stringify(record), 'EX', VID_MAX_AGE_S]);
  }

  console.log(`[visitor-check] ${record.status.toUpperCase()} vid=${vid} ip=${ip} path=${path} src=${record.source}` +
    (record.reasons.length ? ` reasons=${record.reasons.join(',')}` : '') +
    (record.asnOrg ? ` asn="${record.asnOrg}"` : '') +
    (record.error ? ` error=${record.error}` : ''));

  cmds.push(
    ['LPUSH', K.log, JSON.stringify(record)],
    ['LTRIM', K.log, 0, LOG_MAX - 1],
    ['HINCRBY', K.counts, record.source === 'ua' ? 'declared_bot' : record.status, 1],
  );
  if (record.status === 'suspicious' && !declaredBot) cmds.push(['LPUSH', 'ads:flagged', `${record.time}|${ip}`]);
  await redis(cmds);

  return record;
}

export async function getVisitorRecord(vid: string): Promise<VisitorRecord | null> {
  return parse<VisitorRecord>((await redis([['GET', K.visitor(vid)]]))?.[0]);
}

export async function getQualified(vid: string): Promise<{ time: string; rule: QualifyRule } | null> {
  return parse((await redis([['GET', K.qualified(vid)]]))?.[0]);
}

export async function markQualified(record: VisitorRecord, rule: QualifyRule, s: QualifySignals): Promise<void> {
  const entry = {
    time: new Date().toISOString(), vid: record.vid, ip: record.ip, rule,
    listings: new Set(s.listingIds).size, filterUsed: s.filterUsed, activeSeconds: s.activeSeconds,
    country: record.country, asnOrg: record.asnOrg,
  };
  console.log(`[visitor-check] QUALIFIED vid=${record.vid} rule=${rule}`);
  await redis([
    ['SET', K.qualified(record.vid), JSON.stringify(entry), 'EX', VID_MAX_AGE_S],
    ['LPUSH', K.qualifiedLog, JSON.stringify(entry)],
    ['LTRIM', K.qualifiedLog, 0, LOG_MAX - 1],
    ['HINCRBY', K.counts, 'qualified', 1],
    ['HINCRBY', K.counts, `qualified_${rule}`, 1],
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
