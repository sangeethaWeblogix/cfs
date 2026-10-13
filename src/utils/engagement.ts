/* Client-side engagement state for visitor qualification (read by <VisitorQualifier />).
   Stored in localStorage so it is shared across tabs and full page loads. */
import type { QualifySignals } from "./qualifyRules";

const STORAGE_KEY = "cfs_vq";
const INACTIVITY_RESET_MS = 30 * 60_000; // 30 min with no activity → engagement counters reset
const QUALIFIED_TTL_MS = 30 * 86400_000;  // same 30 days as the server's eligibility — then re-qualify

export interface EngagementState extends QualifySignals {
  lastActive: number;                   // last real user activity (not background updates)
  done?: "qualified";
  doneAt?: number;                      // when they qualified
  retryAt?: number;
}

const fresh = (): EngagementState => ({ listingIds: [], filterUsed: false, scrolled: false, clicked: false, activeSeconds: 0, lastActive: Date.now() });

export function loadEngagement(): EngagementState {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as EngagementState | null;
    if (!s || typeof s.lastActive !== "number") return fresh();
    if (!s.done && Date.now() - s.lastActive > INACTIVITY_RESET_MS) return fresh();
    // Qualification expired → start counting again (older states have no doneAt: lastActive ≈ when they qualified)
    if (s.done && Date.now() - (s.doneAt ?? s.lastActive) > QUALIFIED_TTL_MS) return fresh();
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

/* Server says the visitor is no longer qualified (eligibility expired / new visitor ID) but this
   browser still thinks it is — start engagement from zero so they can re-qualify. */
export function resetQualification() {
  if (!loadEngagement().done) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh())); } catch {}
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
