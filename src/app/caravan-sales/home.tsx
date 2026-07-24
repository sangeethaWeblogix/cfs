"use client";

import dynamic from "next/dynamic";
import HomeFeatured from "./HomeFeatured";
import HomeTypeSection from "./HomeTypeSection";
import HomeStateSection from "./HomeStateSection";
import HomeLocationSection from "./HomeLocationSection";
import HomeBuyerGuide from "./HomeBuyerGuide";
import "./main.css";

const BlogSection = dynamic(() => import("../blogSection"), { ssr: false });


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

export default function OffRoadCaravansPage({ stateBands }: Props) {
  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ── Hero Banner ── */}
      <section className="cs-banner">
        <div className="cs-banner__inner">
          <div className="cs-banner__img">
            <img src="/images/caravn-sales-banner.jpg" alt="Caravan Sales Australia" />
          </div>
          <div className="cs-banner__content">
            <h1 className="cs-banner__title">
              <span className="cs-banner__title-orange">Caravan Sales</span>
              <span className="cs-banner__title-dark">Australia</span>
            </h1>
            <p className="cs-banner__desc">
              Find the best caravan sales across Australia and connect with trusted dealers and private sellers. Browse thousands of new and used listings—including off-road, family, touring, luxury, and pop-top caravans—and easily filter by location, price, size and towing weight to find the perfect van for your next adventure.
            </p>
            <div className="cs-banner__btns">
              <a href="/listings/" className="cs-banner__btn cs-banner__btn--primary">Browse All Caravans for Sale</a>
              <a href="/sell-my-caravan/" className="cs-banner__btn cs-banner__btn--outline">Sell Your Caravan</a>
            </div>
          </div>
        </div>
        <div className="cs-banner__stats">
          <div className="cs-banner__stat">
            <img src="/images/category.svg" alt="" className="cs-banner__stat-icon" />
            <div className="cs-banner__stat-text">
              <strong>7,000+</strong>
              <span>Active Caravan Sales<br></br>Australia Wide</span>
            </div>
          </div>
          <div className="cs-banner__stat">
            <img src="/images/australia.png" alt="" className="cs-banner__stat-icon" />
            <div className="cs-banner__stat-text">
              <strong>All States & Territories</strong>
              <span>Browse Listings<br></br>Across Australia</span>
            </div>
          </div>
          <div className="cs-banner__stat">
            <img src="/images/seller.svg" alt="" className="cs-banner__stat-icon" />
            <div className="cs-banner__stat-text">
              <strong>Dealers & Private Sellers</strong>
              <span>Compare New &<br></br>Used Caravans</span>
            </div>
          </div>
          <div className="cs-banner__stat">
            <img src="/images/dollar.png" alt="" className="cs-banner__stat-icon" />
            <div className="cs-banner__stat-text">
              <strong>Safe & Secure</strong>
              <span>Buy with<br></br> Confidence</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Listings ── */}
      <HomeFeatured />

      {/* ── Sell CTA Banner ── */}
      <section className="caravans_by_state related-products services">
        <div className="container">
          <div className="sell-banner">
            <div className="sell-content">
              <h3>Caravan Sales Made Hassle-Free & Straightforward</h3>
              <p className="desc">List your van on Australia’s leading caravan sales marketplace and easily connect with thousands of serious buyers</p>
              <div className="btns_two">
                <a href="/dealer-advertising/" className="btn primary-btn">Dealer Sign Up</a>
                <a href="/sell-my-caravan/" className="btn secondary-btn">Private Seller - Click Here</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Browse by State ── */}
      <HomeStateSection stateBands={stateBands} title="Browse Caravans Listings in Australia by State" />

      {/* ── Location + Search Your Way ── */}
      <HomeLocationSection />

      {/* ── Browse by Type ── */}
      <HomeTypeSection />

      {/* ── Buyer Guide + Why Australians ── */}
      <HomeBuyerGuide />

      {/* ── Latest Blogs ── */}
      <BlogSection />


    </div>
  );
}
