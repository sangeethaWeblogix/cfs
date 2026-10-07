"use client";

import { useEffect, useState } from "react";

const SELL_DATA = [
  {
    state: "Victoria",
    stateSlug: "victoria",
    regions: [
      { label: "Melbourne", pageSlug: "melbourne" },
      { label: "Geelong", pageSlug: "geelong" },
      { label: "Ballarat", pageSlug: "ballarat" },
      { label: "Latrobe Gippsland", pageSlug: "latrobe-gippsland" },
      { label: "Mornington Peninsula", pageSlug: "mornington-peninsula" },
      { label: "Shepparton", pageSlug: "shepparton" },
      { label: "Hume", pageSlug: "hume" },
      { label: "Bendigo", pageSlug: "bendigo" },
      { label: "North West", pageSlug: "north-west" },
      { label: "Warrnambool And South West", pageSlug: "warrnambool-and-south-west" },
    ],
  },
  {
    state: "New South Wales",
    stateSlug: "new-south-wales",
    regions: [
      { label: "Sydney", pageSlug: "sydney" },
      { label: "Hunter", pageSlug: "hunter" },
      { label: "Newcastle", pageSlug: "newcastle" },
      { label: "Central Coast", pageSlug: "central-coast" },
      { label: "Coffs Harbour", pageSlug: "coffs-harbour" },
      { label: "Southern Highlands", pageSlug: "southern-highlands" },
      { label: "Richmond Tweed", pageSlug: "richmond-tweed" },
      { label: "Central West", pageSlug: "central-west" },
      { label: "Mid North Coast", pageSlug: "mid-north-coast" },
      { label: "Murray", pageSlug: "murray" },
      { label: "New England", pageSlug: "new-england" },
      { label: "Riverina", pageSlug: "riverina" },
      { label: "Capital", pageSlug: "capital" },
      { label: "Orana", pageSlug: "orana" },
      { label: "Illawarra", pageSlug: "illawarra" },
      { label: "Canberra", pageSlug: "canberra" },
    ],
  },
  {
    state: "Queensland",
    stateSlug: "queensland",
    regions: [
      { label: "Brisbane", pageSlug: "brisbane" },
      { label: "Gold Coast", pageSlug: "gold-coast" },
      { label: "Sunshine Coast", pageSlug: "sunshine-coast" },
      { label: "Moreton Bay North", pageSlug: "moreton-bay-north" },
      { label: "Moreton Bay South", pageSlug: "moreton-bay-south" },
      { label: "Logan Beaudesert", pageSlug: "logan-beaudesert" },
      { label: "Ipswich", pageSlug: "ipswich" },
      { label: "Toowoomba", pageSlug: "toowoomba" },
      { label: "Townsville", pageSlug: "townsville" },
      { label: "Cairns", pageSlug: "cairns" },
      { label: "Wide Bay", pageSlug: "wide-bay" },
      { label: "Mackay Isaac Whitsunday", pageSlug: "mackay-isaac-whitsunday" },
    ],
  },
  {
    state: "South Australia",
    stateSlug: "south-australia",
    regions: [
      { label: "Adelaide", pageSlug: "adelaide" },
      { label: "South East", pageSlug: "south-east" },
    ],
  },
  {
    state: "Western Australia",
    stateSlug: "western-australia",
    regions: [
      { label: "Perth", pageSlug: "perth" },
      { label: "Mandurah", pageSlug: "mandurah" },
      { label: "Bunbury", pageSlug: "bunbury" },
      { label: "Outback South", pageSlug: "outback-south" },
    ],
  },
  {
    state: "Tasmania",
    stateSlug: "tasmania",
    regions: [
      { label: "Hobart", pageSlug: "hobart" },
      { label: "Launceston", pageSlug: "launceston" },
      { label: "North West", pageSlug: "north-west" },
    ],
  },
];

/** "Sell My Caravan by Location" accordion bar — a full-width trigger that
 * expands into the state/region grid below it. Lives at the bottom of the
 * new footer, between the marketplace-network cards and the legal bar. */
export default function FooterNav() {
  const [open, setOpen] = useState(false);

  // Direct deep-link (e.g. /#footer-sell-by-location from another page) —
  // open on initial load if the hash is already there.
  useEffect(() => {
    if (window.location.hash === "#footer-sell-by-location") setOpen(true);
  }, []);

  // "Sell by Location" (SellByLocationLink.tsx) dispatches this on every
  // click, including repeat clicks after the panel's been closed — a plain
  // hash link wouldn't fire "hashchange" again once the hash already matches.
  useEffect(() => {
    const openPanel = () => setOpen(true);
    window.addEventListener("open-sell-by-location", openPanel);
    return () => window.removeEventListener("open-sell-by-location", openPanel);
  }, []);

  return (
    <div className="footer-sell-by-location">
      <button
        className="footer-sell-by-location__bar"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sell-links-panel"
      >
        <span className="footer-sell-by-location__text">
          <span className="footer-sell-by-location__title">Sell My Caravan by Location</span>
          <span className="footer-sell-by-location__sub">Browse selling pages by state, city and region</span>
        </span>
        <svg
          className={`sell-chevron${open ? " sell-chevron--open" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {open && (
        <div className="sell-panel" id="sell-links-panel">
          <div className="sell-panel__grid">
            {SELL_DATA.map((s) => (
              <div key={s.stateSlug} className="sell-panel__col">
                <a
                  href={`/sell-my-caravan/${s.stateSlug}/`}
                  className="sell-panel__state-title"
                >
                  Sell My Caravan in {s.state}
                </a>
                <ul className="sell-panel__region-list">
                  {s.regions.map((r) => (
                    <li key={r.pageSlug}>
                      <a href={`/sell-my-caravan/${s.stateSlug}/${r.pageSlug}/`}>
                        Sell My Caravan in {r.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
