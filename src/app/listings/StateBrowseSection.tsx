"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  toStateSlug,
  stateLabel,
  cleanRegionName,
  STATES,
  TYPES_NO_STATE,
  FILTERS_NO_STATE,
  PRICE_BANDS,
  ATM_BANDS,
  LENGTH_BANDS,
  SLEEP_BANDS,
  categoryLabel,
  buildStatesForCategory,
  buildPopularRegionsForCategory,
  buildAllRegionsForState,
  buildTypesForState,
  buildFiltersForState,
  type CountItem,
  type BrowseSectionData,
} from "./browseSectionShared";

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
  /** Server-fetched counts (SSR/ISR) for the current filters — when present,
   * seeds the pills/links straight into the first render (so they land in
   * page source for crawlers) and skips the redundant client-side refetch. */
  initialData?: BrowseSectionData;
}

export default function StateBrowseSection({ state, region, category, initialData }: Props) {
  const hasState    = !!state;
  const hasRegion   = !!region;
  const hasCategory = !!category;

  const categoryOnly            = !hasState && hasCategory;
  const stateRegionMode         = hasState && hasRegion && !hasCategory;
  const categoryStateMode       = hasState && hasCategory && !hasRegion;
  const categoryStateRegionMode = hasState && hasCategory && hasRegion;

  // Every dynamic mode below shares this same count state — only one mode is
  // ever active for a given render, so there's no cross-talk between fetches.
  // Seeded from server-fetched initialData when available (SSR), so the
  // first render already has real data instead of null/skeleton.
  const [makeCounts,     setMakeCounts]     = useState<CountItem[] | null>(initialData?.makeCounts ?? null);
  const [stateCounts,    setStateCounts]    = useState<CountItem[] | null>(initialData?.stateCounts ?? null);
  const [regionCounts,   setRegionCounts]   = useState<CountItem[] | null>(initialData?.regionCounts ?? null);
  const [categoryCounts, setCategoryCounts] = useState<CountItem[] | null>(initialData?.categoryCounts ?? null);
  const [priceCounts,    setPriceCounts]    = useState<number[] | null>(initialData?.priceCounts ?? null);
  const [atmCounts,      setAtmCounts]      = useState<number[] | null>(initialData?.atmCounts ?? null);
  const [lengthCounts,   setLengthCounts]   = useState<number[] | null>(initialData?.lengthCounts ?? null);
  const [sleepCounts,    setSleepCounts]    = useState<number[] | null>(initialData?.sleepCounts ?? null);

  // initialData only covers the filters the server rendered this page with —
  // filter changes happen via client-side pushState (see home.tsx), not a
  // fresh server request, so once state/region/category drift from this
  // captured snapshot the effects below must fall back to fetching live.
  const initialFiltersRef = useRef({ state, region, category });
  const isInitialFilters =
    state === initialFiltersRef.current.state &&
    region === initialFiltersRef.current.region &&
    category === initialFiltersRef.current.category;

  // Category only — Popular Make/State/Region + Price.
  useEffect(() => {
    if (!categoryOnly || (initialData && isInitialFilters)) return;
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
    if (!stateRegionMode || (initialData && isInitialFilters)) return;
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
    if (!categoryStateMode || (initialData && isInitialFilters)) return;
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
    if (!categoryStateRegionMode || (initialData && isInitialFilters)) return;
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