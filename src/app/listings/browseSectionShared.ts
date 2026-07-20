import { getRegionsByState } from "../sell-my-caravan-region/regions-data";

export function toStateSlug(state: string): string {
  return state.trim().toLowerCase().replace(/ /g, "-");
}

export function stateLabel(state: string): string {
  return state
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// API group_by=region responses come back as raw hyphenated slugs with only
// the first letter capitalized (e.g. "Latrobe-gippsland") — clean that up
// for display.
export function cleanRegionName(name: string): string {
  return name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const STATES = [
  { name: "Victoria",            href: "/listings/victoria-state/" },
  { name: "New South Wales",     href: "/listings/new-south-wales-state/" },
  { name: "Queensland",          href: "/listings/queensland-state/" },
  { name: "South Australia",     href: "/listings/south-australia-state/" },
  { name: "Western Australia",   href: "/listings/western-australia-state/" },
  { name: "Tasmania",            href: "/listings/tasmania-state/" },
];

export const TYPES_NO_STATE = [
  { label: "Off Road Caravans", href: "/listings/off-road-category/" },
  { label: "Luxury Caravans",   href: "/listings/luxury-category/" },
  { label: "Hybrid Caravans",   href: "/listings/hybrid-category/" },
  { label: "Pop Top Caravans",  href: "/listings/pop-top-category/" },
  { label: "Touring Caravans",  href: "/listings/touring-category/" },
  { label: "Family Caravans",   href: "/listings/family-category/" },
];

export const FILTERS_NO_STATE = [
  {
    icon: "/images/Budget.png", title: "By Budget",
    links: [
      { text: "Under $30,000",      href: "/listings/under-30000/" },
      { text: "$30,000 – $40,000",  href: "/listings/between-30000-40000/" },
      { text: "$40,000 – $50,000",  href: "/listings/between-40000-50000/" },
      { text: "$50,000 – $70,000",  href: "/listings/between-50000-70000/" },
      { text: "$70,000 – $80,000",  href: "/listings/between-70000-80000/" },
      { text: "$80,000 – $100,000", href: "/listings/between-80000-100000/" },
      { text: "Over $100,000",      href: "/listings/over-100000/" },
    ],
  },
  {
    icon: "/images/ATM.png", title: "By Weight (ATM)",
    links: [
      { text: "Under 1500kg", href: "/listings/under-1500-kg-atm/" },
      { text: "Under 2000kg", href: "/listings/under-2000-kg-atm/" },
      { text: "Under 2500kg", href: "/listings/under-2500-kg-atm/" },
      { text: "Under 3000kg", href: "/listings/under-3000-kg-atm/" },
      { text: "Over 3000kg",  href: "/listings/over-3000-kg-atm/" },
    ],
  },
  {
    icon: "/images/Length.png", title: "By Size (Length)",
    links: [
      { text: "Under 16ft",  href: "/listings/under-16-length-in-feet/" },
      { text: "16ft – 18ft", href: "/listings/between-16-18-length-in-feet/" },
      { text: "18ft – 20ft", href: "/listings/between-18-20-length-in-feet/" },
      { text: "20ft – 22ft", href: "/listings/between-20-22-length-in-feet/" },
      { text: "Over 22ft",   href: "/listings/over-22-length-in-feet/" },
    ],
  },
  {
    icon: "/images/Sleeping.png", title: "By Sleeping Capacity",
    links: [
      { text: "2 Berth",  href: "/listings/2-people-sleeping-capacity/" },
      { text: "3 Berth",  href: "/listings/3-people-sleeping-capacity/" },
      { text: "4 Berth",  href: "/listings/4-people-sleeping-capacity/" },
      { text: "5 Berth",  href: "/listings/5-people-sleeping-capacity/" },
      { text: "6+ Berth", href: "/listings/over-5-people-sleeping-capacity/" },
    ],
  },
];

// Same curated city list as HomeLocationSection's popular-location section —
// reused as "Popular Region" pills scoped to a category-only page. Darwin is
// skipped — Northern Territory isn't in this site's state registry
// (STATES/regions-data only cover the 6 states above).
export const POPULAR_REGION_PATHS = [
  { name: "Adelaide",       path: "south-australia-state/adelaide-region/" },
  { name: "Brisbane",       path: "queensland-state/brisbane-region/" },
  { name: "Gold Coast",     path: "queensland-state/gold-coast-region/" },
  { name: "Melbourne",      path: "victoria-state/melbourne-region/" },
  { name: "Perth",          path: "western-australia-state/perth-region/" },
  { name: "Sydney",         path: "new-south-wales-state/sydney-region/" },
  { name: "Cairns",         path: "queensland-state/cairns-region/" },
  { name: "Canberra",       path: "new-south-wales-state/canberra-region/" },
  { name: "Geelong",        path: "victoria-state/geelong-region/" },
  { name: "Hobart",         path: "tasmania-state/hobart-region/" },
  { name: "Newcastle",      path: "new-south-wales-state/newcastle-region/" },
  { name: "Sunshine Coast", path: "queensland-state/sunshine-coast-region/" },
  { name: "Townsville",     path: "queensland-state/townsville-region/" },
  { name: "Wollongong",     path: "new-south-wales-state/illawarra-region/" },
  { name: "Ballarat",       path: "victoria-state/ballarat-region/" },
];

// Price/ATM/length/sleep band definitions doubling as the query params used
// to look up each band's own count (no bucketed group_by exists on the
// backend for numeric fields, so counts come from pool-listings'
// total_products for each band individually).
export const PRICE_BANDS = [
  { text: "Under $30,000",      href: "/listings/under-30000/",          query: "to_price=30000" },
  { text: "$30,000 – $40,000",  href: "/listings/between-30000-40000/",  query: "from_price=30000&to_price=40000" },
  { text: "$40,000 – $50,000",  href: "/listings/between-40000-50000/",  query: "from_price=40000&to_price=50000" },
  { text: "$50,000 – $70,000",  href: "/listings/between-50000-70000/",  query: "from_price=50000&to_price=70000" },
  { text: "$70,000 – $80,000",  href: "/listings/between-70000-80000/",  query: "from_price=70000&to_price=80000" },
  { text: "$80,000 – $100,000", href: "/listings/between-80000-100000/", query: "from_price=80000&to_price=100000" },
  { text: "Over $100,000",      href: "/listings/over-100000/",          query: "from_price=100000" },
];

export const ATM_BANDS = [
  { text: "Under 1500kg", href: "/listings/under-1500-kg-atm/", query: "to_atm=1500" },
  { text: "Under 2000kg", href: "/listings/under-2000-kg-atm/", query: "to_atm=2000" },
  { text: "Under 2500kg", href: "/listings/under-2500-kg-atm/", query: "to_atm=2500" },
  { text: "Under 3000kg", href: "/listings/under-3000-kg-atm/", query: "to_atm=3000" },
  { text: "Over 3000kg",  href: "/listings/over-3000-kg-atm/",  query: "from_atm=3000" },
];

export const LENGTH_BANDS = [
  { text: "Under 16ft",  href: "/listings/under-16-length-in-feet/",           query: "to_length=16" },
  { text: "16ft – 18ft", href: "/listings/between-16-18-length-in-feet/",      query: "from_length=16&to_length=18" },
  { text: "18ft – 20ft", href: "/listings/between-18-20-length-in-feet/",      query: "from_length=18&to_length=20" },
  { text: "20ft – 22ft", href: "/listings/between-20-22-length-in-feet/",      query: "from_length=20&to_length=22" },
  { text: "Over 22ft",   href: "/listings/over-22-length-in-feet/",            query: "from_length=22" },
];

export const SLEEP_BANDS = [
  { text: "2 Berth",  href: "/listings/2-people-sleeping-capacity/",      query: "from_sleep=2&to_sleep=2" },
  { text: "3 Berth",  href: "/listings/3-people-sleeping-capacity/",      query: "from_sleep=3&to_sleep=3" },
  { text: "4 Berth",  href: "/listings/4-people-sleeping-capacity/",      query: "from_sleep=4&to_sleep=4" },
  { text: "5 Berth",  href: "/listings/5-people-sleeping-capacity/",      query: "from_sleep=5&to_sleep=5" },
  { text: "6+ Berth", href: "/listings/over-5-people-sleeping-capacity/", query: "from_sleep=6" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  "off-road": "Off Road",
  luxury: "Luxury",
  hybrid: "Hybrid",
  "pop-top": "Pop Top",
  touring: "Touring",
  family: "Family",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// State pills stay useful on a category page too — just carry the category
// filter along so picking a state narrows within that category.
export function buildStatesForCategory(category: string) {
  return STATES.map((s) => ({
    name: s.name,
    slug: toStateSlug(s.name),
    href: `/listings/${category}-category${s.href.replace("/listings", "")}`,
  }));
}

export function buildPopularRegionsForCategory(category: string) {
  return POPULAR_REGION_PATHS.map((r) => ({
    name: r.name,
    slug: r.path.match(/([a-z0-9-]+)-region\/$/)?.[1] ?? "",
    href: `/listings/${category}-category/${r.path}`,
  }));
}

// State is the ONLY active filter — show every real region of that state
// (not just the curated popular subset), since there's nothing else to
// narrow the browsing by.
export function buildAllRegionsForState(state: string) {
  const stateSlug = toStateSlug(state);
  return getRegionsByState(stateSlug).map((r) => ({
    name: r.label,
    href: `/listings/${r.state.slug}-state/${r.pageSlug}-region/`,
  }));
}

// Category pills on a state page carry the state along too — category
// segment first, then state, matching buildSlugFromFilters' segment order.
export function buildTypesForState(state: string) {
  const stateSlug = toStateSlug(state);
  return TYPES_NO_STATE.map((t) => ({
    label: t.label,
    href: `${t.href}${stateSlug}-state/`,
  }));
}

// Budget/ATM/length/sleep pills on a state page reuse the no-state slugs,
// just prefixed with the state segment (state before these, per
// buildSlugFromFilters' segment order).
export function buildFiltersForState(state: string) {
  const stateSlug = toStateSlug(state);
  return FILTERS_NO_STATE.map((f) => ({
    ...f,
    links: f.links.map((l) => ({
      text: l.text,
      href: `/listings/${stateSlug}-state${l.href.replace("/listings", "")}`,
    })),
  }));
}

export type CountItem = { name: string; slug: string; count: number };

export interface BrowseSectionData {
  makeCounts?: CountItem[] | null;
  stateCounts?: CountItem[] | null;
  regionCounts?: CountItem[] | null;
  categoryCounts?: CountItem[] | null;
  priceCounts?: number[] | null;
  atmCounts?: number[] | null;
  lengthCounts?: number[] | null;
  sleepCounts?: number[] | null;
}
