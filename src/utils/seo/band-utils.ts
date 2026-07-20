// Edge-runtime-safe: no fs, path, or process.cwd()

export const PRICE_BANDS_ORDERED = [
  "under-10000",
  "between-10000-20000",
  "under-20000",
  "between-20000-30000",
  "under-30000",
  "between-30000-40000",
  "under-40000",
  "between-40000-50000",
  "under-50000",
  "between-50000-60000",
  "under-60000",
  "between-60000-70000",
  "under-70000",
  "between-70000-80000",
  "under-80000",
  "between-80000-90000",
  "under-90000",
  "between-90000-100000",
  "under-100000",
  "between-100000-125000",
  "under-125000",
  "between-125000-150000",
  "under-150000",
  "between-150000-175000",
  "under-175000",
  "between-175000-200000",
  "under-200000",
  "between-200000-225000",
  "under-225000",
  "between-225000-250000",
  "under-250000",
  "between-250000-275000",
  "under-275000",
  "between-275000-300000",
  "under-300000",
  "over-200000",
];

export const ATM_BANDS_ORDERED = [
  "under-600-kg-atm",
  "under-800-kg-atm",
  "under-1000-kg-atm",
  "under-1250-kg-atm",
  "under-1500-kg-atm",
  "under-1750-kg-atm",
  "under-2000-kg-atm",
  "under-2250-kg-atm",
  "under-2500-kg-atm",
  "under-2750-kg-atm",
  "under-3000-kg-atm",
  "under-3500-kg-atm",
  "under-4000-kg-atm",
  "under-4500-kg-atm",
  "over-3500-kg-atm",
];

export const SLEEP_BANDS_ORDERED = [
  "under-2-people-sleeping-capacity",
  "between-2-2-people-sleeping-capacity",
  "under-3-people-sleeping-capacity",
  "between-3-3-people-sleeping-capacity",
  "under-4-people-sleeping-capacity",
  "between-4-4-people-sleeping-capacity",
  "under-5-people-sleeping-capacity",
  "between-5-5-people-sleeping-capacity",
  "between-6-6-people-sleeping-capacity",
  "over-5-people-sleeping-capacity",
];

export const LENGTH_BANDS_ORDERED = [
  "under-12-length-in-feet",
  "under-13-length-in-feet",
  "between-12-14-length-in-feet",
  "under-14-length-in-feet",
  "under-15-length-in-feet",
  "between-14-16-length-in-feet",
  "under-16-length-in-feet",
  "under-17-length-in-feet",
  "between-16-18-length-in-feet",
  "under-18-length-in-feet",
  "under-19-length-in-feet",
  "between-18-20-length-in-feet",
  "under-20-length-in-feet",
  "under-21-length-in-feet",
  "between-20-22-length-in-feet",
  "under-22-length-in-feet",
  "under-23-length-in-feet",
  "between-22-24-length-in-feet",
  "under-24-length-in-feet",
  "under-25-length-in-feet",
  "between-24-26-length-in-feet",
  "under-26-length-in-feet",
  "under-27-length-in-feet",
  "between-26-28-length-in-feet",
  "under-28-length-in-feet",
  "over-24-length-in-feet",
];

export const ALLOWED_PRICE_BANDS  = new Set(PRICE_BANDS_ORDERED);
export const ALLOWED_ATM_BANDS    = new Set(ATM_BANDS_ORDERED);
export const ALLOWED_SLEEP_BANDS  = new Set(SLEEP_BANDS_ORDERED);
export const ALLOWED_LENGTH_BANDS = new Set(LENGTH_BANDS_ORDERED);

export function isAllowedSingleBand(slugSegments: string[]): boolean {
  const price  = slugSegments.find(s => /^(under|over)-\d+$/.test(s) || /^between-\d+-\d+$/.test(s));
  const atm    = slugSegments.find(s => s.includes("-kg-atm"));
  const sleep  = slugSegments.find(s => s.includes("-people-sleeping-capacity"));
  const length = slugSegments.find(s => s.includes("-length-in-feet"));
  if (price)  return ALLOWED_PRICE_BANDS.has(price);
  if (atm)    return ALLOWED_ATM_BANDS.has(atm);
  if (sleep)  return ALLOWED_SLEEP_BANDS.has(sleep);
  if (length) return ALLOWED_LENGTH_BANDS.has(length);
  return false;
}
