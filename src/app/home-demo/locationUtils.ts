const AUS_ABBR: Record<string, string> = {
  "VICTORIA": "VIC",
  "NEW SOUTH WALES": "NSW",
  "QUEENSLAND": "QLD",
  "SOUTH AUSTRALIA": "SA",
  "WESTERN AUSTRALIA": "WA",
  "TASMANIA": "TAS",
  "NORTHERN TERRITORY": "NT",
  "AUSTRALIAN CAPITAL TERRITORY": "ACT",
};

const toTitleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Show just the state abbreviation (e.g. "victoria" → "VIC"), matching the
 *  rest of the site, instead of the full "Suburb, Region" string. */
export function getLocationLabel(item: { location?: string; state?: string }): string {
  const stateName = item.state?.replace(/-/g, " ") ?? "";
  if (stateName) return AUS_ABBR[stateName.toUpperCase()] ?? toTitleCase(stateName);
  return item.location ?? "";
}
