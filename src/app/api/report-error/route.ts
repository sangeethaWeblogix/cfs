import { NextRequest, NextResponse } from "next/server";
import { reportGitHubIssue, GitHubErrorPayload } from "@/lib/reportGitHubIssue";
import { sendTelegramAlert } from "@/lib/telegramAlert";

export async function POST(request: NextRequest) {
  try {
    const payload: GitHubErrorPayload = await request.json();

    const severity = payload.errorType?.toLowerCase().includes("timed out") ||
      payload.errorType?.toLowerCase().includes("5") ? "🔴" : "🟠";

    const tgText =
      `${severity} <b>${payload.errorSource} Error — caravansforsale.com.au</b>\n\n` +
      `<b>Type:</b> ${payload.errorType}\n` +
      `<b>Message:</b> ${payload.message?.substring(0, 300)}\n` +
      (payload.pageUrl ? `<b>Page:</b> ${payload.pageUrl}` : "");

    // Fire-and-forget — don't block the response
    reportGitHubIssue(payload).catch(() => {});
    sendTelegramAlert(tgText, payload.errorType).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
