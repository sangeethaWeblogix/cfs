/* Visitor qualification rules — shared by <VisitorQualifier /> (client) and
   /api/visitor-qualify (server, which also requires IP screening = eligible). */

export interface QualifySignals {
  listingIds: string[];   // distinct caravan detail pages viewed
  filterUsed: boolean;    // applied a listings filter or submitted a search
  activeSeconds: number;  // active engagement time
}

export type QualifyRule = "detail_20s" | "filter_search_45s" | "two_listings";

const DETAIL_MIN_ACTIVE_S = 20;
const FILTER_MIN_ACTIVE_S = 45;
const DISTINCT_LISTINGS = 2;

export function matchQualifyRule(s: QualifySignals): QualifyRule | null {
  const distinct = new Set(s.listingIds).size;
  if (distinct >= DISTINCT_LISTINGS) return "two_listings";
  if (distinct >= 1 && s.activeSeconds >= DETAIL_MIN_ACTIVE_S) return "detail_20s";
  if (s.filterUsed && s.activeSeconds >= FILTER_MIN_ACTIVE_S) return "filter_search_45s";
  return null;
}
