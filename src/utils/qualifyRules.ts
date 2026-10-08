/* Visitor qualification rules — shared by <VisitorQualifier /> (client) and
   /api/visitor-qualify (server, which also requires IP screening = eligible). */

export interface QualifySignals {
  listingIds: string[];   // distinct caravan detail pages viewed
  filterUsed: boolean;    // applied a listings filter or submitted a search
  scrolled: boolean;      // user scrolled (wheel / touch / keyboard — not programmatic scrolls)
  clicked: boolean;       // user clicked / tapped
  activeSeconds: number;  // active engagement time across the visit
}

export type QualifyRule = "product_page" | "filter_search" | "scroll" | "click";

const MIN_ACTIVE_S = 40;

/* Qualified = at least MIN_ACTIVE_S active time AND at least one real interaction.
   Mouse movement alone keeps the timer running but never qualifies. The rule
   returned is the strongest interaction seen (for reporting). */
export function matchQualifyRule(s: QualifySignals): QualifyRule | null {
  if (s.activeSeconds < MIN_ACTIVE_S) return null;
  if (s.listingIds.length > 0) return "product_page";
  if (s.filterUsed) return "filter_search";
  if (s.scrolled) return "scroll";
  if (s.clicked) return "click";
  return null;
}
