/* Visitor status (as | uk | ps) + entry source for the GTM dataLayer.
   Kept internally (storage + dataLayer) — the page URL is never changed.
   Read by <VisitorStatus /> (every page view) and <VisitorQualifier /> (on qualification). */

export type VisitorStatusCode = "as" | "uk" | "ps" | "unscreened";

export interface EntrySource {
  source: string;
  medium: string;
}

const SOURCE_KEY = "cfs_src";             // localStorage: { source, medium, lastSeen }
const STATUS_KEY = "cfs_vs";              // sessionStorage: { status, at }
const SENT_KEY = "cfs_vs_sent";           // sessionStorage: last status+source sent as an event
const VISIT_TIMEOUT_MS = 30 * 60_000;     // same 30-min visit window as engagement tracking
export const STATUS_CACHE_MS = 10 * 60_000;

const SEARCH_ENGINES: [RegExp, string][] = [
  [/(^|\.)google\./, "google"], [/(^|\.)bing\.com$/, "bing"], [/(^|\.)yahoo\./, "yahoo"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"], [/(^|\.)ecosia\.org$/, "ecosia"], [/(^|\.)baidu\.com$/, "baidu"],
  [/(^|\.)yandex\./, "yandex"], [/(^|\.)search\.brave\.com$/, "brave"],
];
const SOCIAL: [RegExp, string][] = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, "facebook"], [/(^|\.)instagram\.com$/, "instagram"],
  [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "x"], [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
  [/(^|\.)youtube\.com$/, "youtube"], [/(^|\.)reddit\.com$/, "reddit"], [/(^|\.)pinterest\./, "pinterest"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
];

const read = <T>(store: Storage, key: string): T | null => {
  try { return JSON.parse(store.getItem(key) || "null") as T | null; } catch { return null; }
};
const write = (store: Storage, key: string, v: unknown) => {
  try { store.setItem(key, JSON.stringify(v)); } catch {}
};

/* Where THIS landing came from, or null when nothing in the request says so
   (no campaign params and no external referrer — e.g. moving between our own pages). */
function detectFromLanding(): EntrySource | null {
  const q = new URLSearchParams(window.location.search);
  const utmSource = q.get("utm_source")?.trim().toLowerCase();
  if (utmSource) return { source: utmSource, medium: q.get("utm_medium")?.trim().toLowerCase() || "(not set)" };
  if (q.has("gclid") || q.has("gbraid") || q.has("wbraid") || q.has("gad_source")) return { source: "google", medium: "cpc" };
  if (q.has("msclkid")) return { source: "bing", medium: "cpc" };
  if (q.has("fbclid")) return { source: "facebook", medium: "social" };

  let host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ""; } catch {}
  if (!host || host === window.location.hostname || host.endsWith(".caravansforsale.com.au")) return null;

  const engine = SEARCH_ENGINES.find(([re]) => re.test(host));
  if (engine) return { source: engine[1], medium: "organic" };
  const social = SOCIAL.find(([re]) => re.test(host));
  if (social) return { source: social[1], medium: "social" };
  return { source: host.replace(/^www\./, ""), medium: "referral" };
}

/* Entry source for the current visit. A new campaign / external referrer starts a new
   attribution; otherwise the visit's original source is kept until 30 min of inactivity.
   Nothing to go on = direct (only labelled google / organic etc. when the request supports it). */
let landingChecked = false;   // per full page load — client-side navigations keep the old document.referrer

export function getEntrySource(): EntrySource {
  const now = Date.now();
  const stored = read<EntrySource & { lastSeen: number }>(localStorage, SOURCE_KEY);
  const landing = landingChecked ? null : detectFromLanding();
  landingChecked = true;
  const current =
    landing ??
    (stored && now - stored.lastSeen < VISIT_TIMEOUT_MS ? { source: stored.source, medium: stored.medium } : null) ??
    { source: "(direct)", medium: "(none)" };
  write(localStorage, SOURCE_KEY, { ...current, lastSeen: now });
  return current;
}

export function getCachedStatus(): { status: VisitorStatusCode; at: number } | null {
  return read(sessionStorage, STATUS_KEY);
}

/* Store the status and push it to the dataLayer.
   - Every call pushes the plain variables, so any GTM tag on this page can read them.
   - The `visitor_status` event (→ GA4 user property) fires only when status or source changed
     this session, so GA4 isn't sent a duplicate event on every page view. */
export function publishVisitorStatus(status: VisitorStatusCode, src: EntrySource = getEntrySource()) {
  write(sessionStorage, STATUS_KEY, { status, at: Date.now() });

  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  const vars = { visitor_status: status, entry_source: src.source, entry_medium: src.medium };
  w.dataLayer.push(vars);

  const signature = `${status}|${src.source}|${src.medium}`;
  if (read<string>(sessionStorage, SENT_KEY) !== signature) {
    write(sessionStorage, SENT_KEY, signature);
    w.dataLayer.push({ event: "visitor_status", ...vars });
  }
}
