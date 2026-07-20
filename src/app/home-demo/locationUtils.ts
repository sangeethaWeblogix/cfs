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

/** home_featured always returns location: "" — derive a label from state
 *  (e.g. "victoria" → "VIC") instead, same as the rest of the site. */
export function getLocationLabel(item: { location?: string; state?: string }): string {
  if (item.location) return item.location;
  const stateName = item.state?.replace(/-/g, " ") ?? "";
  if (!stateName) return "";
  return AUS_ABBR[stateName.toUpperCase()] ?? toTitleCase(stateName);
}
