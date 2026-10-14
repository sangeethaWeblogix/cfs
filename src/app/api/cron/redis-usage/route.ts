import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/visitorCheck";
import { mailerConfigStatus, sendAdminEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";   // nodemailer needs Node.js, not Edge

/* GET /api/cron/redis-usage/ — daily usage check (Vercel Cron, see vercel.json) for
   Upstash Redis commands AND MaxMind credit. Emails ALERT_EMAIL_TO (cc ALERT_EMAIL_CC):
     Redis   ≥ 80% of the monthly limit → warning, once per month
             ≥ 100%                      → "limit reached", every daily run while over (Redis can't record it)
     MaxMind < MAXMIND_ALERT_QUERIES lookups left (default 2,500) → warning, at most once every 7 days
             0 left / out-of-credit error                        → every daily run
   Env: UPSTASH_EMAIL + UPSTASH_API_KEY (Upstash Management API), [REDIS_MONTHLY_LIMIT=500000],
        CRON_SECRET (Vercel sends it as "Authorization: Bearer …"), SMTP_* / ALERT_EMAIL_* (see lib/mailer.ts).
   Manual use (key = VISITOR_LOG_SECRET):
     ?key=…            run the check now (emails only if over a threshold)
     ?key=…&dry=1      show usage, never email
     ?key=…&test=1     send a test email to check the SMTP settings */

const WARN_AT = 0.8;
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });

function authorised(request: NextRequest): boolean {
  const cron = process.env.CRON_SECRET;
  if (cron && request.headers.get("authorization") === `Bearer ${cron}`) return true;
  const key = process.env.VISITOR_LOG_SECRET;
  return !!key && request.nextUrl.searchParams.get("key") === key;
}

/* This month's command count for the database behind UPSTASH_REDIS_REST_URL, from the Upstash Management API */
async function getMonthlyUsage(): Promise<{ used: number; database: string; source: string }> {
  const email = process.env.UPSTASH_EMAIL;
  const apiKey = process.env.UPSTASH_API_KEY;
  if (!email || !apiKey) throw new Error("Missing env: UPSTASH_EMAIL and/or UPSTASH_API_KEY");
  const auth = { Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString("base64")}` };

  const restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const host = restUrl ? new URL(restUrl).hostname : "";

  const dbRes = await fetch("https://api.upstash.com/v2/redis/databases", { headers: auth, cache: "no-store" });
  if (!dbRes.ok) throw new Error(`Upstash API ${dbRes.status} listing databases — check UPSTASH_EMAIL / UPSTASH_API_KEY`);
  const dbs: any[] = await dbRes.json();
  const db = dbs.find(d => host && d.endpoint === host) ?? (dbs.length === 1 ? dbs[0] : null);
  if (!db) throw new Error(`No Upstash database matches ${host || "UPSTASH_REDIS_REST_URL"} (found ${dbs.length})`);

  const statsRes = await fetch(`https://api.upstash.com/v2/redis/stats/${db.database_id}`, { headers: auth, cache: "no-store" });
  if (!statsRes.ok) throw new Error(`Upstash API ${statsRes.status} reading stats for ${db.database_name}`);
  const stats: any = await statsRes.json();

  if (typeof stats.total_monthly_requests === "number") {
    return { used: stats.total_monthly_requests, database: db.database_name, source: "total_monthly_requests" };
  }
  // Fallback: add up this month's daily request counts
  const month = new Date().toISOString().slice(0, 7);
  const daily: any[] = Array.isArray(stats.dailyrequests) ? stats.dailyrequests : [];
  const used = daily.filter(d => String(d?.x ?? "").startsWith(month)).reduce((sum, d) => sum + (Number(d?.y) || 0), 0);
  if (!daily.length) throw new Error(`Unexpected Upstash stats format (fields: ${Object.keys(stats).join(", ")})`);
  return { used, database: db.database_name, source: "dailyrequests" };
}

function buildEmail(level: "warning" | "limit", used: number, limit: number, database: string) {
  const pct = Math.round((used / limit) * 100);
  const n = (x: number) => x.toLocaleString("en-AU");
  const subject = level === "limit"
    ? `[caravansforsale.com.au] Redis limit REACHED — ${pct}% of monthly commands used`
    : `[caravansforsale.com.au] Redis usage warning — ${pct}% of monthly commands used`;
  const impact = level === "limit"
    ? "The limit has been reached. Visitor screening keeps running but cannot save results: every new visitor now costs a paid MaxMind lookup, visitors show as \"unscreened\", qualifications are not saved (the ps remarketing audience stops filling) and the visitor log is empty."
    : `If usage reaches 100% before the month resets, visitor screening stops saving results: MaxMind costs rise, the ps remarketing audience stops filling and the visitor log goes empty.`;
  const action = "Upgrade the database to Pay as you go in the Upstash console (console.upstash.com → database → Details / Plan). At this site's volume that is roughly US$1–3 per month. Usage resets at the start of each month.";
  const text = [
    `Upstash Redis usage for database "${database}":`,
    `${n(used)} of ${n(limit)} commands this month (${pct}%).`,
    "", impact, "", `What to do: ${action}`, "",
    "Sent automatically by the daily check at /api/cron/redis-usage/ on caravansforsale.com.au.",
  ].join("\n");
  const html = `
    <p>Upstash Redis usage for database <b>${database}</b>:</p>
    <p style="font-size:18px"><b>${n(used)}</b> of ${n(limit)} commands this month (<b>${pct}%</b>)</p>
    <p>${impact}</p>
    <p><b>What to do:</b> ${action}</p>
    <p style="color:#6b7280;font-size:12px">Sent automatically by the daily check at /api/cron/redis-usage/ on caravansforsale.com.au.</p>`;
  return { subject, text, html };
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) return json({ error: "unauthorized" }, 401);
  const params = request.nextUrl.searchParams;
  const mail = mailerConfigStatus();

  if (params.get("test") === "1") {
    try {
      await sendAdminEmail(
        "[caravansforsale.com.au] Test — Redis usage alert email",
        "This is a test of the Redis usage alert email. If you received it, the SMTP settings work.",
        "<p>This is a test of the Redis usage alert email. If you received it, the SMTP settings work.</p>",
      );
      return json({ test: "sent", to: mail.to, cc: mail.cc });
    } catch (e: any) {
      return json({ test: "failed", error: String(e?.message ?? e), mailConfig: mail }, 500);
    }
  }

  const dry = params.get("dry") === "1";
  const [redisResult, maxmindResult] = await Promise.all([checkRedis(dry, mail.ok), checkMaxmind(dry)]);
  const failed = "error" in redisResult || "error" in maxmindResult;
  return json({ redis: redisResult, maxmind: maxmindResult }, failed ? 500 : 200);
}

/* Sends an alert email; `marker` (optional) = Redis key that limits it to once per `markerTtlS` */
async function sendOnce(
  tag: string, email: { subject: string; text: string; html: string }, marker?: string, markerTtlS?: number,
): Promise<{ emailed: boolean; reason?: string; error?: string }> {
  if (marker) {
    const set = await redis([["SET", marker, "1", "NX", "EX", markerTtlS ?? 86400]]);
    if (set && set[0] === null) return { emailed: false, reason: "already sent recently" };
  }
  try {
    await sendAdminEmail(email.subject, email.text, email.html);
    console.log(`[${tag}] alert email sent: ${email.subject}`);
    return { emailed: true };
  } catch (e: any) {
    console.error(`[${tag}] email failed: ${e?.message ?? e}`);
    if (marker) await redis([["DEL", marker]]);   // let the next run try again
    return { emailed: false, error: String(e?.message ?? e) };
  }
}

async function checkRedis(dry: boolean, mailConfigured: boolean): Promise<Record<string, unknown>> {
  const limit = Number(process.env.REDIS_MONTHLY_LIMIT) || 500_000;
  let usage;
  try {
    usage = await getMonthlyUsage();
  } catch (e: any) {
    console.error(`[redis-usage] ${e?.message ?? e}`);
    return { error: String(e?.message ?? e) };
  }

  const ratio = usage.used / limit;
  const level = ratio >= 1 ? "limit" : ratio >= WARN_AT ? "warning" : null;
  const result = { ...usage, limit, percent: Math.round(ratio * 1000) / 10, level: level ?? "ok", mailConfigured };
  if (!level || dry) return { ...result, emailed: false };

  // Warning: once per month. Limit: every run — Redis rejects writes once over the limit, so no marker is possible.
  const marker = level === "warning" ? `alert:redis:warning:${new Date().toISOString().slice(0, 7)}` : undefined;
  return { ...result, ...(await sendOnce("redis-usage", buildEmail(level, usage.used, limit, usage.database), marker, 40 * 86400)) };
}

/* ── MaxMind credit ──
   MaxMind has no balance endpoint, but every Insights response includes `maxmind.queries_remaining`.
   So this check makes ONE lookup a day (≈ US$0.002, no Redis commands) and reads it from the reply.
   Alerts: below MAXMIND_ALERT_QUERIES (default 2,500 ≈ US$5) → warning at most once every 7 days;
   0 left / out-of-credit error → every run. */
const MAXMIND_COST_PER_QUERY_USD = 0.002;
const CREDIT_PROBE_IP = "1.1.1.1";   // any public IP — only the remaining-credit figure is used
const NO_CREDIT_CODES = new Set(["OUT_OF_QUERIES", "INSUFFICIENT_FUNDS"]);

async function getMaxmindCredit(): Promise<{ queriesRemaining: number; time: string; error?: string }> {
  const accountId = process.env.MAXMIND_ACCOUNT_ID;
  const licenseKey = process.env.MAXMIND_LICENSE_KEY;
  if (!accountId || !licenseKey) throw new Error("Missing env: MAXMIND_ACCOUNT_ID and/or MAXMIND_LICENSE_KEY");
  const time = new Date().toISOString();

  const res = await fetch(`https://geoip.maxmind.com/geoip/v2.1/insights/${CREDIT_PROBE_IP}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${accountId}:${licenseKey}`).toString("base64")}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = String(body?.code ?? `HTTP_${res.status}`);
    if (NO_CREDIT_CODES.has(code) || res.status === 402) return { queriesRemaining: 0, time, error: code };
    throw new Error(`MaxMind ${code}: ${body?.error ?? "lookup failed"}`);
  }
  const left = body?.maxmind?.queries_remaining;
  if (typeof left !== "number") throw new Error("MaxMind response had no maxmind.queries_remaining");
  return { queriesRemaining: left, time };
}

function buildMaxmindEmail(level: "low" | "out", remaining: number, readingTime: string) {
  const n = remaining.toLocaleString("en-AU");
  const dollars = (remaining * MAXMIND_COST_PER_QUERY_USD).toFixed(2);
  const subject = level === "out"
    ? "[caravansforsale.com.au] MaxMind credit USED UP — visitor screening has stopped"
    : `[caravansforsale.com.au] MaxMind credit low — ${n} lookups left (≈ US$${dollars})`;
  const impact = level === "out"
    ? "MaxMind has no credit left. New visitors cannot be screened: they stay \"uk\" and can never become \"ps\", so the remarketing audience stops filling and VPN / bot traffic is no longer flagged."
    : "When the credit runs out, new visitors can no longer be screened: the ps remarketing audience stops filling and VPN / bot traffic is no longer flagged.";
  const action = "Add credit in the MaxMind account (www.maxmind.com → Account → Purchase / Add funds), or turn on auto-recharge so this does not happen again.";
  const text = [
    level === "out" ? "MaxMind credit is used up." : `MaxMind credit is low: ${n} GeoIP Insights lookups left (about US$${dollars}).`,
    `Last reading: ${readingTime}.`, "", impact, "", `What to do: ${action}`, "",
    "Sent automatically by the daily check at /api/cron/redis-usage/ on caravansforsale.com.au.",
  ].join("\n");
  const html = `
    <p>${level === "out" ? "<b>MaxMind credit is used up.</b>" : `MaxMind credit is low: <b>${n}</b> GeoIP Insights lookups left (about <b>US$${dollars}</b>).`}</p>
    <p style="color:#6b7280">Last reading: ${readingTime}</p>
    <p>${impact}</p>
    <p><b>What to do:</b> ${action}</p>
    <p style="color:#6b7280;font-size:12px">Sent automatically by the daily check at /api/cron/redis-usage/ on caravansforsale.com.au.</p>`;
  return { subject, text, html };
}

async function checkMaxmind(dry: boolean): Promise<Record<string, unknown>> {
  const threshold = Number(process.env.MAXMIND_ALERT_QUERIES) || 2_500;
  let credit;
  try {
    credit = await getMaxmindCredit();
  } catch (e: any) {
    console.error(`[maxmind-credit] ${e?.message ?? e}`);
    return { error: String(e?.message ?? e) };
  }

  const level = credit.queriesRemaining <= 0 || credit.error ? "out" : credit.queriesRemaining < threshold ? "low" : null;
  const result = {
    queriesRemaining: credit.queriesRemaining,
    approxUsd: Number((credit.queriesRemaining * MAXMIND_COST_PER_QUERY_USD).toFixed(2)),
    readingTime: credit.time, threshold, level: level ?? "ok", ...(credit.error ? { lastError: credit.error } : {}),
  };
  if (!level || dry) return { ...result, emailed: false };

  const marker = level === "low" ? "alert:maxmind:low" : undefined;
  return { ...result, ...(await sendOnce("maxmind-credit", buildMaxmindEmail(level, credit.queriesRemaining, credit.time), marker, 7 * 86400)) };
}
