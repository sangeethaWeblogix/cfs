const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Same error within 5 min = skip (prevents spam when many users hit same bug)
const recentAlerts = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

export async function sendTelegramAlert(
  message: string,
  dedupeKey?: string
): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const key = (dedupeKey ?? message).substring(0, 100);
  const lastSent = recentAlerts.get(key);
  if (lastSent && Date.now() - lastSent < COOLDOWN_MS) return;
  recentAlerts.set(key, Date.now());

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch {}
}
