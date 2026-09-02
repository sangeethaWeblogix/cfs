import type { FilterState } from "./StateFilterBar";

/**
 * Shared scope-param builders for /api/params-count/ queries — used by both
 * StateFilterBar.tsx (client, live filter-change fetches) and page.tsx
 * (server, SSR seed for the initial mount) so the two always request the
 * exact same scope and never drift apart.
 */

/** Scope for a category-count query — every active filter except category itself. */
export function buildCategoryCountScope(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.make)               params.set("make", filters.make);
  if (filters.model)              params.set("model", filters.model);
  if (filters.condition)          params.set("condition", filters.condition);
  if (filters.state)              params.set("state", String(filters.state).toLowerCase());
  if (filters.region)             params.set("region", filters.region);
  if (filters.suburb)             params.set("suburb", filters.suburb);
  if (filters.pincode)            params.set("pincode", filters.pincode);
  if (filters.from_price)         params.set("from_price", String(filters.from_price));
  if (filters.to_price)           params.set("to_price", String(filters.to_price));
  if (filters.minKg)              params.set("from_atm", String(filters.minKg));
  if (filters.maxKg)              params.set("to_atm", String(filters.maxKg));
  if (filters.acustom_fromyears)  params.set("acustom_fromyears", String(filters.acustom_fromyears));
  if (filters.acustom_toyears)    params.set("acustom_toyears", String(filters.acustom_toyears));
  if (filters.from_length)        params.set("from_length", String(filters.from_length));
  if (filters.to_length)          params.set("to_length", String(filters.to_length));
  if (filters.from_sleep)         params.set("from_sleep", String(filters.from_sleep));
  if (filters.to_sleep)           params.set("to_sleep", String(filters.to_sleep));
  if (filters.keyword)            params.set("keyword", filters.keyword);
  return params;
}

/** Scope for a make-count query — every active filter except make/model
 * (make/model are excluded on purpose — they're what group_by is counting). */
export function buildMakeCountScope(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.category)          params.set("category", filters.category);
  if (filters.condition)         params.set("condition", filters.condition);
  if (filters.state)             params.set("state", String(filters.state).toLowerCase());
  if (filters.region)            params.set("region", filters.region);
  if (filters.suburb)            params.set("suburb", filters.suburb);
  if (filters.pincode)           params.set("pincode", filters.pincode);
  if (filters.from_price)        params.set("from_price", String(filters.from_price));
  if (filters.to_price)          params.set("to_price", String(filters.to_price));
  if (filters.minKg)             params.set("from_atm", String(filters.minKg));
  if (filters.maxKg)             params.set("to_atm", String(filters.maxKg));
  if (filters.acustom_fromyears) params.set("acustom_fromyears", String(filters.acustom_fromyears));
  if (filters.acustom_toyears)   params.set("acustom_toyears", String(filters.acustom_toyears));
  if (filters.from_length)       params.set("from_length", String(filters.from_length));
  if (filters.to_length)         params.set("to_length", String(filters.to_length));
  if (filters.from_sleep)        params.set("from_sleep", String(filters.from_sleep));
  if (filters.to_sleep)          params.set("to_sleep", String(filters.to_sleep));
  if (filters.keyword)           params.set("keyword", filters.keyword);
  return params;
}
