"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import HomeFeatured from "./HomeFeatured";
import HomeStateSection from "./HomeStateSection";
import HomeLocationSection from "./HomeLocationSection";
import "./main.css";

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
        <span>{q}</span>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"} or-faq__icon`} />
      </button>
      {open && <div className="or-faq__a">{a}</div>}
    </div>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

function fixLink(link?: string): string {
  if (!link) return "";
  return link.replace(/^(https?:\/\/)(www\.)+/i, "$1www.");
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

export default function OffRoadCaravansPage({ stateBands, offRoadBlogs, offRoadPopularBlogs, offRoadBrandBlogs, offRoadModelBlogs, offRoadCount, offRoadPriceMin, offRoadPriceMax, offRoadUsedPriceMin, offRoadUsedPriceMax }: Props) {
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
            Discover Australia’s largest collection of off road caravans. Compare full off road, semi off road and hybrid caravans, browse live listings, read expert reviews and explore detailed buying guides to find the right caravan for your next adventure.
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
            Explore Off Road Caravans
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

      {/* ── Popular Buying Guides ── */}
      {offRoadPopularBlogs.length > 0 && (
        <section className="or-pop-guides">
          <div className="container">
            <h2 className="or-section-title">Popular Buying Guides</h2>
            <div className="or-pop-guides__grid">
              {offRoadPopularBlogs.slice(0, 10).map((b) => (
                <a key={b.id} href={fixLink(b.link) || `/${b.slug}/`} className="or-pop-guides__card">
                  <div className="or-pop-guides__img-wrap">
                    <img src={b.image || "/images/placeholder.jpg"} alt={b.title} className="or-pop-guides__img" loading="lazy" />
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
                  <a key={b.id} href={fixLink(b.link) || `/${b.slug}/`} className="or-reviews-item">
                    <img src={b.image || "/images/placeholder.jpg"} alt={b.title} className="or-reviews-thumb" loading="lazy" />
                    <div className="or-reviews-item__body">
                      <span className="or-reviews-item__title">{b.title}</span>
                    </div>
                  </a>
                ))}
              </div>
              <div className="or-reviews-col">
                <h2 className="or-section-title">Model Reviews</h2>
                {offRoadModelBlogs.slice(0, 4).map((b) => (
                  <a key={b.id} href={fixLink(b.link) || `/${b.slug}/`} className="or-reviews-item">
                    <img src={b.image || "/images/placeholder.jpg"} alt={b.title} className="or-reviews-thumb" loading="lazy" />
                    <div className="or-reviews-item__body">
                      <span className="or-reviews-item__title">{b.title}</span>
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
                  <a key={b.id} href={fixLink(b.link) || `/${b.slug}/`} className="or-latest-card">
                    <div className="or-latest-img-wrap">
                      <img src={b.image || "/images/placeholder.jpg"} alt={b.title} className="or-latest-img" loading="lazy" />
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
                <strong className="or-cta-sell-title">Looking to Sell Your Off Road Caravan?</strong>
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
