/* Client-side engagement state for visitor qualification (read by <VisitorQualifier />).
   Stored in localStorage so it is shared across tabs and full page loads. */
import type { QualifySignals } from "./qualifyRules";

const STORAGE_KEY = "cfs_vq";
const INACTIVITY_RESET_MS = 30 * 60_000; // 30 min with no activity → engagement counters reset

export interface EngagementState extends QualifySignals {
  lastActive: number;                   // last real user activity (not background updates)
  done?: "qualified";
  retryAt?: number;
}

const fresh = (): EngagementState => ({ listingIds: [], filterUsed: false, scrolled: false, clicked: false, activeSeconds: 0, lastActive: Date.now() });

export function loadEngagement(): EngagementState {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as EngagementState | null;
    if (!s || typeof s.lastActive !== "number") return fresh();
    if (!s.done && Date.now() - s.lastActive > INACTIVITY_RESET_MS) return fresh();
    return { ...fresh(), ...s };   // fills fields missing from older stored versions
  } catch {
    return fresh();
  }
}

/* Read-modify-write so several open tabs share one state.
   `activity` = this update reflects real user activity (keeps the 30-min window alive). */
export function updateEngagement(fn: (s: EngagementState) => void, activity = true): EngagementState {
  const s = loadEngagement();
  fn(s);
  if (activity) s.lastActive = Date.now();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  return s;
}

/* Applied a listings filter or submitted a search */
export function trackEngagement(_type: "filter" | "search") {
  updateEngagement(s => { s.filterUsed = true; });
}

/* Viewed a caravan detail page — keyed by the permanent listing ID, so refreshing
   or revisiting the same caravan never counts as another distinct listing. */
export function trackListingView(listingId: string | number) {
  const id = String(listingId);
  if (!id) return;
  updateEngagement(s => { if (!s.listingIds.includes(id)) s.listingIds.push(id); });
}
