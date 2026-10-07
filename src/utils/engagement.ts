/* Signals user engagement to <VisitorQualifier /> (visitor qualification rules). */
export type EngagementType = "filter" | "search";

export const ENGAGEMENT_EVENT = "cfs:engage";

export function trackEngagement(type: EngagementType) {
  try {
    window.dispatchEvent(new CustomEvent(ENGAGEMENT_EVENT, { detail: { type } }));
  } catch {}
}
