/* ──────────────────────────────────────────────
   Visitor check (MaxMind GeoIP Insights) — LOG-ONLY
   Classifies visitors on home + listings as real / bot.
   Nothing is blocked; results go to Vercel logs and (if configured) Upstash Redis.
────────────────────────────────────────────── */

export type VisitorStatus = 'real' | 'bot' | 'declared_bot' | 'unknown';

export interface VisitorRecord {
  time: string;
  ip: string;
  path: string;
  ua: string;
  status: VisitorStatus;
  reasons: string[];
  source: 'maxmind' | 'cache' | 'ua' | 'error';
  country?: string;
  registeredCountry?: string;
  asnOrg?: string;
  userType?: string;
  risk?: number;
  anonProvider?: string;
  error?: string;
}

type Verdict = Pick<VisitorRecord, 'status' | 'reasons' | 'country' | 'registeredCountry' | 'asnOrg' | 'userType' | 'risk' | 'anonProvider'>;

const MAXMIND_TIMEOUT_MS = 1500;
const IP_CACHE_TTL_S = 86400;
const LOG_KEY = 'visitors:log';
const LOG_MAX = 5000;

/* Tunable thresholds (review after the log-only period) */
const RISK_THRESHOLD = 50;
const RESIDENTIAL_PROXY_CONFIDENCE = 50;

/* Edge-instance memory cache — saves lookups when Redis isn't configured */
const memCache = new Map<string, { verdict: Verdict; expires: number }>();

export function getClientIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  const ip = (xff ? xff.split(',')[0] : headers.get('x-real-ip') || '').trim();
  return ip || null;
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

async function getCachedVerdict(ip: string): Promise<Verdict | null> {
  const mem = memCache.get(ip);
  if (mem && mem.expires > Date.now()) return mem.verdict;
  const out = await redis([['GET', `ipv:${ip}`]]);
  if (out?.[0]) {
    try {
      const verdict = JSON.parse(out[0]) as Verdict;
      memCache.set(ip, { verdict, expires: Date.now() + IP_CACHE_TTL_S * 1000 });
      return verdict;
    } catch {}
  }
  return null;
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
    status: reasons.length ? 'bot' : 'real',
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
 * Identify a visitor and log the result. Designed to run inside event.waitUntil()
 * so it never delays the page response.
 */
export async function checkVisitor(ip: string, path: string, ua: string, declaredBot: boolean): Promise<VisitorRecord> {
  const base = { time: new Date().toISOString(), ip, path, ua: ua.slice(0, 200) };
  let record: VisitorRecord;

  if (declaredBot) {
    // Self-identified crawlers (Googlebot etc.) — no paid lookup needed
    record = { ...base, status: 'declared_bot', reasons: ['bot_user_agent'], source: 'ua' };
  } else {
    const cached = await getCachedVerdict(ip);
    if (cached) {
      record = { ...base, ...cached, source: 'cache' };
    } else {
      const result = await lookupMaxMind(ip);
      if ('verdict' in result) {
        record = { ...base, ...result.verdict, source: 'maxmind' };
        memCache.set(ip, { verdict: result.verdict, expires: Date.now() + IP_CACHE_TTL_S * 1000 });
        await redis([['SET', `ipv:${ip}`, JSON.stringify(result.verdict), 'EX', IP_CACHE_TTL_S]]);
      } else {
        record = { ...base, status: 'unknown', reasons: [], source: 'error', error: result.error };
      }
    }
  }

  console.log(`[visitor-check] ${record.status.toUpperCase()} ip=${ip} path=${path} src=${record.source}` +
    (record.reasons.length ? ` reasons=${record.reasons.join(',')}` : '') +
    (record.asnOrg ? ` asn="${record.asnOrg}"` : '') +
    (record.error ? ` error=${record.error}` : ''));

  const cmds: (string | number)[][] = [
    ['LPUSH', LOG_KEY, JSON.stringify(record)],
    ['LTRIM', LOG_KEY, 0, LOG_MAX - 1],
    ['HINCRBY', 'visitors:counts', record.status, 1],
  ];
  if (record.status === 'bot') cmds.push(['LPUSH', 'ads:flagged', `${record.time}|${ip}`]);
  await redis(cmds);

  return record;
}

export async function readVisitorLog(limit: number): Promise<{ configured: boolean; counts: Record<string, number>; records: VisitorRecord[] }> {
  const out = await redis([['LRANGE', LOG_KEY, 0, limit - 1], ['HGETALL', 'visitors:counts']]);
  if (!out) return { configured: false, counts: {}, records: [] };
  const records = (out[0] ?? []).map((s: string) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
  const flat: string[] = out[1] ?? [];
  const counts: Record<string, number> = {};
  for (let i = 0; i < flat.length; i += 2) counts[flat[i]] = Number(flat[i + 1]);
  return { configured: true, counts, records };
}
