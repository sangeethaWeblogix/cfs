"use client";

import dynamic from "next/dynamic";
import HomeFeatured from "./HomeFeatured";
import HomeStateSection from "./HomeStateSection";
import HomeLocationSection from "./HomeLocationSection";
import "./main.css";


interface Item {
  label: string;
  capacity: number;
  slug: string;
  permalink: string;
  caravan_count: string;
  starting_price: number;
  display_text: string;
  state: string;
  short_label: string;
  short_count: string;
  region: string;
}

interface Props {
  sleepBands: Item[];
  regionBands: Item[];
  manufactureBands: Item[];
  atmBands: Item[];
  lengthBands: Item[];
  priceBands: Item[];
  usedData: { by_category: Item[]; by_state: Item[]; by_region: Item[] };
  stateBands: Item[];
  requirements: any;
  homeblog: any[];
  offRoadCount: number;
  offRoadPriceMin: number;
  offRoadPriceMax: number;
  offRoadUsedPriceMin: number;
  offRoadUsedPriceMax: number;
}

const CITY_LINKS = [
  { text: "Adelaide",       href: "/listings/south-australia-state/adelaide-region/?category=off-road" },
  { text: "Brisbane",       href: "/listings/queensland-state/brisbane-region/?category=off-road" },
  { text: "Gold Coast",     href: "/listings/queensland-state/gold-coast-region/?category=off-road" },
  { text: "Melbourne",      href: "/listings/victoria-state/melbourne-region/?category=off-road" },
  { text: "Perth",          href: "/listings/western-australia-state/perth-region/?category=off-road" },
  { text: "Sydney",         href: "/listings/new-south-wales-state/sydney-region/?category=off-road" },
  { text: "Cairns",         href: "/listings/queensland-state/cairns-region/?category=off-road" },
  { text: "Canberra",       href: "/listings/australian-capital-territory-state/?category=off-road" },
  { text: "Darwin",         href: "/listings/northern-territory-state/?category=off-road" },
  { text: "Geelong",        href: "/listings/victoria-state/geelong-region/?category=off-road" },
  { text: "Hobart",         href: "/listings/tasmania-state/hobart-region/?category=off-road" },
  { text: "Newcastle",      href: "/listings/new-south-wales-state/newcastle-region/?category=off-road" },
  { text: "Sunshine Coast", href: "/listings/queensland-state/sunshine-coast-region/?category=off-road" },
  { text: "Townsville",     href: "/listings/queensland-state/townsville-region/?category=off-road" },
  { text: "Wollongong",     href: "/listings/new-south-wales-state/illawarra-region/?category=off-road" },
  { text: "Ballarat",       href: "/listings/victoria-state/ballarat-region/?category=off-road" },
];

const SEARCH_FILTERS = [
  {
    label: "By Budget",
    icon: "$",
    links: [
      { text: "Under $50,000",         href: "/listings/?max_price=50000&category=off-road" },
      { text: "Under $80,000",         href: "/listings/?max_price=80000&category=off-road" },
      { text: "Under $100,000",        href: "/listings/?max_price=100000&category=off-road" },
      { text: "Over $100,000",         href: "/listings/?min_price=100000&category=off-road" },
      { text: "Second Hand Off Road",  href: "/listings/?condition=used&category=off-road" },
      { text: "New Off Road Caravans", href: "/listings/?condition=new&category=off-road" },
    ],
  },
  {
    label: "By Weight (ATM)",
    icon: "⚖",
    links: [
      { text: "Under 1500kg", href: "/listings/?max_atm=1500&category=off-road" },
      { text: "Under 2000kg", href: "/listings/?max_atm=2000&category=off-road" },
      { text: "Under 2500kg", href: "/listings/?max_atm=2500&category=off-road" },
      { text: "Under 3000kg", href: "/listings/?max_atm=3000&category=off-road" },
      { text: "Over 3000kg",  href: "/listings/?min_atm=3000&category=off-road" },
    ],
  },
  {
    label: "By Size (Length)",
    icon: "↔",
    links: [
      { text: "14ft",        href: "/listings/?length=14&category=off-road" },
      { text: "16ft",        href: "/listings/?length=16&category=off-road" },
      { text: "18ft 6",      href: "/listings/?length=18&category=off-road" },
      { text: "19ft",        href: "/listings/?length=19&category=off-road" },
      { text: "Single Axle", href: "/listings/?axle=single&category=off-road" },
    ],
  },
  {
    label: "By Features",
    icon: "✦",
    links: [
      { text: "Pop Top",     href: "/listings/pop-top-caravans/" },
      { text: "Lightweight", href: "/listings/lightweight-caravans/" },
      { text: "Off Grid",    href: "/listings/?feature=off-grid&category=off-road" },
      { text: "With Ensuite",href: "/listings/?feature=ensuite&category=off-road" },
      { text: "Aluminium",   href: "/listings/?feature=aluminium&category=off-road" },
    ],
  },
];

const GUIDES = [
  {
    heading: "Core & Intent-Driven Content Pillars",
    links: [
      { text: "Best off road caravan australia 2026",        desc: "Top models, trends and key features reviewed.",   href: "/blog/" },
      { text: "Best australian made off road caravans",      desc: "The best locally made hybrid caravan picks.",     href: "/australian-made-off-road-caravans-remote-touring/" },
      { text: "Best semi off road caravans australia",       desc: "Top semi off-road caravans for Aussie roads.",    href: "/best-semi-off-road-caravans/" },
      { text: "Best family off road caravans",               desc: "Spacious, practical caravans for family travel.", href: "/blog/" },
      { text: "Best off-road caravan for couples australia", desc: "Comfort, features and easy towing for two.",      href: "/blog/" },
      { text: "19ft off road caravan",                       desc: "Best 19ft off road caravans for all terrains.",   href: "/blog/" },
      { text: "Best single axle off road caravan",           desc: "Top single axle caravans for off-road travel.",   href: "/blog/" },
    ],
  },
  {
    heading: "Style, Weight & Feature Specifics",
    links: [
      { text: "Pop top off road caravans australia",         desc: "Top pop top caravans for off-road adventures.",   href: "/blog/" },
      { text: "Best lightweight off road caravan australia", desc: "Lightweight caravans that go further.",           href: "/blog/" },
      { text: "Best off grid caravan australia",             desc: "Independent caravans for off-grid living.",       href: "/blog/" },
      { text: "Off road caravan with ensuite",               desc: "Caravans with ensuites for extra comfort.",       href: "/blog/" },
      { text: "Off road aluminium caravans",                 desc: "Durable aluminium caravans built tough.",         href: "/blog/" },
      { text: "Best off road caravans under $50,000",        desc: "Top value caravans under fifty grand.",           href: "/blog/" },
      { text: "Best off road caravans under $80,000",        desc: "Good quality caravans under eighty grand.",       href: "/blog/" },
      { text: "Second hand off road caravans",               desc: "Best used caravans and what to check.",           href: "/blog/" },
      { text: "New off road caravans for all budgets",       desc: "New caravans across every budget range.",         href: "/blog/" },
    ],
  },
  {
    heading: "Brand-Specific Reviews & Comparisons",
    links: [
      { text: "Australian off road (aor) reviews",         desc: "In-depth AOR caravan reviews and feedback.",     href: "/blog/" },
      { text: "Lotus off grid caravan",                    desc: "Lotus off grid range reviewed.",                 href: "/blog/" },
      { text: "Kokoda off road caravans",                  desc: "Kokoda models, specs and reviews.",              href: "/blog/" },
      { text: "Urban off road caravans",                   desc: "Urban off road caravans reviewed.",              href: "/blog/" },
      { text: "Gibb 14 hybrid offroad caravan",            desc: "Gibb 14 hybrid features and review.",            href: "/blog/" },
      { text: "Airlie 21 quad hard top off road caravan",  desc: "Airlie 21 quad hard top full review.",           href: "/blog/" },
      { text: "Ceduna 15 MK3 quad hard top hybrid",        desc: "Ceduna 15 MK3 hybrid review.",                  href: "/blog/" },
      { text: "Atlas off road caravans",                   desc: "Atlas off road caravan reviews.",                href: "/blog/" },
      { text: "JB off road caravans",                      desc: "JB caravans compared and reviewed.",             href: "/blog/" },
      { text: "New age off road caravans",                 desc: "New Age off road range review.",                 href: "/blog/" },
      { text: "Nomadic off road caravans",                 desc: "Nomadic caravans and buyer insights.",           href: "/blog/" },
      { text: "Off track rv",                              desc: "Off Track RV caravans reviewed.",                href: "/blog/" },
    ],
  },
  {
    heading: "Location-Based / Dealer Intents",
    links: [
      { text: "Off road caravans melbourne",   desc: "Where to buy in Melbourne.",             href: "/listings/victoria-state/melbourne-region/?category=off-road" },
      { text: "Off road caravans sydney",      desc: "Top dealers and buying tips in Sydney.", href: "/listings/new-south-wales-state/sydney-region/?category=off-road" },
      { text: "Off road caravans brisbane",    desc: "Brisbane dealers and local guide.",      href: "/listings/queensland-state/brisbane-region/?category=off-road" },
      { text: "Off road caravans adelaide",    desc: "Adelaide dealers and buying guide.",     href: "/listings/south-australia-state/adelaide-region/?category=off-road" },
      { text: "Offroad caravan perth",         desc: "Perth dealers and buying guide.",        href: "/listings/western-australia-state/perth-region/?category=off-road" },
      { text: "Off road caravans canberra",    desc: "Canberra dealers and buying guide.",     href: "/listings/australian-capital-territory-state/?category=off-road" },
      { text: "Offroad caravan heatherbrae",   desc: "Heatherbrae dealers and info.",          href: "/blog/" },
      { text: "Offroad caravans rossiea",      desc: "Rossiea dealers and local insights.",    href: "/blog/" },
      { text: "Best offroad caravans mildura", desc: "Mildura and Geelong dealer picks.",      href: "/blog/" },
    ],
  },
];

export default function OffRoadCaravansPage({ stateBands, offRoadCount, offRoadPriceMin, offRoadPriceMax, offRoadUsedPriceMin, offRoadUsedPriceMax }: Props) {
  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ── Hero Banner ── */}
      <section className="hd-banner">
        <div className="container">
          <h1 className="hd-banner__title">
            Off Road Caravans <span className="hd-banner__title--orange">in Australia</span>
          </h1>
          <div className="hd-banner__divider">
            <span className="hd-banner__divider-line" />
            <img src="/images/aus_outline.svg" alt="" className="hd-banner__divider-icon" />
            <span className="hd-banner__divider-line" />
          </div>
          <p className="hd-banner__subtitle">
            Compare brands, browse listings by state, and explore the best off-road caravan guides, reviews and buying advice.
          </p>
          <div className="hd-banner__trust">
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/category.svg" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>Thousands of Listings</strong>
                <span>New &amp; used off road caravans across Australia</span>
              </div>
            </div>
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/australia.png" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>Australia Wide</strong>
                <span>Find off road caravans from every state &amp; territory</span>
              </div>
            </div>
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/seller.svg" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>Dealers &amp; Private Sellers</strong>
                <span>Buy with confidence from trusted sellers</span>
              </div>
            </div>
          </div>
          <a href="/listings/off-road-category/" className="hd-banner__cta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Browse Off Road Caravans
          </a>
          <div className="hd-banner__bottom">
            <div className="hd-banner__bottom-item">
              <img src="/images/icon1.png" alt="" className="hd-banner__bottom-icon" />
              <div><strong>Trusted Marketplace</strong><span>Safe &amp; secure platform</span></div>
            </div>
            <div className="hd-banner__bottom-item">
              <img src="/images/icon2.png" alt="" className="hd-banner__bottom-icon" />
              <div><strong>Great Prices</strong><span>Compare &amp; save</span></div>
            </div>
            <div className="hd-banner__bottom-item">
              <img src="/images/icon3.png" alt="" className="hd-banner__bottom-icon" />
              <div><strong>Buy with Confidence</strong><span>Verified dealers &amp; sellers</span></div>
            </div>
            <div className="hd-banner__bottom-item">
              <img src="/images/icon4.png" alt="" className="hd-banner__bottom-icon" />
              <div><strong>Coast to Country</strong><span>Caravans Australia wide</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <HomeFeatured />

      {/* ── Browse by State ── */}
      <HomeStateSection stateBands={stateBands} title="Browse Off Road Caravans by State" />

      {/* ── Location + Search Your Way ── */}
      <HomeLocationSection />

      {/* ── Market Snapshot ── */}
      <section className="or-snapshot">
        <div className="container">
          <div className="or-snapshot__card">
            <h2 className="or-snapshot__title">Off Road Caravan Market Snapshot</h2>
            <div className="or-snapshot__row">
              <div className="or-snapshot__item">
                <img src="/images/caravan_black.png" alt="" className="or-snapshot__icon" />
                <div className="or-snapshot__value">{offRoadCount.toLocaleString()}</div>
                <div className="or-snapshot__label">Off Road Caravans<br />For Sale Now</div>
              </div>
              <div className="or-snapshot__divider" />
              <div className="or-snapshot__item">
                <img src="/images/dollar_au.png" alt="" className="or-snapshot__icon or-snapshot__icon--sm" />
                <div className="or-snapshot__value">{offRoadPriceMin && offRoadPriceMax ? `$${offRoadPriceMin.toLocaleString()} – $${offRoadPriceMax.toLocaleString()}` : "–"}</div>
                <div className="or-snapshot__label">Off Road Caravan<br />Price Range</div>
              </div>
              <div className="or-snapshot__divider" />
              <div className="or-snapshot__item">
                <img src="/images/good.png" alt="" className="or-snapshot__icon" />
                <div className="or-snapshot__value">{offRoadUsedPriceMin && offRoadUsedPriceMax ? `$${offRoadUsedPriceMin.toLocaleString()} – $${offRoadUsedPriceMax.toLocaleString()}` : "–"}</div>
                <div className="or-snapshot__label">Used Off Road<br />Price Range</div>
              </div>
              <div className="or-snapshot__divider" />
              <div className="or-snapshot__item">
                <img src="/images/ruler.png" alt="" className="or-snapshot__icon" />
                <div className="or-snapshot__value">18 – 22 ft</div>
                <div className="or-snapshot__label">Most Popular<br />Length</div>
              </div>
              <div className="or-snapshot__divider" />
              <div className="or-snapshot__item">
                <img src="/images/double.png" alt="" className="or-snapshot__icon" />
                <div className="or-snapshot__value">2 – 4 People</div>
                <div className="or-snapshot__label">Most Popular<br />Sleeps</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Guides Section ── */}
      <section className="or-guides-section">
        <div className="container">
          <h2 className="or-section-title">Off Road Caravan Guides, Reviews &amp; Buying Advice</h2>
          <p className="or-guides-intro">In-depth guides, reviews and expert advice to help you choose the right off road caravan for your adventures.</p>
          <div className="or-guides-grid">
            {GUIDES.map((col) => (
              <div key={col.heading} className="or-guides-col">
                <h3 className="or-guides-heading">{col.heading}</h3>
                {col.links.map((l) => (
                  <div key={l.text} className="or-guides-item">
                    <a href={l.href} className="or-guides-link">{l.text}</a>
                    <span className="or-guides-desc">{l.desc}</span>
                    <a href={l.href} className="or-guides-read">Read Guide →</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="or-cta-banner">
        <div className="container">
          <div className="or-cta-inner">
            <div className="or-cta-text">
              <span className="or-cta-eyebrow">READY FOR YOUR NEXT ADVENTURE?</span>
              <h2 className="or-cta-title">Find Your Next Off Road Caravan</h2>
              <p className="or-cta-sub">Browse thousands of listings from trusted sellers across Australia.</p>
            </div>
            <a href="/listings/off-road-category/" className="or-btn or-btn--primary">Browse All Listings →</a>
          </div>
        </div>
      </section>


    </div>
  );
}
