/* Admin notification emails via the same SMTP server as the WordPress site.
   Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, [SMTP_FROM], [SMTP_SECURE=true|false]
        ALERT_EMAIL_TO (admin), [ALERT_EMAIL_CC] (comma-separated)
   Node.js runtime only (not Edge / middleware). */
import nodemailer from "nodemailer";

const list = (v?: string) => (v ?? "").split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);

export function mailerConfigStatus() {
  const missing = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "ALERT_EMAIL_TO"].filter(k => !process.env[k]);
  return { ok: missing.length === 0, missing, to: list(process.env.ALERT_EMAIL_TO), cc: list(process.env.ALERT_EMAIL_CC) };
}

export async function sendAdminEmail(subject: string, text: string, html: string): Promise<void> {
  const cfg = mailerConfigStatus();
  if (!cfg.ok) throw new Error(`Email not configured — missing env: ${cfg.missing.join(", ")}`);

  const port = Number(process.env.SMTP_PORT);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 = TLS from the start; 587/25 = STARTTLS. Override with SMTP_SECURE if the server differs.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: cfg.to,
    cc: cfg.cc.length ? cfg.cc : undefined,
    subject,
    text,
    html,
  });
}
