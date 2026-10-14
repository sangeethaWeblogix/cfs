import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/visitorCheck";
import { mailerConfigStatus, sendAdminEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";   // nodemailer needs Node.js, not Edge

/* GET /api/cron/redis-usage/ — daily check of Upstash Redis command usage (Vercel Cron, see vercel.json).
   Emails ALERT_EMAIL_TO (cc ALERT_EMAIL_CC):
     ≥ 80% of the monthly limit → warning, once per month
     ≥ 100%                      → "limit reached", every daily run while over (Redis can't record it)
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

  const limit = Number(process.env.REDIS_MONTHLY_LIMIT) || 500_000;
  let usage;
  try {
    usage = await getMonthlyUsage();
  } catch (e: any) {
    console.error(`[redis-usage] ${e?.message ?? e}`);
    return json({ error: String(e?.message ?? e) }, 500);
  }

  const ratio = usage.used / limit;
  const level = ratio >= 1 ? "limit" : ratio >= WARN_AT ? "warning" : null;
  const result: Record<string, unknown> = { ...usage, limit, percent: Math.round(ratio * 1000) / 10, level: level ?? "ok", mailConfigured: mail.ok };

  if (!level || params.get("dry") === "1") return json({ ...result, emailed: false });

  // Warning: once per month (marker in Redis). Limit: every run — Redis rejects writes once over the limit.
  const marker = `alert:redis:warning:${new Date().toISOString().slice(0, 7)}`;
  if (level === "warning") {
    const set = await redis([["SET", marker, "1", "NX", "EX", 40 * 86400]]);
    if (set && set[0] === null) return json({ ...result, emailed: false, reason: "warning already sent this month" });
  }

  try {
    const { subject, text, html } = buildEmail(level, usage.used, limit, usage.database);
    await sendAdminEmail(subject, text, html);
    console.log(`[redis-usage] ${level.toUpperCase()} email sent: ${usage.used}/${limit}`);
    return json({ ...result, emailed: true });
  } catch (e: any) {
    console.error(`[redis-usage] email failed: ${e?.message ?? e}`);
    if (level === "warning") await redis([["DEL", marker]]);   // let tomorrow's run try again
    return json({ ...result, emailed: false, error: String(e?.message ?? e) }, 500);
  }
}
