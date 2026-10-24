// Product spec links (Length, ATM) must land on a band page that is listed in url.csv — the
// exact value (e.g. 21.5 ft, 3300 kg) has no indexable page of its own. Keep these in sync
// with the single-filter band URLs in src/app/url.csv.
const LENGTH_UNDER_FT = [14, 16, 18, 20];
const ATM_UNDER_KG = [1500, 2000, 2500, 3000, 3500];

export function lengthBandPath(feet: number): string | null {
  if (!(feet > 0)) return null;
  const under = LENGTH_UNDER_FT.find((n) => feet <= n);
  if (under) return `under-${under}-length-in-feet`;
  return feet <= 22 ? "between-20-22-length-in-feet" : "over-22-length-in-feet";
}

export function atmBandPath(kg: number): string | null {
  if (!(kg > 0)) return null;
  const under = ATM_UNDER_KG.find((n) => kg <= n);
  return under ? `under-${under}-kg-atm` : "over-3500-kg-atm";
}
