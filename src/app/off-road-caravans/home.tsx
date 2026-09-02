"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import HomeFeatured from "./HomeFeatured";
import HomeStateSection from "./HomeStateSection";
import HomeLocationSection from "./HomeLocationSection";
import "./main.css?=1";

const OR_FAQ = [
  { q: "What is an off road caravan?", a: "An off road caravan is a caravan built to handle rough, unsealed tracks and remote terrain. They typically feature heavy-duty chassis, independent suspension, reinforced bodywork, larger water and battery capacity, and off-road tyres to handle Australia's outback and bush conditions." },
  { q: "What is the difference between semi off road and full off road caravans?", a: "Semi off road caravans are built for light unsealed roads and easy bush tracks, with upgraded suspension and stronger construction. Full off road caravans are engineered for extreme terrain — think river crossings, rocky tracks and remote touring — with independent suspension, heavy-duty chassis and full off-grid capability." },
  { q: "Can off road caravans go off grid?", a: "Yes. Most off road caravans come with or can be fitted with solar panels, lithium batteries, large fresh water tanks and composting or cassette toilets, allowing extended stays in remote areas without external power or water hookups." },
  { q: "Do I need a special vehicle to tow an off road caravan?", a: "Yes. Off road caravans are heavier and wider than standard caravans. You'll need a high-capacity 4WD with a tow bar rated to the caravan's ATM. Always check the caravan's ATM and the tow vehicle's GVM and tow rating before purchasing." },
  { q: "Are off road caravans suitable for families?", a: "Absolutely. Many off road models come in family-friendly layouts with bunk beds, multiple sleeping berths, full kitchens and ensuites. Brands like Jayco, New Age and Trakmaster offer popular family off road models across a range of budgets." },
  { q: "What is the average price of an off road caravan in Australia?", a: "Off road caravan prices in Australia typically range from around $40,000 for entry-level semi off road models to over $150,000 for premium full off road expedition caravans. The most popular mid-range models sit between $60,000 and $100,000." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`or-faq__item${open ? " or-faq__item--open" : ""}`}>
      <button className="or-faq__q" onClick={() => setOpen(!open)}>
        <h3 className="or-faq__q-text">{q}</h3>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"} or-faq__icon`} />
      </button>
      {open && <div className="or-faq__a">{a}</div>}
    </div>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

interface OffRoadBlog {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image: string;
  slug: string;
  date: string;
}

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
  stateBands: Item[];
  requirements: any;
  homeblog: any[];
  offRoadBlogs: OffRoadBlog[];
  offRoadPopularBlogs: OffRoadBlog[];
  offRoadBrandBlogs: OffRoadBlog[];
  offRoadModelBlogs: OffRoadBlog[];
  offRoadCount: number;
  offRoadNewCount: number;
  offRoadUsedCount: number;
  offRoadPriceMin: number;
  offRoadPriceMax: number;
  offRoadUsedPriceMin: number;
  offRoadUsedPriceMax: number;
  offRoadUsedPriceMedian: number;
  offRoadNewPriceMedian: number;
  offRoadBrandCounts: Record<string, number>;
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

export default function OffRoadCaravansPage({ stateBands, offRoadBlogs, offRoadPopularBlogs, offRoadBrandBlogs, offRoadModelBlogs, offRoadCount, offRoadNewCount, offRoadUsedCount, offRoadPriceMin, offRoadPriceMax, offRoadUsedPriceMin, offRoadUsedPriceMax, offRoadUsedPriceMedian, offRoadNewPriceMedian, offRoadBrandCounts }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: number) => {
    carouselRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };
  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ── Hero Banner ── */}
      <section className="hd-banner">
        <div className="container">
          <h1 className="hd-banner__title">
            Off Road Caravans <span className="hd-banner__title--orange">Australia</span>
          </h1>
          <div className="hd-banner__divider">
            <span className="hd-banner__divider-line" />
            <img src="/images/aus_outline.svg" alt="" className="hd-banner__divider-icon" />
            <span className="hd-banner__divider-line" />
          </div>
          <p className="hd-banner__subtitle">
            Compare off road caravans from dealers and private sellers across Australia. Browse full off-road, semi-off-road and hybrid caravans, compare current prices and specifications, research leading manufacturers and models, and use our buying guides to find the right caravan for remote touring, family travel or off-grid adventures.
          </p>
          <div className="hd-banner__trust">
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/category.svg" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>{offRoadCount > 0 ? `${offRoadCount.toLocaleString()}+` : "3,219+"}</strong>
                <span>Off Road Caravans Live Listings</span>
              </div>
            </div>
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/australia.png" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>Australia Wide</strong>
                <span>From dealers &amp; private sellers nationwide</span>
              </div>
            </div>
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/seller.svg" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>New &amp; Used</strong>
                <span>All makes, models and layouts</span>
              </div>
            </div>
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/dollar.png" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>Daily Updated</strong>
                <span>Live pricing &amp; market data updated daily</span>
              </div>
            </div>
          </div>
          <a href="/listings/off-road-category/" className="hd-banner__cta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Off Road Caravan Listings
          </a>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <HomeFeatured />

      {/* ── Browse by State ── */}
      <HomeStateSection stateBands={stateBands} title="Browse Off Road Caravans by State" />

      {/* ── Location + Search Your Way ── */}
      <HomeLocationSection />

      {/* ── Types + Snapshot + Brands + Choose ── */}
      <section className="or-redesign-section">
        <div className="container">

          {/* Row 1: Types Explained + Market Snapshot */}
          <div className="or-redesign-grid">

            {/* Types Explained */}
            <div className="or-panel">
              
              <h2 className="or-panel__title text-center">Off Road Caravan Types Explained</h2>
              <p className="or-panel__sub text-center">Not sure which off road caravan is right for you? Here&apos;s a quick guide.</p>
              <div className="or-types-grid">
                {[
                  { label: "Semi Off Road",    img: "Full-Off-Road.png",    desc: "Built for gravel roads and light corrugations. Ideal for touring and occasional dirt tracks." },
                  { label: "Full Off Road",    img: "Full-Off-Road.png",    desc: "Built for rough roads and remote travel. Stronger suspension and chassis." },
                  { label: "Extreme Off Road", img: "Full-Off-Road.png", desc: "Designed for the toughest terrain and remote expeditions. Maximum durability." },
                  { label: "Hybrid Off Road",  img: "Full-Off-Road.png",  desc: "Lightweight and low profile with off road capability. Great for couples & small families." },
                ].map(t => (
                  <div key={t.label} className="or-type-card">
                    <div className="or-type-card__img-wrap">
                      <img src={`/images/${t.img}`} alt={t.label} className="or-type-card__img" />
                    </div>
                    <h3 className="or-type-card__label">{t.label}</h3>
                    <div className="or-type-card__underline" />
                    <p className="or-type-card__desc">{t.desc}</p>
                  </div>
                ))}
              </div>
              <div className="or-compare-btn-wrap">
                <a href="/off-road-caravan-types/" className="or-compare-btn">
                  Compare Off Road Caravan Types
                </a>
              </div>
            </div>

            {/* Market Snapshot */}
            <div className="or-panel">
              <h2 className="or-panel__title text-center">Off Road Caravan Market Snapshot</h2>
              <p className="or-panel__sub text-center">Live data from our marketplace – updated daily</p>
              <div className="or-stats-grid">
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/caravan_black.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">{offRoadCount > 0 ? `${offRoadCount.toLocaleString()}+` : "3,219+"}</span>
                  <span className="or-stat-card__label">Total Off Road Caravans</span>
                </div>
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/caravan_black.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">{offRoadUsedCount > 0 ? `${offRoadUsedCount.toLocaleString()}+` : "598+"}</span>
                  <span className="or-stat-card__label">Used Off Road Caravans</span>
                </div>
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/caravan_black.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">{offRoadNewCount > 0 ? `${offRoadNewCount.toLocaleString()}+` : "2,580+"}</span>
                  <span className="or-stat-card__label">New Off Road Caravans</span>
                </div>
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/good.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">{offRoadPriceMin && offRoadPriceMax ? `$${offRoadPriceMin.toLocaleString()} – $${offRoadPriceMax.toLocaleString()}` : "$18,990 – $278,000"}</span>
                  <span className="or-stat-card__label">Advertised Price Range</span>
                </div>
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/dollar_au.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">{offRoadUsedPriceMedian > 0 ? `$${offRoadUsedPriceMedian.toLocaleString()}` : "$67,990"}</span>
                  <span className="or-stat-card__label">Median Price (Used)</span>
                </div>
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/dollar_au.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">{offRoadNewPriceMedian > 0 ? `$${offRoadNewPriceMedian.toLocaleString()}` : "$94,890"}</span>
                  <span className="or-stat-card__label">Median Price (New)</span>
                </div>
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/ruler.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">18ft</span>
                  <span className="or-stat-card__label">Most Common Length</span>
                </div>
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/weight.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">2,500kg</span>
                  <span className="or-stat-card__label">Most Common ATM</span>
                </div>
                <div className="or-stat-card">
                  <div className="or-stat-card__icon-wrap"><img src="/images/double.png" alt="" className="or-stat-card__img-icon" /></div>
                  <span className="or-stat-card__val">4 Berth</span>
                  <span className="or-stat-card__label">Most Common Sleeps</span>
                </div>
              </div>
              <div className="or-compare-btn-wrap">
                <a href="/off-road-caravan-market-report/" className="or-compare-btn">
                  View Full Market Report →
                </a>
              </div>
            </div>
          </div>

          {/* Row 2: Popular Brands + How to Choose */}
          <div className="or-redesign-grid">

            {/* Popular Brands */}
            <div className="or-panel">
              
              <h2 className="or-panel__title">Popular Off Road Caravan Brands</h2>
              <p className="or-panel__sub">Browse listings and reviews for Australia&apos;s leading brands.</p>
              <div className="or-brands-grid">
                {[
                  { name: "Jayco",       logo: "Jayco.png",       makeKey: "jayco",       fallback: "146+", listHref: "/listings/jayco/off-road-category/",               reviewHref: "/jayco-journey-outback-review/" },
                  { name: "Lotus",       logo: "lotus.svg",       makeKey: "lotus",       fallback: "68+",  listHref: "/listings/lotus/off-road-category/",       reviewHref: "/lotus-caravans-freelander-indepth-review/" },
                  { name: "Retreat",     logo: "Retreat.webp",    makeKey: "retreat",     fallback: "48+",  listHref: "/listings/retreat/off-road-category/",     reviewHref: "/retreat-caravans-erv-comprehensive-analysis/" },
                  { name: "Masterpiece", logo: "masterpiece.png", makeKey: "masterpiece", fallback: "40+",  listHref: "/listings/masterpiece/off-road-category/", reviewHref: "/masterpiece-caravans-optimum-in-depth-review/" },
                  { name: "JB Caravans", logo: "JB-caravans.png", makeKey: "jb",          fallback: "121+", listHref: "/listings/jb/off-road-category/",          reviewHref: "/jb-caravans-dirt-roader-analysis/" },
                ].map(b => (
                  <div key={b.name} className="or-brand-card">
                    <div className="or-brand-card__logo-wrap">
                      <img src={`/images/${b.logo}`} alt={b.name} className="or-brand-card__logo-img" />
                    </div>
                    <span className="or-brand-card__count">{offRoadBrandCounts[b.makeKey] ? `${offRoadBrandCounts[b.makeKey]}+` : b.fallback}</span>
                    <span className="or-brand-card__listings-label">Listings</span>
                    <a href={b.listHref} className="or-brand-card__view-btn">View Listings </a>
                    <a href={b.reviewHref} className="or-brand-card__link">Read Reviews </a>
                  </div>
                ))}
              </div>
              {/* <div style={{ textAlign: "center", marginTop: "24px" }}>
                <a href="/listings/?category=off-road" className="or-view-brands-btn">View All Brands →</a>
              </div> */}
            </div>

            {/* How to Choose */}
            <div className="or-panel">
              
              <h2 className="or-panel__title">How to Choose an Off Road Caravan</h2>
              <p className="or-panel__sub">Key factors to consider before you buy.</p>
              <div className="or-choose-grid">
                {[
                  { icon: "",                      img: "off_road_icon1.png", label: "Chassis & Construction" },
                  { icon: "bi-sun",        img: "off_road_icon2.png",                                   label: "Solar Capacity" },
                  { icon: "bi-activity",      img: "off_road_icon3.png",                                      label: "Suspension & Clearance" },
                  { icon: "bi-disc",          img: "off_road_icon4.png",                                          label: "Tyres & Wheels" },
                  { icon: "bi-speedometer",   img: "off_road_icon5.png",                                   label: "ATM, Tare & Payload" },
                  { icon: "bi-wind",          img: "off_road_icon6.png",                                          label: "Dust Sealing" },
                  { icon: "bi-truck",         img: "off_road_icon7.png",                                         label: "Tow Vehicle Compatibility" },
                  { icon: "bi-link-45deg",    img: "off_road_icon8.png",                                         label: "Off Road Coupling" },
                  { icon: "bi-droplet",       img: "off_road_icon9.png",                                         label: "Water Storage" },
                  { icon: "bi-shield",        img: "off_road_icon10.png",                                        label: "Underbody Protection" },
                  { icon: "bi-battery-charging", img: "off_road_icon11.png",                                     label: "Battery & Power" },
                  { icon: "bi-layout-text-window", img: "off_road_icon12.png",                                   label: "Layout & Comfort" },
                ].map(f => (
                  <div key={f.label} className="or-choose-item">
                    <span className="or-choose-item__icon-wrap">
                      {f.img
                        ? <img src={`/images/${f.img}`} alt="" className="or-choose-item__img-icon" />
                        : <i className={`bi ${f.icon} or-choose-item__icon`} />}
                    </span>
                    <h4>{f.label}</h4>
                  </div>
                ))}
              </div>
              {/* <a href="/off-road-caravans-buying-guide/" className="or-panel__link">View Detailed Buying Guide →</a> */}
            </div>
          </div>

        </div>
      </section>

      {/* ── Popular Buying Guides ── */}
      {offRoadPopularBlogs.length > 0 && (
        <section className="or-pop-guides">
          <div className="container">
            <h2 className="or-section-title">Popular Buying Guides</h2>
            <div className="or-pop-guides__grid">
              {offRoadPopularBlogs.slice(0, 10).map((b) => (
                <a key={b.id} href={`/${b.slug}/`} className="or-pop-guides__card">
                  <div className="or-pop-guides__img-wrap">
                    <img src={b.image || "/images/download.svg"} alt={b.title} className="or-pop-guides__img" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/download.svg"; }} />
                  </div>
                  <div className="or-pop-guides__body">
                    <h3 className="or-pop-guides__title">{b.title}</h3>
                    {b.excerpt && <p className="or-pop-guides__desc">{stripHtml(b.excerpt)}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brand Reviews + Model Reviews ── */}
      {(offRoadBrandBlogs.length > 0 || offRoadModelBlogs.length > 0) && (
        <section className="or-reviews-section">
          <div className="container">
            <div className="or-reviews-cols">
              <div className="or-reviews-col">
                <h2 className="or-section-title">Brand Reviews</h2>
                {offRoadBrandBlogs.slice(0, 4).map((b) => (
                  <a key={b.id} href={`/${b.slug}/`} className="or-reviews-item">
                    <img src={b.image || "/images/download.svg"} alt={b.title} className="or-reviews-thumb" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/download.svg"; }} />
                    <div className="or-reviews-item__body">
                      <h3 className="or-reviews-item__title">{b.title}</h3>
                    </div>
                  </a>
                ))}
              </div>
              <div className="or-reviews-col">
                <h2 className="or-section-title">Model Reviews</h2>
                {offRoadModelBlogs.slice(0, 4).map((b) => (
                  <a key={b.id} href={`/${b.slug}/`} className="or-reviews-item">
                    <img src={b.image || "/images/download.svg"} alt={b.title} className="or-reviews-thumb" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/download.svg"; }} />
                    <div className="or-reviews-item__body">
                      <h3 className="or-reviews-item__title">{b.title}</h3>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Off Road Caravan Articles ── */}
      {offRoadBlogs.length > 0 && (
        <section className="or-latest-section">
          <div className="container">
            <h2 className="or-section-title">Latest Off Road Caravan Articles</h2>
            <div className="or-latest-wrap">
              <button className="or-latest-arrow or-latest-arrow--prev" onClick={() => scrollCarousel(-1)} aria-label="Previous"><i className="bi bi-chevron-left" /></button>
              <div className="or-latest-carousel" ref={carouselRef}>
                {offRoadBlogs.map((b) => (
                  <a key={b.id} href={`/${b.slug}/`} className="or-latest-card">
                    <div className="or-latest-img-wrap">
                      <img src={b.image || "/images/download.svg"} alt={b.title} className="or-latest-img" loading="lazy" />
                    </div>
                    <div className="or-latest-body">
                      <h3 className="or-latest-title">{b.title}</h3>
                      {b.excerpt && <p className="or-latest-desc">{stripHtml(b.excerpt)}</p>}
                    </div>
                  </a>
                ))}
              </div>
              <button className="or-latest-arrow or-latest-arrow--next" onClick={() => scrollCarousel(1)} aria-label="Next"><i className="bi bi-chevron-right" /></button>
            </div>
          </div>
        </section>
      )}

      {/* ── Sell CTA ── */}
      <section className="or-cta-banner">
        <div className="container">
          <div className="or-cta-inner or-cta-inner--sell">
            <div className="or-cta-sell-left">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f47920" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              <div>
                <h2 className="or-cta-sell-title">Looking to Sell Your Off Road Caravan?</h2>
                <span className="or-cta-sell-sub">Reach thousands of serious buyers across Australia.</span>
              </div>
            </div>
            <a href="/sell-my-caravan/" className="or-btn or-btn--outline">Sell My Caravan</a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="or-faq-section">
        <div className="container">
          <h2 className="or-section-title">Frequently Asked Questions</h2>
          <div className="or-faq-grid">
            <div className="or-faq-col">
              {OR_FAQ.slice(0, 3).map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </div>
            <div className="or-faq-col">
              {OR_FAQ.slice(3).map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
