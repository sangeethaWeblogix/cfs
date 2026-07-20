"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getRegionsByState } from "../sell-my-caravan-region/regions-data";

function toStateSlug(state: string): string {
  return state.trim().toLowerCase().replace(/ /g, "-");
}

function stateLabel(state: string): string {
  return state
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// API group_by=region responses come back as raw hyphenated slugs with only
// the first letter capitalized (e.g. "Latrobe-gippsland") — clean that up
// for display.
function cleanRegionName(name: string): string {
  return name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATES = [
  { name: "Victoria",            href: "/listings/victoria-state/" },
  { name: "New South Wales",     href: "/listings/new-south-wales-state/" },
  { name: "Queensland",          href: "/listings/queensland-state/" },
  { name: "South Australia",     href: "/listings/south-australia-state/" },
  { name: "Western Australia",   href: "/listings/western-australia-state/" },
  { name: "Tasmania",            href: "/listings/tasmania-state/" },
];

const TYPES_NO_STATE = [
  { label: "Off Road Caravans", href: "/listings/off-road-category/" },
  { label: "Luxury Caravans",   href: "/listings/luxury-category/" },
  { label: "Hybrid Caravans",   href: "/listings/hybrid-category/" },
  { label: "Pop Top Caravans",  href: "/listings/pop-top-category/" },
  { label: "Touring Caravans",  href: "/listings/touring-category/" },
  { label: "Family Caravans",   href: "/listings/family-category/" },
];

const FILTERS_NO_STATE = [
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
const POPULAR_REGION_PATHS = [
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
const PRICE_BANDS = [
  { text: "Under $30,000",      href: "/listings/under-30000/",          query: "to_price=30000" },
  { text: "$30,000 – $40,000",  href: "/listings/between-30000-40000/",  query: "from_price=30000&to_price=40000" },
  { text: "$40,000 – $50,000",  href: "/listings/between-40000-50000/",  query: "from_price=40000&to_price=50000" },
  { text: "$50,000 – $70,000",  href: "/listings/between-50000-70000/",  query: "from_price=50000&to_price=70000" },
  { text: "$70,000 – $80,000",  href: "/listings/between-70000-80000/",  query: "from_price=70000&to_price=80000" },
  { text: "$80,000 – $100,000", href: "/listings/between-80000-100000/", query: "from_price=80000&to_price=100000" },
  { text: "Over $100,000",      href: "/listings/over-100000/",          query: "from_price=100000" },
];

const ATM_BANDS = [
  { text: "Under 1500kg", href: "/listings/under-1500-kg-atm/", query: "to_atm=1500" },
  { text: "Under 2000kg", href: "/listings/under-2000-kg-atm/", query: "to_atm=2000" },
  { text: "Under 2500kg", href: "/listings/under-2500-kg-atm/", query: "to_atm=2500" },
  { text: "Under 3000kg", href: "/listings/under-3000-kg-atm/", query: "to_atm=3000" },
  { text: "Over 3000kg",  href: "/listings/over-3000-kg-atm/",  query: "from_atm=3000" },
];

const LENGTH_BANDS = [
  { text: "Under 16ft",  href: "/listings/under-16-length-in-feet/",           query: "to_length=16" },
  { text: "16ft – 18ft", href: "/listings/between-16-18-length-in-feet/",      query: "from_length=16&to_length=18" },
  { text: "18ft – 20ft", href: "/listings/between-18-20-length-in-feet/",      query: "from_length=18&to_length=20" },
  { text: "20ft – 22ft", href: "/listings/between-20-22-length-in-feet/",      query: "from_length=20&to_length=22" },
  { text: "Over 22ft",   href: "/listings/over-22-length-in-feet/",            query: "from_length=22" },
];

const SLEEP_BANDS = [
  { text: "2 Berth",  href: "/listings/2-people-sleeping-capacity/",      query: "from_sleep=2&to_sleep=2" },
  { text: "3 Berth",  href: "/listings/3-people-sleeping-capacity/",      query: "from_sleep=3&to_sleep=3" },
  { text: "4 Berth",  href: "/listings/4-people-sleeping-capacity/",      query: "from_sleep=4&to_sleep=4" },
  { text: "5 Berth",  href: "/listings/5-people-sleeping-capacity/",      query: "from_sleep=5&to_sleep=5" },
  { text: "6+ Berth", href: "/listings/over-5-people-sleeping-capacity/", query: "from_sleep=6" },
];

const CATEGORY_LABELS: Record<string, string> = {
  "off-road": "Off Road",
  luxury: "Luxury",
  hybrid: "Hybrid",
  "pop-top": "Pop Top",
  touring: "Touring",
  family: "Family",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// State pills stay useful on a category page too — just carry the category
// filter along so picking a state narrows within that category.
function buildStatesForCategory(category: string) {
  return STATES.map((s) => ({
    name: s.name,
    slug: toStateSlug(s.name),
    href: `/listings/${category}-category${s.href.replace("/listings", "")}`,
  }));
}

function buildPopularRegionsForCategory(category: string) {
  return POPULAR_REGION_PATHS.map((r) => ({
    name: r.name,
    slug: r.path.match(/([a-z0-9-]+)-region\/$/)?.[1] ?? "",
    href: `/listings/${category}-category/${r.path}`,
  }));
}

// State is the ONLY active filter — show every real region of that state
// (not just the curated popular subset), since there's nothing else to
// narrow the browsing by.
function buildAllRegionsForState(state: string) {
  const stateSlug = toStateSlug(state);
  return getRegionsByState(stateSlug).map((r) => ({
    name: r.label,
    href: `/listings/${r.state.slug}-state/${r.pageSlug}-region/`,
  }));
}

// Category pills on a state page carry the state along too — category
// segment first, then state, matching buildSlugFromFilters' segment order.
function buildTypesForState(state: string) {
  const stateSlug = toStateSlug(state);
  return TYPES_NO_STATE.map((t) => ({
    label: t.label,
    href: `${t.href}${stateSlug}-state/`,
  }));
}

// Budget/ATM/length/sleep pills on a state page reuse the no-state slugs,
// just prefixed with the state segment (state before these, per
// buildSlugFromFilters' segment order).
function buildFiltersForState(state: string) {
  const stateSlug = toStateSlug(state);
  return FILTERS_NO_STATE.map((f) => ({
    ...f,
    links: f.links.map((l) => ({
      text: l.text,
      href: `/listings/${stateSlug}-state${l.href.replace("/listings", "")}`,
    })),
  }));
}

type CountItem = { name: string; slug: string; count: number };

async function fetchGroupCounts(groupBy: string, scope: Record<string, string>): Promise<CountItem[]> {
  try {
    const qs = new URLSearchParams({ group_by: groupBy, ...scope });
    const res = await fetch(`/api/params-count/?${qs.toString()}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

async function fetchBandCount(scope: Record<string, string>, query: string): Promise<number> {
  try {
    const qs = new URLSearchParams({ per_page: "1", ...scope });
    const res = await fetch(`/api/pool-listings/?${qs.toString()}&${query}`, { cache: "no-store" });
    if (!res.ok) return 0;
    const json = await res.json();
    return json?.data?.pagination?.total_products ?? json?.pagination?.total_products ?? 0;
  } catch {
    return 0;
  }
}

async function fetchAllBandCounts(scope: Record<string, string>) {
  const [price, atm, length, sleep] = await Promise.all([
    Promise.all(PRICE_BANDS.map((b) => fetchBandCount(scope, b.query))),
    Promise.all(ATM_BANDS.map((b) => fetchBandCount(scope, b.query))),
    Promise.all(LENGTH_BANDS.map((b) => fetchBandCount(scope, b.query))),
    Promise.all(SLEEP_BANDS.map((b) => fetchBandCount(scope, b.query))),
  ]);
  return { price, atm, length, sleep };
}

interface Props {
  state?: string;
  region?: string;
  category?: string;
}

export default function StateBrowseSection({ state, region, category }: Props) {
  const hasState    = !!state;
  const hasRegion   = !!region;
  const hasCategory = !!category;

  const categoryOnly            = !hasState && hasCategory;
  const stateRegionMode         = hasState && hasRegion && !hasCategory;
  const categoryStateMode       = hasState && hasCategory && !hasRegion;
  const categoryStateRegionMode = hasState && hasCategory && hasRegion;

  // Every dynamic mode below shares this same count state — only one mode is
  // ever active for a given render, so there's no cross-talk between fetches.
  const [makeCounts,     setMakeCounts]     = useState<CountItem[] | null>(null);
  const [stateCounts,    setStateCounts]    = useState<CountItem[] | null>(null);
  const [regionCounts,   setRegionCounts]   = useState<CountItem[] | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CountItem[] | null>(null);
  const [priceCounts,    setPriceCounts]    = useState<number[] | null>(null);
  const [atmCounts,      setAtmCounts]      = useState<number[] | null>(null);
  const [lengthCounts,   setLengthCounts]   = useState<number[] | null>(null);
  const [sleepCounts,    setSleepCounts]    = useState<number[] | null>(null);

  // Category only — Popular Make/State/Region + Price.
  useEffect(() => {
    if (!categoryOnly) return;
    let cancelled = false;
    const scope = { category: category! };
    fetchGroupCounts("make", scope).then((d) => { if (!cancelled) setMakeCounts(d); });
    fetchGroupCounts("state", scope).then((d) => { if (!cancelled) setStateCounts(d); });
    fetchGroupCounts("region", scope).then((d) => { if (!cancelled) setRegionCounts(d); });
    Promise.all(PRICE_BANDS.map((b) => fetchBandCount(scope, b.query)))
      .then((counts) => { if (!cancelled) setPriceCounts(counts); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOnly, category]);

  // State + region (no category) — Popular Make/Category + Price/ATM/Sleep.
  useEffect(() => {
    if (!stateRegionMode) return;
    let cancelled = false;
    const scope = { state: state!, region: region! };
    fetchGroupCounts("make", scope).then((d) => { if (!cancelled) setMakeCounts(d); });
    fetchGroupCounts("category", scope).then((d) => { if (!cancelled) setCategoryCounts(d); });
    Promise.all(PRICE_BANDS.map((b) => fetchBandCount(scope, b.query)))
      .then((counts) => { if (!cancelled) setPriceCounts(counts); });
    Promise.all(ATM_BANDS.map((b) => fetchBandCount(scope, b.query)))
      .then((counts) => { if (!cancelled) setAtmCounts(counts); });
    Promise.all(SLEEP_BANDS.map((b) => fetchBandCount(scope, b.query)))
      .then((counts) => { if (!cancelled) setSleepCounts(counts); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateRegionMode, state, region]);

  // Category + state (no region) — Region/Make + Price/ATM/Length/Sleep.
  useEffect(() => {
    if (!categoryStateMode) return;
    let cancelled = false;
    const scope = { category: category!, state: state! };
    fetchGroupCounts("region", scope).then((d) => { if (!cancelled) setRegionCounts(d); });
    fetchGroupCounts("make", scope).then((d) => { if (!cancelled) setMakeCounts(d); });
    fetchAllBandCounts(scope).then(({ price, atm, length, sleep }) => {
      if (cancelled) return;
      setPriceCounts(price); setAtmCounts(atm); setLengthCounts(length); setSleepCounts(sleep);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryStateMode, category, state]);

  // Category + state + region (all three) — Make + Price/ATM/Length/Sleep.
  useEffect(() => {
    if (!categoryStateRegionMode) return;
    let cancelled = false;
    const scope = { category: category!, state: state!, region: region! };
    fetchGroupCounts("make", scope).then((d) => { if (!cancelled) setMakeCounts(d); });
    fetchAllBandCounts(scope).then(({ price, atm, length, sleep }) => {
      if (cancelled) return;
      setPriceCounts(price); setAtmCounts(atm); setLengthCounts(length); setSleepCounts(sleep);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryStateRegionMode, category, state, region]);

  // Shared shape for the "By Budget/ATM/Length/Sleep"-style vertical-list
  // filter columns used by every dynamic mode below.
  const bandPanel = (basePath: string, bands: typeof PRICE_BANDS, counts: number[] | null) =>
    bands
      .filter((_, i) => (counts?.[i] ?? 1) > 0)
      .map((b) => ({ text: b.text, href: `${basePath}${b.href.replace("/listings", "")}` }));

  // group_by-based panels (make/state/region/category) only know what to show
  // once their /api/params-count/ response arrives — unlike the band panels
  // above, there's no "show everything" fallback that's safe to filter later.
  // While that fetch is still in flight (count state === null), render
  // shimmer pills instead of nothing so a slow response doesn't look empty.
  const pillSkeleton = (count = 8) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="lsd-skeleton lsd-browse__pill-skeleton"
          style={{ width: 56 + (i % 5) * 16 }}
        />
      ))}
    </>
  );

  const renderFilterCols = (panels: { icon: string; title: string; links: { text: string; href: string }[] }[], rowClass: string) => (
    <div className={`lsd-browse__row2 ${rowClass}`}>
      {panels.map((p) => (
        <div key={p.title} className="lsd-browse__filter-col">
          <div className="lsd-browse__filter-head">
            <Image src={p.icon} alt={p.title} width={20} height={20} unoptimized />
            <span className="lsd-browse__filter-title">{p.title}</span>
          </div>
          <div className="lsd-browse__filter-links">
            {p.links.map((l) => (
              <a key={l.text} href={l.href} className="lsd-browse__filter-link">{l.text}</a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (categoryOnly) {
    const label = categoryLabel(category!);

    // While a count list hasn't loaded yet, show the full static list rather
    // than an empty panel — narrowed down the moment counts arrive.
    const makePanel = (makeCounts ?? [])
      .filter((m) => m.count > 0)
      .map((m) => ({ text: m.name, href: `/listings/${m.slug}/${category}-category/` }));

    const statePanel = buildStatesForCategory(category!)
      .filter((s) => stateCounts === null || (stateCounts.find((sc) => sc.slug === s.slug)?.count ?? 0) > 0)
      .map((s) => ({ text: s.name, href: s.href }));

    const regionPanel = buildPopularRegionsForCategory(category!)
      .filter((r) => regionCounts === null || (regionCounts.find((rc) => rc.slug === r.slug)?.count ?? 0) > 0)
      .map((r) => ({ text: r.name, href: r.href }));

    const pricePanel = bandPanel(`/listings/${category}-category`, PRICE_BANDS, priceCounts);

    return (
      <section className="lsd-browse">
        <div className="container">

          <div className="lsd-browse__row1">
            <div className="lsd-browse__panel">
              <h3 className="lsd-browse__panel-title">{`Browse ${label} Caravans by State`}</h3>
              <div className="lsd-browse__pills">
                {statePanel.map((s) => (
                  <a key={s.text} href={s.href} className="lsd-browse__pill">{s.text}</a>
                ))}
              </div>
            </div>

            <div className="lsd-browse__divider-v" />

            <div className="lsd-browse__panel">
              <h3 className="lsd-browse__panel-title">{`Browse ${label} Caravans by Popular Region`}</h3>
              <div className="lsd-browse__pills">
                {regionPanel.map((r) => (
                  <a key={r.text} href={r.href} className="lsd-browse__pill">{r.text}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="lsd-browse__row2 lsd-browse__row2--half">
            <div className="lsd-browse__filter-col">
              <div className="lsd-browse__filter-head">
                <Image src="/images/category.svg" alt="Popular Make" width={20} height={20} unoptimized />
                <span className="lsd-browse__filter-title">{`Browse ${label} Caravans by Popular Manufacturers`}</span>
              </div>
              <div className={`lsd-browse__pills${makePanel.length > 12 ? " lsd-browse__pills--scroll" : ""}`}>
                {makeCounts === null ? pillSkeleton() : makePanel.map((l) => (
                  <a key={l.text} href={l.href} className="lsd-browse__pill">{l.text}</a>
                ))}
              </div>
            </div>
            <div className="lsd-browse__filter-col">
              <div className="lsd-browse__filter-head">
                <Image src="/images/Budget.png" alt="Price" width={20} height={20} unoptimized />
                <span className="lsd-browse__filter-title">{`Browse ${label} Caravans by Price`}</span>
              </div>
              <div className="lsd-browse__filter-links">
                {pricePanel.map((l) => (
                  <a key={l.text} href={l.href} className="lsd-browse__filter-link">{l.text}</a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>
    );
  }

  if (stateRegionMode) {
    const regionName = stateLabel(region!);
    const stateSlug   = toStateSlug(state!);
    const regionSlug  = toStateSlug(region!);
    const basePath    = `/listings/${stateSlug}-state/${regionSlug}-region`;

    const makePanel = (makeCounts ?? [])
      .filter((m) => m.count > 0)
      .map((m) => ({ text: m.name, href: `/listings/${m.slug}/${stateSlug}-state/${regionSlug}-region/` }));

    const categoryPanel = TYPES_NO_STATE
      .filter((t) => {
        if (categoryCounts === null) return true;
        const slug = t.href.match(/\/listings\/([a-z-]+)-category\//)?.[1] ?? "";
        return (categoryCounts.find((cc) => cc.slug === slug)?.count ?? 0) > 0;
      })
      .map((t) => {
        const slug = t.href.match(/\/listings\/([a-z-]+)-category\//)?.[1] ?? "";
        return { text: t.label, href: `/listings/${slug}-category/${stateSlug}-state/${regionSlug}-region/` };
      });

    const panels = [
      { icon: "/images/Budget.png",   title: `Browse Caravans by Price in ${regionName}`,            links: bandPanel(basePath, PRICE_BANDS, priceCounts) },
      { icon: "/images/ATM.png",      title: `Browse Caravans by Weight (ATM) in ${regionName}`,      links: bandPanel(basePath, ATM_BANDS, atmCounts) },
      { icon: "/images/Sleeping.png", title: `Browse Caravans by Sleeping Capacity in ${regionName}`, links: bandPanel(basePath, SLEEP_BANDS, sleepCounts) },
    ];

    return (
      <section className="lsd-browse">
        <div className="container">

          <div className="lsd-browse__row1">
            <div className="lsd-browse__panel">
              <h3 className="lsd-browse__panel-title">{`Browse Caravans by Popular Manufacturers in ${regionName}`}</h3>
              <div className="lsd-browse__pills">
                {makeCounts === null ? pillSkeleton() : makePanel.map((m) => (
                  <a key={m.text} href={m.href} className="lsd-browse__pill">{m.text}</a>
                ))}
              </div>
            </div>

            <div className="lsd-browse__divider-v" />

            <div className="lsd-browse__panel">
              <h3 className="lsd-browse__panel-title">{`Browse Caravans by Type in ${regionName}`}</h3>
              <div className="lsd-browse__pills">
                {categoryPanel.map((c) => (
                  <a key={c.text} href={c.href} className="lsd-browse__pill">{c.text}</a>
                ))}
              </div>
            </div>
          </div>

          {renderFilterCols(panels, "lsd-browse__row2--three")}

        </div>
      </section>
    );
  }

  if (categoryStateMode) {
    const label = categoryLabel(category!);
    const stateName  = stateLabel(state!);
    const stateSlug  = toStateSlug(state!);
    const basePath   = `/listings/${category}-category/${stateSlug}-state`;

    const regionPanel = (regionCounts ?? [])
      .filter((r) => r.count > 0)
      .map((r) => ({ text: cleanRegionName(r.name), href: `${basePath}/${r.slug}-region/` }));

    const makePanel = (makeCounts ?? [])
      .filter((m) => m.count > 0)
      .map((m) => ({ text: m.name, href: `/listings/${m.slug}/${category}-category/${stateSlug}-state/` }));

    const panels = [
      { icon: "/images/Budget.png",   title: `Browse ${label} Caravans by Price in ${stateName}`,            links: bandPanel(basePath, PRICE_BANDS, priceCounts) },
      { icon: "/images/ATM.png",      title: `Browse ${label} Caravans by Weight (ATM) in ${stateName}`,      links: bandPanel(basePath, ATM_BANDS, atmCounts) },
      { icon: "/images/Length.png",   title: `Browse ${label} Caravans by Size (Length) in ${stateName}`,     links: bandPanel(basePath, LENGTH_BANDS, lengthCounts) },
      { icon: "/images/Sleeping.png", title: `Browse ${label} Caravans by Sleeping Capacity in ${stateName}`, links: bandPanel(basePath, SLEEP_BANDS, sleepCounts) },
    ];

    return (
      <section className="lsd-browse">
        <div className="container">

          <div className="lsd-browse__row1">
            <div className="lsd-browse__panel">
              <h3 className="lsd-browse__panel-title">{`Browse ${label} Caravans by Region in ${stateName}`}</h3>
              <div className="lsd-browse__pills">
                {regionCounts === null ? pillSkeleton() : regionPanel.map((r) => (
                  <a key={r.text} href={r.href} className="lsd-browse__pill">{r.text}</a>
                ))}
              </div>
            </div>

            <div className="lsd-browse__divider-v" />

            <div className="lsd-browse__panel">
              <h3 className="lsd-browse__panel-title">{`Browse ${label} Caravans by Popular Manufacturers in ${stateName}`}</h3>
              <div className={`lsd-browse__pills${makePanel.length > 12 ? " lsd-browse__pills--scroll" : ""}`}>
                {makeCounts === null ? pillSkeleton() : makePanel.map((m) => (
                  <a key={m.text} href={m.href} className="lsd-browse__pill">{m.text}</a>
                ))}
              </div>
            </div>
          </div>

          {renderFilterCols(panels, "")}

        </div>
      </section>
    );
  }

  if (categoryStateRegionMode) {
    const label = categoryLabel(category!);
    const regionName = stateLabel(region!);
    const stateSlug  = toStateSlug(state!);
    const regionSlug = toStateSlug(region!);
    const basePath   = `/listings/${category}-category/${stateSlug}-state/${regionSlug}-region`;

    const makePanel = (makeCounts ?? [])
      .filter((m) => m.count > 0)
      .map((m) => ({ text: m.name, href: `/listings/${m.slug}/${category}-category/${stateSlug}-state/${regionSlug}-region/` }));

    const panels = [
      { icon: "/images/Budget.png",   title: `Browse ${label} Caravans by Price in ${regionName}`,            links: bandPanel(basePath, PRICE_BANDS, priceCounts) },
      { icon: "/images/ATM.png",      title: `Browse ${label} Caravans by Weight (ATM) in ${regionName}`,      links: bandPanel(basePath, ATM_BANDS, atmCounts) },
      { icon: "/images/Length.png",   title: `Browse ${label} Caravans by Size (Length) in ${regionName}`,     links: bandPanel(basePath, LENGTH_BANDS, lengthCounts) },
      { icon: "/images/Sleeping.png", title: `Browse ${label} Caravans by Sleeping Capacity in ${regionName}`, links: bandPanel(basePath, SLEEP_BANDS, sleepCounts) },
    ];

    return (
      <section className="lsd-browse">
        <div className="container">

          <h3 className="lsd-browse__panel-title">{`Browse ${label} Caravans by Popular Manufacturers in ${regionName}`}</h3>
          <div className="lsd-browse__pills" style={{ marginBottom: 20 }}>
            {makeCounts === null ? pillSkeleton() : makePanel.map((m) => (
              <a key={m.text} href={m.href} className="lsd-browse__pill">{m.text}</a>
            ))}
          </div>

          {renderFilterCols(panels, "")}

        </div>
      </section>
    );
  }

  const regions = hasState ? buildAllRegionsForState(state!) : STATES;
  const types   = hasState ? buildTypesForState(state!) : TYPES_NO_STATE;
  const filters = hasState ? buildFiltersForState(state!) : FILTERS_NO_STATE;

  const leftTitle  = hasState ? `Browse Caravans by Region in ${stateLabel(state!)}` : "Browse Caravans by State";
  const rightTitle = hasState ? `Browse Caravans by Type in ${stateLabel(state!)}`   : "Browse Caravans by Type";

  return (
    <section className="lsd-browse">
      <div className="container">

        {/* Row 1 — Region/State + Type */}
        <div className="lsd-browse__row1">
          <div className="lsd-browse__panel">
            <h3 className="lsd-browse__panel-title">{leftTitle}</h3>
            <div className="lsd-browse__pills">
              {regions.map((r) => (
                <a key={r.name} href={r.href} className="lsd-browse__pill">{r.name}</a>
              ))}
            </div>

          </div>

          <div className="lsd-browse__divider-v" />

          <div className="lsd-browse__panel">
            <h3 className="lsd-browse__panel-title">{rightTitle}</h3>
            <div className="lsd-browse__type-grid">
              {types.map((t) => (
                <a key={t.label} href={t.href} className="lsd-browse__type-card">{t.label}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 — 4 Filter columns */}
        <div className="lsd-browse__row2">
          {filters.map((f) => (
            <div key={f.title} className="lsd-browse__filter-col">
              <div className="lsd-browse__filter-head">
                <Image src={f.icon} alt={f.title} width={20} height={20} unoptimized />
                <span className="lsd-browse__filter-title">{f.title}</span>
              </div>
              <div className="lsd-browse__filter-links">
                {f.links.map((l) => (
                  <a key={l.text} href={l.href} className="lsd-browse__filter-link">{l.text}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
