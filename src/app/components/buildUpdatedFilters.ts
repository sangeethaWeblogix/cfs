import { Filters } from "../components/ListContent/Listings";

type PartialUpdate = Partial<Filters>;

/**
 * Safely merges current filters with updated fields, preserving existing values
 * and avoiding overwriting with undefined.
 */
export function buildUpdatedFilters(
  currentFilters: Filters,
  updates: PartialUpdate
): Filters {
  const nextRadius =
    updates.radius_kms !== undefined && updates.radius_kms !== null
      ? Number(updates.radius_kms) > 50
        ? Number(updates.radius_kms)
        : currentFilters.radius_kms ?? 50 // ignore ≤ 50; keep existing (fallback 50)
      : currentFilters.radius_kms;
  return {
    ...currentFilters,
    category: updates.category ?? currentFilters.category,
    make: updates.make ?? currentFilters.make,
    model: updates.model ?? currentFilters.model,
    state: updates.state ?? currentFilters.state,
    region: updates.region ?? currentFilters.region,
    suburb: updates.suburb ?? currentFilters.suburb,
    pincode: updates.pincode ?? currentFilters.pincode,
    condition: updates.condition ?? currentFilters.condition,
    sleeps: updates.sleeps ?? currentFilters.sleeps,
    from_price: updates.from_price ?? currentFilters.from_price,
    to_price: updates.to_price ?? currentFilters.to_price,
    minKg: updates.minKg ?? currentFilters.minKg,
    maxKg: updates.maxKg ?? currentFilters.maxKg,
    acustom_fromyears:
      updates.acustom_fromyears ?? currentFilters.acustom_fromyears,
    acustom_toyears: updates.acustom_toyears ?? currentFilters.acustom_toyears,
    from_length: updates.from_length ?? currentFilters.from_length,
    to_length: updates.to_length ?? currentFilters.to_length,
    location: updates.location ?? currentFilters.location,
    orderby: updates.orderby ?? currentFilters.orderby,
    radius_kms: nextRadius, // ✅ only updates when > 50
    search: updates.search ?? currentFilters.search,
    keyword: updates.keyword ?? currentFilters.keyword,
  };
}
