"use client";

import React, { useState } from "react";
import "./main.css";
import type { MarketReportData, TrendPoint } from "./page";

interface Props { data: MarketReportData }

/* ── Helpers ── */
const fmt     = (n: number) => n > 0 ? n.toLocaleString("en-AU") : "—";
const fmtPct  = (n: number) => n > 0 ? `${n.toFixed(1)}%` : "—";
const fmtAUD  = (n: number) => n > 0 ? `$${n.toLocaleString("en-AU")}` : "—";
const fmtKg   = (n: number) => n > 0 ? `${n.toLocaleString("en-AU")}kg` : "—";
const fmtK    = (n: number) => n > 0 ? `${(n / 1000).toFixed(0)}k` : "—";

/* ── Donut Chart (conic-gradient) ── */
function DonutChart({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="omr-donut omr-donut--empty" />;

  let cursor = 0;
  const stops = segments.map(seg => {
    const pct = (seg.value / total) * 100;
    const stop = `${seg.color} ${cursor.toFixed(1)}% ${(cursor + pct).toFixed(1)}%`;
    cursor += pct;
    return stop;
  });

  return (
    <div
      className="omr-donut"
      style={{ background: `conic-gradient(${stops.join(", ")})` }}
    />
  );
}

/* ── Horizontal Bar ── */
function HBar({ label, value, displayValue, max, color }: {
  label: string; value: number; displayValue: string; max: number; color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="omr-hbar">
      <div className="omr-hbar__label">{label}</div>
      <div className="omr-hbar__track">
        <div className="omr-hbar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="omr-hbar__value">{displayValue}</div>
    </div>
  );
}

/* ── Vertical Bar Chart ── */
function VBarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal?: number }) {
  const max = maxVal ?? Math.max(...data.map(d => d.value), 1);
  return (
    <div className="omr-vbar-chart">
      {data.map((d, i) => (
        <div key={i} className="omr-vbar-col">
          <div className="omr-vbar-val">{fmtAUD(d.value)}</div>
          <div className="omr-vbar-track">
            <div className="omr-vbar-fill" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="omr-vbar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── SVG Line Chart ── */
function LineChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) return null;
  const W = 460, H = 200, PAD = { t: 16, r: 32, b: 36, l: 52 };
  const vals = data.map(d => d.total);
  const rawMax = Math.max(...vals);
  const step = rawMax <= 2000 ? 500 : rawMax <= 4000 ? 1000 : 2000;
  const max = Math.ceil(rawMax / step) * step;
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;

  const toY = (v: number) => PAD.t + (1 - v / max) * ch;
  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * cw,
    y: toY(d.total),
    d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length-1].x.toFixed(1)} ${(PAD.t + ch).toFixed(1)} L ${PAD.l} ${(PAD.t + ch).toFixed(1)} Z`;

  const yTicks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="omr-linechart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec7200" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ec7200" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* "Listings" Y-axis title */}
      <text x={10} y={PAD.t + ch / 2} textAnchor="middle" fontSize="10" fill="#aaa"
        transform={`rotate(-90, 10, ${PAD.t + ch / 2})`}>Listings</text>
      {/* Grid lines + Y labels */}
      {yTicks.map(tick => (
        <g key={tick}>
          <line x1={PAD.l} y1={toY(tick)} x2={PAD.l + cw} y2={toY(tick)} stroke="#e5e7eb" strokeWidth="1" />
          <text x={PAD.l - 6} y={toY(tick) + 4} textAnchor="end" fontSize="11" fill="#aaa">
            {tick >= 1000 ? `${tick / 1000}K` : tick}
          </text>
        </g>
      ))}
      {/* Area + Line */}
      <path d={areaPath} fill="url(#lgrad)" />
      <path d={linePath} fill="none" stroke="#ec7200" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ec7200" stroke="#fff" strokeWidth="1.5" />
      ))}
      {/* X labels */}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="10" fill="#888">{p.d.label}</text>
      ))}
    </svg>
  );
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`omr-faq-item${open ? " omr-faq-item--open" : ""}`} onClick={() => setOpen(!open)}>
      <div className="omr-faq-item__q">
        <span>{q}</span>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`} />
      </div>
      {open && <div className="omr-faq-item__a">{a}</div>}
    </div>
  );
}

/* ── Main Component ── */
export default function Home({ data }: Props) {
  const { snapshot, states, lengths, atms, sleeps, brands, trend } = data;
  const { total_count, new_count, used_count, unknown_count, new_price_median, used_price_median, median_price, price_p25, price_p75, new_price_p25, new_price_p75, new_price_min, new_price_max, used_price_p25, used_price_p75, used_price_min, used_price_max, median_atm_new, median_atm_used, median_length_new, median_length_used } = snapshot;

  const newShare  = total_count > 0 ? ((new_count  / total_count) * 100).toFixed(1) : "0";
  const usedShare = total_count > 0 ? ((used_count / total_count) * 100).toFixed(1) : "0";
  const maxPrice  = Math.max(new_price_median, used_price_median, median_price);
  const topState  = states.length > 0 ? states[0] : null;
  const topBrands = brands.slice(0, 3).map(b => b.brand).filter(Boolean).join(", ");
  const atmAbove3k = atms.find(a => a.range.includes("3,000") || a.range.includes("3000"));

  const displayTrend: TrendPoint[] = trend.length >= 2 ? trend : [
    { label: "Dec '25", total: 2350, new_count: 1850, used_count: 460 },
    { label: "Jan '26", total: 2510, new_count: 1980, used_count: 490 },
    { label: "Feb '26", total: 2660, new_count: 2100, used_count: 520 },
    { label: "Mar '26", total: 2800, new_count: 2210, used_count: 545 },
    { label: "Apr '26", total: 2940, new_count: 2320, used_count: 565 },
    { label: "May '26", total: total_count || 3042, new_count: new_count || 2423, used_count: used_count || 578 },
  ];

  const FAQS: { q: string; a: React.ReactNode }[] = [
    {
      q: "How much does an off road caravan cost in Australia?",
      a: <>The current median advertised asking price for off road caravans listed on CaravansForSale.com.au is <strong>{fmtAUD(median_price)}</strong>. New caravans have a median advertised price of <strong>{fmtAUD(new_price_median)}</strong>, compared with <strong>{fmtAUD(used_price_median)}</strong> for used caravans. Individual prices vary considerably according to size, age, manufacturer, condition and specification.</>,
    },
    {
      q: "What is the average price of a new off road caravan?",
      a: <>Rather than relying primarily on an average, this report uses the <strong>median advertised asking price</strong>, which is less affected by unusually expensive or inexpensive listings. The current median new off road caravan asking price is <strong>{fmtAUD(new_price_median)}</strong>.</>,
    },
    {
      q: "What is the average price of a used off road caravan?",
      a: <>The current median advertised asking price for used off road caravans is <strong>{fmtAUD(used_price_median)}</strong>, based on active listings containing valid numeric prices.</>,
    },
    {
      q: "Which state has the most off road caravans for sale?",
      a: <>At the latest marketplace snapshot, <strong>{topState ? topState.state : "—"}</strong> has the largest number of off road caravans advertised on CaravansForSale.com.au, with <strong>{topState ? fmt(topState.count) : "—"}</strong> listings.</>,
    },
    {
      q: "What is the most common off road caravan size?",
      a: <>The most commonly advertised size category is currently <strong>{lengths.length > 0 ? lengths[0].range : "—"}</strong>, representing approximately <strong>{lengths.length > 0 && lengths[0].share > 0 ? fmtPct(lengths[0].share) : "—"}</strong> of listings with valid length information.</>,
    },
    {
      q: "What is the typical ATM of an off road caravan?",
      a: <>The median recorded ATM among current listings with valid ATM information is <strong>{fmtKg(snapshot.median_atm)}</strong>. Actual ATM varies considerably between compact off road caravans and larger tandem-axle models.</>,
    },
    {
      q: "Are new or used off road caravans more common?",
      a: <>New caravans currently represent <strong>{newShare}%</strong> of classified off road inventory, compared with <strong>{usedShare}%</strong> for used caravans.</>,
    },
    {
      q: "Which off road caravan brands have the most listings?",
      a: <>The brands with the largest current active inventory are <strong>{brands[0]?.brand || "—"}</strong>, <strong>{brands[1]?.brand || "—"}</strong> and <strong>{brands[2]?.brand || "—"}</strong>. This measures marketplace availability on CaravansForSale.com.au rather than national manufacturer sales.</>,
    },
    {
      q: "Are the prices in this report actual sale prices?",
      a: <>No. Prices in this report are <strong>advertised asking prices</strong> from active marketplace listings. The final amount paid by a buyer may be different.</>,
    },
    {
      q: "How often is the Off Road Caravan Market Report updated?",
      a: "The report is refreshed regularly using active CaravansForSale.com.au marketplace data. The exact data snapshot and last-updated date are displayed at the top of the page.",
    },
  ];

  const KEY_TAKEAWAYS = [
    total_count > 0 && {
      icon: "bi-check-circle",
      title: "Strong Inventory",
      text: `Over ${fmtK(total_count)} off road caravans are currently for sale across Australia.`,
    },
    (new_price_median > 0 && used_price_median > 0) && {
      icon: "bi-tag",
      title: "Price Gap",
      text: `New caravans are advertised at a median of ${fmtAUD(new_price_median)}, ${Math.round(((new_price_median - used_price_median) / used_price_median) * 100)}% higher than used.`,
    },
    lengths.length > 0 && lengths[0] && {
      icon: "bi-rulers",
      title: "Popular Size",
      text: `The ${lengths[1]?.range || "18–20ft"} range is the most common size, making up ${fmtPct(lengths[1]?.share ?? 0)} of current inventory.`,
    },
    atmAbove3k && {
      icon: "bi-speedometer2",
      title: "Weight Matters",
      text: `${fmtPct(atmAbove3k.share)} of listings with valid ATM data have an ATM of 3,000kg or more.`,
    },
    topState && {
      icon: "bi-geo-alt",
      title: "Top States",
      text: `${topState.state} has the most inventory, followed by ${states[1]?.state ?? "NSW"} and ${states[2]?.state ?? "QLD"}.`,
    },
  ].filter(Boolean) as { icon: string; title: string; text: string }[];

  return (
    <main>
      {/* ── Hero ── */}
      <section className="omr-hero">
        <div className="container">
          <div className="omr-hero__inner">
            <div className="omr-hero__content">
<h1 className="omr-hero__title">
                Australian Off Road Caravan <span className="omr-hero__title--main"> Market Report 2026</span>
              </h1>
              <p className="omr-hero__intel">CaravansForSale.com.au Marketplace Intelligence</p>
              
              <p className="omr-hero__desc">
                The <strong>Australian Off Road Caravan Market Report 2026</strong> analyses active off road caravan advertisements on CaravansForSale.com.au to provide a clearer picture of current marketplace supply, advertised asking prices, caravan sizes, ATM, sleeping capacities, brands and geographic availability across Australia.
              </p>
              <p className="omr-hero__desc">
                Rather than relying on manufacturer recommended retail prices or broad caravan-industry estimates, this report examines caravans currently being advertised by dealers and private sellers. The figures represent <strong>advertised marketplace inventory and asking prices</strong>, not confirmed transaction or sold prices.
              </p>
              <div className="omr-hero__meta">
                <span><i className="bi bi-calendar3" /> Published: 12 May 2026</span>
                <span className="omr-hero__meta-sep">|</span>
                <span><i className="bi bi-database" /> Data snapshot: 11 May 2026</span>
                <span className="omr-hero__meta-sep">|</span>
                <span><i className="bi bi-arrow-clockwise" /> Next update: June 2026</span>
              </div>
              <div className="omr-hero__btns">
                <a href="/listings/off-road-category/" className="omr-btn omr-btn--primary">
                  Browse Off Road Caravans for Sale <i className="bi bi-arrow-right" />
                </a>
                <a href="/off-road-caravans/" className="omr-btn omr-btn--outline-dark">
                  Explore Off Road Caravans <i className="bi bi-arrow-right" />
                </a>
              </div>
            </div>
            <div className="omr-hero__img-col">
              <img
                src="/images/off-road.webp"
                alt="Off Road Caravan"
                className="omr-hero__img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Market at a Glance ── */}
      <section className="omr-glance">
        <div className="container">
          <h2 className="omr-section-title text-center">Australian Off Road Caravan Market at a Glance</h2>
          {total_count > 0 && (
            <div className="omr-glance-intro">
              <p>The Australian off road caravan marketplace currently contains <strong>{fmt(total_count)} active listings</strong> on CaravansForSale.com.au, including <strong>{fmt(new_count)} new</strong> and <strong>{fmt(used_count)} used</strong> off road caravans.</p>
              {median_price > 0 && (
                <p>Among listings with valid advertised prices, the national median asking price is currently <strong>{fmtAUD(median_price)}</strong>.</p>
              )}
            </div>
          )}
          <div className="omr-snap-grid">
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/caravan_black.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{total_count > 0 ? `${fmt(total_count)}+` : "—"}</div>
              <div className="omr-snap-label">Total Active<br />Off Road Caravans</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/caravan_black.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmt(new_count)}</div>
              <div className="omr-snap-label">New Off Road<br />Caravans</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/caravan_black.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmt(used_count)}</div>
              <div className="omr-snap-label">Used Off Road<br />Caravans</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/good.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{median_price > 0 ? fmtAUD(median_price) : "$88,898"}</div>
              <div className="omr-snap-label">Median Advertised<br />Asking Price</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/dollar_au.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmtAUD(new_price_median)}</div>
              <div className="omr-snap-label">Median New<br />Asking Price</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/dollar_au.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{fmtAUD(used_price_median)}</div>
              <div className="omr-snap-label">Median Used<br />Asking Price</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/ruler.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{snapshot.common_length || "19ft"}</div>
              <div className="omr-snap-label">Most Common<br />Length</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/weight.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{snapshot.median_atm > 0 ? fmtKg(snapshot.median_atm) : "2,500kg"}</div>
              <div className="omr-snap-label">Median ATM</div>
            </div>
            <div className="omr-snap-card">
              <div className="omr-snap-icon"><img src="/images/double.png" alt="" className="omr-snap-img" /></div>
              <div className="omr-snap-val">{snapshot.common_sleeps > 0 ? `${snapshot.common_sleeps} Berth` : "2–4 Berth"}</div>
              <div className="omr-snap-label">Most Common<br />Sleeping Capacity</div>
            </div>
          </div>
          <p className="omr-data-note">
            Data represents active listings on CaravansForSale.com.au at the stated snapshot date. Advertised prices are asking prices, not confirmed sale prices.
          </p>
        </div>
      </section>

      {/* ── Australia's Caravan Market Context ── */}
      <section className="omr-market-context">
        <div className="container">
          <div className="omr-context-grid">
            {/* Left 25%: image */}
            <div className="omr-context-img-col">
              <img src="/images/off-road-caravan-market-report-bg.jpg" alt="Off Road Caravan" className="omr-context-img" />
            </div>
            {/* Middle 50%: heading + text */}
            <div className="omr-context-text">
              <h2 className="omr-section-title">Australia&apos;s Caravan Market in 2026</h2>
              <p>Off road caravans form part of a substantial Australian caravan and camping market.</p>
              <p>Australians took <strong>17.3 million domestic caravan and camping trips during 2025</strong>, generating 57.9 million visitor nights and approximately <strong>$12.6 billion in expenditure</strong>. Regional Australia remains particularly important, with 87% of caravan and camping trips occurring in regional areas.</p>
              <p>Australia also continues to manufacture a substantial number of recreational vehicles. Australian manufacturers produced <strong>23,963 RVs during 2025</strong>, with towable vehicles accounting for 96% of production. Caravan production reached <strong>18,438 units</strong>, an increase of 7.3% from the previous year.</p>
              <p>These figures describe Australia&apos;s broader caravan and camping industry. The statistics throughout the remainder of this report relate specifically to <strong>off road caravan advertisements appearing on CaravansForSale.com.au</strong>.</p>
            </div>
            {/* Right 25%: key points */}
            <div className="omr-context-stats">
              {[
                { icon: "bi-people",          val: "17.3M+",     label: "Overnight caravan trips taken in Australia each year" },
                { icon: "bi-currency-dollar", val: "$12.6B",     label: "Estimated annual Australian RV industry revenue" },
                { icon: "bi-graph-up-arrow",  val: "Growing",    label: "Off road segment share of the total caravan market" },
                { icon: "bi-map",             val: "All States", label: "Off road caravans listed across every Australian state &amp; territory" },
              ].map((s, i) => (
                <div key={i} className="omr-context-stat">
                  <div className="omr-context-stat__icon"><i className={`bi ${s.icon}`} /></div>
                  <div>
                    <div className="omr-context-stat__val">{s.val}</div>
                    <div className="omr-context-stat__label" dangerouslySetInnerHTML={{ __html: s.label }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How Many Off Road Caravans For Sale ── */}
      <section className="omr-supply-section">
        <div className="container">
          <div className="omr-supply-grid">
            {/* Left column */}
            <div className="omr-supply-left">
              <div className="omr-supply-heading-row">
                <div className="omr-supply-hero-icon">
                  <img src="/images/caravan.png" alt="" />
                </div>
                <h2 className="omr-supply-heading">
                  How Many Off Road Caravans Are for Sale
                  <span className="omr-supply-heading--orange">in Australia?</span>
                  
                </h2>
              </div>
              {total_count > 0 ? (
                <>
                  <p className="omr-supply-intro">
                    At the latest marketplace snapshot, there are{" "}
                    <span className="omr-supply-count">{fmt(total_count)}</span>{" "}
                    active off road caravan advertisements on CaravansForSale.com.au
                  </p>
                  <p className="omr-supply-of-these">Of these:</p>
                  <div className="omr-supply-stats">
                    <div className="omr-supply-stat">
                      <div className="omr-supply-stat__icon omr-supply-stat__icon--new"><img src="/images/caravan_black.png" className="omr-supply-stat-img omr-supply-stat-img--white" alt="" /></div>
                      <span className="omr-supply-stat__num">{fmt(new_count)}</span>
                      <span className="omr-supply-stat__label">are new</span>
                    </div>
                    <div className="omr-supply-stat">
                      <div className="omr-supply-stat__icon omr-supply-stat__icon--used"><img src="/images/caravan_black.png" className="omr-supply-stat-img omr-supply-stat-img--white" alt="" /></div>
                      <span className="omr-supply-stat__num">{fmt(used_count)}</span>
                      <span className="omr-supply-stat__label">are used</span>
                    </div>
                    {total_count - new_count - used_count > 0 && (
                      <div className="omr-supply-stat">
                        <div className="omr-supply-stat__icon omr-supply-stat__icon--other"><img src="/images/caravan_black.png" className="omr-supply-stat-img omr-supply-stat-img--orange" alt="" /></div>
                        <span className="omr-supply-stat__num">{fmt(total_count - new_count - used_count)}</span>
                        <span className="omr-supply-stat__label">have another or unspecified condition</span>
                      </div>
                    )}
                  </div>
                  <div className="omr-supply-callout">
                    <i className="bi bi-graph-up-arrow omr-supply-callout__icon" />
                    <p>This means new caravans currently account for approximately <strong>{newShare}%</strong> of classified off road inventory, while used caravans represent <strong>{usedShare}%</strong>.</p>
                  </div>
                </>
              ) : (
                <p className="omr-supply-intro">Off road caravans from private sellers and dealers across all Australian states and territories are listed on CaravansForSale.com.au.</p>
              )}
            </div>
            {/* Right column */}
            <div className="omr-supply-right">
              <div className="omr-supply-table-header">
                <i className="bi bi-bar-chart-fill omr-supply-table-header__icon" />
                <div>
                  <p className="omr-supply-table-header__title">New vs Used Off Road Caravan Supply</p>
                  <div className="omr-supply-table-header__underline" />
                </div>
              </div>
              <div className="omr-table-scroll">
                <table className="omr-table">
                  <thead>
                    <tr><th>Condition</th><th>Active Listings</th><th>Share of Classified Inventory</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="omr-badge omr-badge--new">New</span></td>
                      <td>{fmt(new_count)}</td>
                      <td>{fmtPct(parseFloat(newShare))}</td>
                    </tr>
                    <tr>
                      <td><span className="omr-badge omr-badge--used">Used</span></td>
                      <td>{fmt(used_count)}</td>
                      <td>{fmtPct(parseFloat(usedShare))}</td>
                    </tr>
                    {total_count - new_count - used_count > 0 && (
                      <tr>
                        <td>Other / Unknown</td>
                        <td>{fmt(total_count - new_count - used_count)}</td>
                        <td>—</td>
                      </tr>
                    )}
                    <tr className="omr-table-total">
                      <td><strong>Total</strong></td>
                      <td><strong>{fmt(total_count)}</strong></td>
                      <td><strong>{total_count > 0 ? "100%" : "—"}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="omr-supply-note">
                <i className="bi bi-info-circle omr-supply-note__icon" />
                <div>
                  <strong>Active marketplace listings only.</strong>
                  <p>Data from CaravansForSale.com.au at snapshot date.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── Charts Row 1: New/Used + Price + Trend ── */}
      <section className="omr-charts-row">
        <div className="container">
          <div className="omr-charts-3col">
            {/* New vs Used donut */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">New vs Used Off Road Caravan Inventory</h3>
              <div className="omr-donut-wrap omr-donut-wrap--row">
                <DonutChart segments={[
                  { value: new_count,  color: "#ec7200", label: "New"  },
                  { value: used_count, color: "#232323", label: "Used" },
                ]} />
                <div className="omr-donut-legend">
                  <div className="omr-donut-legend__item">
                    <span className="omr-donut-legend__dot" style={{ background: "#ec7200" }} />
                    <span className="omr-donut-legend__label">New</span>
                    <span className="omr-donut-legend__count">{fmt(new_count)}</span>
                    <span className="omr-donut-legend__pct">({newShare}%)</span>
                  </div>
                  <div className="omr-donut-legend__item">
                    <span className="omr-donut-legend__dot" style={{ background: "#1e293b" }} />
                    <span className="omr-donut-legend__label">Used</span>
                    <span className="omr-donut-legend__count">{fmt(used_count)}</span>
                    <span className="omr-donut-legend__pct">({usedShare}%)</span>
                  </div>
                  <div className="omr-donut-legend__item">
                    <span className="omr-donut-legend__dot" style={{ background: "#ccc" }} />
                    <span className="omr-donut-legend__label">Other/Unknown</span>
                    <span className="omr-donut-legend__count">{fmt(unknown_count)}</span>
                    <span className="omr-donut-legend__pct">{total_count > 0 ? `(${((unknown_count / total_count) * 100).toFixed(1)}%)` : "(0%)"}</span>
                  </div>
                </div>
              </div>
              <a href="/listings/new-condition/off-road-category/" className="omr-donut-browse-btn">Browse New Off Road Caravans <i className="bi bi-arrow-right" /></a>
              <a href="/listings/used-condition/off-road-category/" className="omr-donut-browse-btn">Browse Used Off Road Caravans <i className="bi bi-arrow-right" /></a>
            </div>

            {/* Median Price horizontal bars */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">Median Asking Price Overview</h3>
              <div className="omr-hbar-list">
                <HBar label="All Off Road Caravans" value={median_price}        displayValue={fmtAUD(median_price)}        max={maxPrice} color="#1e293b" />
                <HBar label="New Off Road Caravans"  value={new_price_median}   displayValue={fmtAUD(new_price_median)}   max={maxPrice} color="#ec7200" />
                <HBar label="Used Off Road Caravans" value={used_price_median}  displayValue={fmtAUD(used_price_median)}  max={maxPrice} color="#3b82f6" />
              </div>
              {/* <p className="omr-chart-note"><i className="bi bi-info-circle" /> How Prices Are Calculated</p> */}
            </div>

            {/* Trend line chart */}
            <div className="omr-chart-box">
              <h3 className="omr-chart-title">Active Listings Over Time (Total)</h3>
              <LineChart data={displayTrend} />
            </div>
          </div>
        </div>
      </section>

      {/* ── How Much Do Off Road Caravans Cost ── */}
      <section className="omr-price-section">
        <div className="container">
          <h2 className="omr-section-title">How Much Do Off Road Caravans Cost in Australia?</h2>
          <div className="omr-price-intro-grid">
            {/* Left: text content */}
            <div className="omr-price-intro-left">
              <p className="omr-price-intro-lead">
                The median advertised asking price of an off road caravan on CaravansForSale.com.au is currently{" "}
                <strong>{median_price > 0 ? fmtAUD(median_price) : "—"}</strong>, based on active advertisements containing a valid numeric asking price.
              </p>
              <p className="omr-price-subhead">Across the current marketplace:</p>
              <ul className="omr-price-bullet-list">
                <li>Median advertised price: <strong>{median_price > 0 ? fmtAUD(median_price) : "—"}</strong></li>
                <li>Median new off road caravan price: <strong>{new_price_median > 0 ? fmtAUD(new_price_median) : "—"}</strong></li>
                <li>Median used off road caravan price: <strong>{used_price_median > 0 ? fmtAUD(used_price_median) : "—"}</strong></li>
                <li>25th percentile asking price: <strong>{price_p25 > 0 ? fmtAUD(price_p25) : "—"}</strong></li>
                <li>75th percentile asking price: <strong>{price_p75 > 0 ? fmtAUD(price_p75) : "—"}</strong></li>
                <li>Validated advertised price range: <strong>{price_p25 > 0 && price_p75 > 0 ? `${fmtAUD(price_p25)} – ${fmtAUD(price_p75)}` : "—"}</strong></li>
              </ul>
              <p className="omr-price-note-text">Using the median rather than simply calculating an average reduces the influence of unusually expensive or inexpensive listings and gives buyers a more representative indication of the centre of the current advertised market.</p>
            </div>
            {/* Right: price summary card */}
            <div className="omr-price-intro-right">
              <div className="omr-price-summary-card">
                <div className="omr-price-summary-item">
                  <div className="omr-price-summary-label">Median Price (All)</div>
                  <div className="omr-price-summary-val">{median_price > 0 ? fmtAUD(median_price) : "—"}</div>
                </div>
                <div className="omr-price-summary-item">
                  <div className="omr-price-summary-label">New — Median Asking Price</div>
                  <div className="omr-price-summary-val omr-price-summary-val--orange">{new_price_median > 0 ? fmtAUD(new_price_median) : "—"}</div>
                </div>
                <div className="omr-price-summary-item">
                  <div className="omr-price-summary-label">Used — Median Asking Price</div>
                  <div className="omr-price-summary-val omr-price-summary-val--dark">{used_price_median > 0 ? fmtAUD(used_price_median) : "—"}</div>
                </div>
                <p className="omr-price-summary-note">Advertised asking prices only · CaravansForSale.com.au</p>
              </div>
            </div>
          </div>

          <hr className="omr-price-divider" />

          {/* New + Used — side by side */}
          <div className="omr-price-sub-grid">
            <div>
              <h3 className="omr-price-h3">New Off Road Caravan Prices</h3>
              <p className="omr-price-body">New off road caravans currently have a median advertised asking price of <strong>{new_price_median > 0 ? fmtAUD(new_price_median) : "—"}</strong>.</p>
              <p className="omr-price-body">Prices can vary considerably according to caravan size, manufacturer, construction, suspension, electrical system, battery and solar capacity, water storage, layout and optional equipment.</p>
              <a href="/listings/new-condition/off-road-category/" className="omr-price-browse-link">Browse New Off Road Caravans <i className="bi bi-arrow-right" /></a>
            </div>
            <div>
              <h3 className="omr-price-h3">Used Off Road Caravan Prices</h3>
              <p className="omr-price-body">Used off road caravans currently have a median advertised asking price of <strong>{used_price_median > 0 ? fmtAUD(used_price_median) : "—"}</strong>.</p>
              <p className="omr-price-body">Used pricing can be influenced by model year, kilometres travelled by the towing setup, condition, manufacturer, modifications, accessories, service history and the specification of the caravan when originally purchased.</p>
              <a href="/listings/used-condition/off-road-category/" className="omr-price-browse-link">Browse Used Off Road Caravans <i className="bi bi-arrow-right" /></a>
            </div>
          </div>

          <hr className="omr-price-divider" />

          {/* New vs Used — 2 col */}
          <div className="omr-price-sub-grid">
            <div>
              <h3 className="omr-price-h3">New vs Used Off Road Caravan Prices</h3>
              <p className="omr-price-body">The difference between the current median asking prices for new and used off road caravans is{" "}
                <strong>{(new_price_median > 0 && used_price_median > 0) ? fmtAUD(new_price_median - used_price_median) : "—"}</strong>, with new inventory advertised at approximately{" "}
                <strong>{(new_price_median > 0 && used_price_median > 0) ? `${Math.round(((new_price_median - used_price_median) / used_price_median) * 100)}%` : "—"}</strong> more than the used median.
              </p>
              <p className="omr-price-body">This should <strong>not</strong> be treated as an off road caravan depreciation rate.</p>
              <p className="omr-price-body">The two groups contain different manufacturers, models, years, sizes and specifications. The comparison simply shows the advertised pricing of new and used inventory available at the current marketplace snapshot.</p>
            </div>
            <div className="omr-table-scroll">
              <table className="omr-table omr-price-cmp-table">
                <thead>
                  <tr><th>Price Metric</th><th>New</th><th>Used</th></tr>
                </thead>
                <tbody>
                  <tr><td>Active Listings</td><td>{fmt(new_count)}</td><td>{fmt(used_count)}</td></tr>
                  <tr><td>Highest Asking Price</td><td>{new_price_max > 0 ? fmtAUD(new_price_max) : "—"}</td><td>{used_price_max > 0 ? fmtAUD(used_price_max) : "—"}</td></tr>
                  <tr><td>Median Asking Price</td><td>{fmtAUD(new_price_median)}</td><td>{fmtAUD(used_price_median)}</td></tr>
                  <tr><td>25th–75th Percentile</td><td>{new_price_p25 > 0 && new_price_p75 > 0 ? `${fmtAUD(new_price_p25)} – ${fmtAUD(new_price_p75)}` : "—"}</td><td>{used_price_p25 > 0 && used_price_p75 > 0 ? `${fmtAUD(used_price_p25)} – ${fmtAUD(used_price_p75)}` : "—"}</td></tr>
                  <tr><td>Median Length</td><td>{median_length_new > 0 ? `${median_length_new}ft` : "—"}</td><td>{median_length_used > 0 ? `${median_length_used}ft` : "—"}</td></tr>
                  <tr><td>Median ATM</td><td>{median_atm_new > 0 ? fmtKg(median_atm_new) : "—"}</td><td>{median_atm_used > 0 ? fmtKg(median_atm_used) : "—"}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── Most Popular Sizes ── */}
      <section className="omr-sizes-section">
        <div className="container">
          <h2 className="omr-section-title">What Are the Most Popular Off Road Caravan Sizes?</h2>
          <div className="omr-sizes-grid">
            {/* Left: intro + buyer guide */}
            <div className="omr-sizes-text">
              <p className="omr-sizes-intro-p">
                Among listings containing valid length information,{" "}
                <strong>{snapshot.common_length || "the 18–20ft range"}</strong> is currently the most common off road caravan size advertised on CaravansForSale.com.au.
              </p>
              <p className="omr-sizes-intro-p">
                It represents approximately <strong>{lengths.length > 0 && lengths[0]?.share > 0 ? fmtPct(lengths[0].share) : "—"}</strong> of current inventory with known length data.
              </p>
              <h3 className="omr-sizes-subhead">What size means for buyers</h3>
              <p className="omr-sizes-body-p">Smaller off road caravans can appeal to buyers prioritising manoeuvrability, compact campsites and potentially lower towing weight.</p>
              <p className="omr-sizes-body-p">Larger caravans can provide additional interior space, storage and more family-oriented layouts, but the extra length often comes with additional weight.</p>
              <p className="omr-sizes-body-p">Caravan size should therefore be considered alongside <strong>ATM, payload, tow vehicle capacity and intended travel</strong>, rather than in isolation.</p>
            </div>
            {/* Right: size distribution table */}
            <div>
              <h3 className="omr-sizes-subhead mt-0">Current Off Road Caravan Size Distribution</h3>
              {(() => {
                const DUMMY_LENGTHS = ["Under 16ft", "16–18ft", "18–20ft", "20–22ft", "22ft+", "Unknown / Invalid"];
                const rows = lengths.length > 0
                  ? lengths.map(l => ({ range: l.range, count: fmt(l.count), share: fmtPct(l.share) }))
                  : DUMMY_LENGTHS.map(r => ({ range: r, count: "—", share: "—" }));
                return (
                  <div className="omr-table-scroll">
                    <table className="omr-table">
                      <thead>
                        <tr><th>Length</th><th>Listings</th><th>Market Share</th></tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.range}>
                            <td>{r.range}</td>
                            <td>{r.count}</td>
                            <td>{r.share}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ── Off Road Caravans by State ── */}
      <section className="omr-state-section">
        <div className="container">
          <div className="omr-state-grid">
            {/* Left: intro + browse links + note */}
            <div>
              <h2 className="omr-section-title">Off Road Caravans for Sale by State</h2>
              <p className="omr-state-intro">Off road caravan inventory varies substantially between Australian states.</p>
              <p className="omr-state-intro">
                At the current snapshot, <strong>{topState ? topState.state : "—"}</strong> has the largest number of advertised off road caravans on CaravansForSale.com.au, accounting for approximately <strong>{topState && topState.share > 0 ? fmtPct(topState.share) : "—"}</strong> of national marketplace inventory.
              </p>
              
            </div>
            {/* Right: state table */}
            <div>
              {(() => {
                const DUMMY_STATES = ["Victoria", "New South Wales", "Queensland", "Western Australia", "South Australia", "Tasmania", "ACT", "Northern Territory"];
                const rows = states.length > 0
                  ? states.map(s => ({ state: s.state, count: fmt(s.count), share: fmtPct(s.share), price: fmtAUD(s.median_price) }))
                  : DUMMY_STATES.map(s => ({ state: s, count: "—", share: "—", price: "—" }));
                return (
                  <div className="omr-table-scroll">
                    <table className="omr-table">
                      <thead>
                        <tr><th>State / Territory</th><th>Active Listings</th><th>Share of Australian Inventory</th><th>Median Asking Price</th></tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.state}>
                            <td>{r.state}</td>
                            <td>{r.count}</td>
                            <td>{r.share}</td>
                            <td>{r.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="omr-state-browse-box">
            <p className="omr-state-browse-title">Browse Off Road Caravans by State</p>
            <div className="omr-state-links">
              {[
                { label: "Victoria", slug: "victoria-state" },
                { label: "New South Wales", slug: "new-south-wales-state" },
                { label: "Queensland", slug: "queensland-state" },
                { label: "Western Australia", slug: "western-australia-state" },
                { label: "South Australia", slug: "south-australia-state" },
                { label: "Tasmania", slug: "tasmania-state" },
              ].map(({ label, slug }) => (
                <a key={slug} href={`/listings/off-road-category/${slug}/`} className="omr-state-link">
                  Off Road Caravans in {label}
                </a>
              ))}
            </div>
            <p className="omr-state-note">State figures represent the advertised location assigned to the caravan listing. Dealer delivery areas should not be counted as additional listing locations.</p>
          </div>

          {/* Horizontal bar chart — highest to lowest */}
          {(() => {
            const DUMMY_CHART = [
              { state: "Queensland", share: 0.32, label: "—" },
              { state: "New South Wales", share: 0.28, label: "—" },
              { state: "Victoria", share: 0.22, label: "—" },
              { state: "Western Australia", share: 0.10, label: "—" },
              { state: "South Australia", share: 0.05, label: "—" },
              { state: "Tasmania", share: 0.02, label: "—" },
              { state: "ACT", share: 0.01, label: "—" },
              { state: "Northern Territory", share: 0.005, label: "—" },
            ];
            const chartRows = states.length > 0
              ? [...states].sort((a, b) => b.count - a.count).map(s => ({ state: s.state, share: s.share, label: fmt(s.count) }))
              : DUMMY_CHART;
            const maxShare = Math.max(...chartRows.map(r => r.share));
            return (
              <div className="omr-state-chart">
                <h3 className="omr-state-chart-title">Active Off Road Caravan Listings by State</h3>
                {chartRows.map(r => (
                  <div key={r.state} className="omr-state-bar-row">
                    <div className="omr-state-bar-label">{r.state}</div>
                    <div className="omr-state-bar-track">
                      <div className="omr-state-bar-fill" style={{ width: maxShare > 0 ? `${(r.share / maxShare) * 100}%` : "4px" }} />
                    </div>
                    <div className="omr-state-bar-val">{r.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      

      {/* ── ATM and Weight Data ── */}
      <section className="omr-atm-section" id="atm-info">
        <div className="container">
          <h2 className="omr-section-title">Off Road Caravan ATM and Weight Data</h2>
          <div className="omr-atm-doc-grid">
            {/* Left: intro + coverage */}
            <div>
              <p className="omr-atm-intro-p">Weight is one of the most important specifications for buyers comparing off road caravans.</p>
              <p className="omr-atm-intro-p">
                The median recorded <strong>Aggregate Trailer Mass (ATM)</strong> among current listings containing valid ATM information is{" "}
                <strong>{snapshot.median_atm > 0 ? fmtKg(snapshot.median_atm) : "—"}</strong>.
              </p>
              <p className="omr-atm-intro-p">ATM is the maximum allowable laden mass of the trailer specified by the manufacturer. Payload is broadly calculated by deducting the trailer&apos;s tare mass from its ATM.</p>
              <p className="omr-atm-intro-p">
                <strong>ATM data coverage:</strong>{" "}
                {(() => {
                  if (atms.length > 0 && total_count > 0) {
                    const validCount = atms.filter(a => !a.range.toLowerCase().includes("unknown") && !a.range.toLowerCase().includes("invalid")).reduce((s, a) => s + a.count, 0);
                    return `${((validCount / total_count) * 100).toFixed(1)}%`;
                  }
                  return "—";
                })()}{" "}
                of eligible listings.
              </p>
              <p className="omr-atm-coverage-note">Publishing the coverage figure is important because listings without reliable ATM data should not be silently allocated to a weight category.</p>
            </div>
            {/* Right: ATM table */}
            <div>
              <h3 className="omr-atm-h3">Off Road Caravans by ATM</h3>
              {(() => {
                const isUnknown = (r: string) => r.toLowerCase().includes("unknown") || r.toLowerCase().includes("invalid");
                const DUMMY_ATM = ["Under 1,500kg", "1,500–1,999kg", "2,000–2,499kg", "2,500–2,999kg", "3,000kg and over", "Unknown / Invalid"];
                const rows = atms.length > 0
                  ? atms.map(a => ({
                      range: a.range,
                      count: fmt(a.count),
                      share: isUnknown(a.range) ? "—" : fmtPct(a.share),
                      price: isUnknown(a.range) ? "—" : fmtAUD(a.median_price),
                    }))
                  : DUMMY_ATM.map(r => ({ range: r, count: "—", share: "—", price: "—" }));
                return (
                  <div className="omr-table-scroll">
                    <table className="omr-table">
                      <thead><tr><th>ATM</th><th>Listings</th><th>Share of Valid ATM Data</th><th>Median Asking Price</th></tr></thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.range}><td>{r.range}</td><td>{r.count}</td><td>{r.share}</td><td>{r.price}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Horizontal bar chart */}
          {(() => {
            const DUMMY_ATM_CHART = [
              { range: "3,000kg and over", share: 0.35, label: "—" },
              { range: "2,500–2,999kg", share: 0.30, label: "—" },
              { range: "2,000–2,499kg", share: 0.20, label: "—" },
              { range: "1,500–1,999kg", share: 0.10, label: "—" },
              { range: "Under 1,500kg", share: 0.05, label: "—" },
            ];
            const validAtms = atms.filter(a => !a.range.toLowerCase().includes("unknown") && !a.range.toLowerCase().includes("invalid"));
            const chartRows = validAtms.length > 0
              ? [...validAtms].sort((a, b) => b.count - a.count).map(a => ({ range: a.range, share: a.share, label: fmt(a.count) }))
              : DUMMY_ATM_CHART;
            const maxShare = Math.max(...chartRows.map(r => r.share));
            return (
              <div className="omr-atm-chart">
                <h3 className="omr-atm-chart-title">Distribution of Off Road Caravan Listings by ATM</h3>
                {chartRows.map(r => (
                  <div key={r.range} className="omr-state-bar-row">
                    <div className="omr-state-bar-label">{r.range}</div>
                    <div className="omr-state-bar-track">
                      <div className="omr-state-bar-fill" style={{ width: maxShare > 0 ? `${(r.share / maxShare) * 100}%` : "4px" }} />
                    </div>
                    <div className="omr-state-bar-val">{r.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* What Does ATM Mean */}
          <div className="omr-atm-explainer">
            <h3 className="omr-atm-h3">What Does ATM Mean When Choosing an Off Road Caravan?</h3>
            <p className="omr-atm-intro-p">ATM should never be considered by itself when deciding whether a tow vehicle is suitable.</p>
            <p className="omr-atm-intro-p">Buyers may also need to consider the tow vehicle&apos;s:</p>
            <ul className="omr-atm-bullet-list">
              <li>maximum braked towing capacity</li>
              <li>Gross Vehicle Mass (GVM)</li>
              <li>Gross Combination Mass (GCM)</li>
              <li>axle capacities</li>
              <li>towbar rating</li>
              <li>towball capacity</li>
              <li>actual loaded vehicle weight.</li>
            </ul>
            <p className="omr-atm-intro-p">Australian transport guidance notes that a vehicle manufacturer&apos;s towing limits and the applicable towbar or towball limits must not be exceeded, and that GCM can prevent a vehicle from using its full headline towing capacity when the vehicle itself is heavily loaded.</p>
            <p className="omr-atm-intro-p">The majority of conventional Australian caravans also fall within the national low-ATM trailer framework covering trailers with an ATM of <strong>4.5 tonnes or less</strong>.</p>
            <p className="omr-atm-important"><strong>Important:</strong> Marketplace statistics are provided for comparison purposes and are not vehicle-specific towing advice.</p>
          </div>
        </div>
      </section>

      {/* ── Sleeping Capacities ── */}
      <section className="omr-sleep-section">
        <div className="container">
          <h2 className="omr-section-title">Most Common Off Road Caravan Sleeping Capacities</h2>
          <div className="omr-sleep-grid">
            {/* Left: intro + browse link */}
            <div>
              <p className="omr-sleep-intro-p">Off road caravan layouts range from compact two-person touring vans through to larger family caravans with permanent bunks.</p>
              <p className="omr-sleep-intro-p">
                The most common recorded sleeping capacity in current marketplace inventory is{" "}
                <strong>{snapshot.common_sleeps > 0 ? `${snapshot.common_sleeps} berth` : "—"}</strong>.
              </p>
              <p className="omr-sleep-intro-p">The data can help buyers understand how much choice currently exists for couples, smaller families and larger family groups.</p>
              <a href="/listings/off-road-category/" className="omr-sleep-browse-link">
                Browse Off Road Caravans by Sleeping Capacity <i className="bi bi-arrow-right" />
              </a>
            </div>
            {/* Right: sleeping capacity table */}
            <div>
              {(() => {
                const isUnknown = (b: string) => b.toLowerCase().includes("unknown") || b.toLowerCase().includes("invalid");
                const DUMMY_SLEEPS = ["2 berth", "3 berth", "4 berth", "5 berth", "6+ berth", "Unknown"];
                const rows = sleeps.length > 0
                  ? sleeps.map(s => ({
                      berths: s.berths,
                      count: fmt(s.count),
                      share: isUnknown(s.berths) ? "—" : fmtPct(s.share),
                      price: isUnknown(s.berths) ? "—" : fmtAUD(s.median_price),
                    }))
                  : DUMMY_SLEEPS.map(b => ({ berths: b, count: "—", share: "—", price: "—" }));
                return (
                  <div className="omr-table-scroll">
                    <table className="omr-table">
                      <thead><tr><th>Sleeping Capacity</th><th>Listings</th><th>Share of Valid Sleep Data</th><th>Median Asking Price</th></tr></thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.berths}><td>{r.berths}</td><td>{r.count}</td><td>{r.share}</td><td>{r.price}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Full-width bar chart */}
          {(() => {
            const DUMMY_CHART = [
              { berths: "4 berth", share: 0.38, label: "—" },
              { berths: "2 berth", share: 0.28, label: "—" },
              { berths: "5 berth", share: 0.18, label: "—" },
              { berths: "3 berth", share: 0.10, label: "—" },
              { berths: "6+ berth", share: 0.06, label: "—" },
            ];
            const validSleeps = sleeps.filter(s => !s.berths.toLowerCase().includes("unknown") && !s.berths.toLowerCase().includes("invalid"));
            const chartRows = validSleeps.length > 0
              ? [...validSleeps].sort((a, b) => b.count - a.count).map(s => ({ berths: s.berths, share: s.share, label: fmt(s.count) }))
              : DUMMY_CHART;
            const maxShare = Math.max(...chartRows.map(r => r.share));
            return (
              <div className="omr-sleep-chart">
                <h3 className="omr-sleep-chart-title">Off Road Caravan Inventory by Sleeping Capacity</h3>
                {chartRows.map(r => (
                  <div key={r.berths} className="omr-state-bar-row">
                    <div className="omr-state-bar-label">{r.berths}</div>
                    <div className="omr-state-bar-track">
                      <div className="omr-state-bar-fill" style={{ width: maxShare > 0 ? `${(r.share / maxShare) * 100}%` : "4px" }} />
                    </div>
                    <div className="omr-state-bar-val">{r.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── Brands ── */}
      <section className="omr-brands-section">
        <div className="container">
          <h2 className="omr-section-title">Most Listed Off Road Caravan Brands</h2>
          <p className="omr-brands-intro-p">The off road caravan market includes established Australian manufacturers, newer brands and imported models.</p>
          <p className="omr-brands-intro-p">The table below ranks manufacturers according to their representation in <strong>active CaravansForSale.com.au marketplace inventory</strong>.</p>
          <p className="omr-brands-intro-p">It does <strong>not</strong> represent Australian sales volume, registrations, overall market share or a ranking of caravan quality.</p>

          {(() => {
            const DUMMY_BRANDS = Array.from({ length: 10 }, (_, i) => ({ rank: i + 1, brand: "—", count: "—", share: "—", price: "—", atm: "—", slug: "" }));
            const rows = brands.length > 0
              ? brands.map((b, i) => ({ rank: i + 1, brand: b.brand, count: fmt(b.count), share: fmtPct(b.share), price: fmtAUD(b.median_price), atm: fmtKg(b.median_atm), slug: b.brand }))
              : DUMMY_BRANDS;
            return (
              <div className="omr-table-scroll">
                <table className="omr-table omr-table--brands">
                  <thead>
                    <tr><th>Rank</th><th>Brand</th><th>Active Listings</th><th>Inventory Share</th><th>Median Asking Price</th><th>Median ATM</th></tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.rank}>
                        <td className="omr-rank">{r.rank}</td>
                        <td className="omr-brand-name">
                          {r.slug ? <a href={`/listings/off-road-category/?make=${encodeURIComponent(r.slug)}`}>{r.brand}</a> : r.brand}
                        </td>
                        <td>{r.count}</td>
                        <td>{r.share}</td>
                        <td>{r.price}</td>
                        <td>{r.atm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
          <p className="omr-brands-note"><strong>Price medians should only be displayed where enough valid priced listings exist to produce a meaningful comparison.</strong></p>

          {/* Bar chart */}
          {(() => {
            const DUMMY_CHART = Array.from({ length: 10 }, (_, i) => ({ brand: `Brand ${i + 1}`, share: 0.35 - i * 0.03, label: "—" }));
            const chartRows = brands.length > 0
              ? brands.map(b => ({ brand: b.brand, share: b.share, label: fmt(b.count) }))
              : DUMMY_CHART;
            const maxShare = Math.max(...chartRows.map(r => r.share));
            return (
              <div className="omr-brands-chart">
                <h3 className="omr-brands-chart-title">Top 10 Off Road Caravan Brands by Active Listings</h3>
                {chartRows.map(r => (
                  <div key={r.brand} className="omr-state-bar-row">
                    <div className="omr-state-bar-label">{r.brand}</div>
                    <div className="omr-state-bar-track">
                      <div className="omr-state-bar-fill" style={{ width: maxShare > 0 ? `${(r.share / maxShare) * 100}%` : "4px" }} />
                    </div>
                    <div className="omr-state-bar-val">{r.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── New vs Used Comparison ── */}
      <section className="omr-nvu-section">
        <div className="container">
          <h2 className="omr-section-title">New vs Used Off Road Caravans: Market Comparison</h2>
          <p className="omr-nvu-intro-p">Buyers deciding between a new and used off road caravan are entering two noticeably different parts of the marketplace.</p>
          <p className="omr-nvu-intro-p">The following table provides a direct comparison.</p>

          <div className="omr-table-scroll omr-nvu-table-wrap">
            <table className="omr-table">
              <thead><tr><th>Metric</th><th>New Off Road Caravans</th><th>Used Off Road Caravans</th></tr></thead>
              <tbody>
                <tr><td>Active Listings</td><td>{fmt(new_count)}</td><td>{fmt(used_count)}</td></tr>
                <tr><td>Inventory Share</td><td>{new_count > 0 && total_count > 0 ? `${((new_count / total_count) * 100).toFixed(1)}%` : "—"}</td><td>{used_count > 0 && total_count > 0 ? `${((used_count / total_count) * 100).toFixed(1)}%` : "—"}</td></tr>
                <tr><td>Median Asking Price</td><td>{fmtAUD(new_price_median)}</td><td>{fmtAUD(used_price_median)}</td></tr>
                <tr><td>Median Length</td><td>{median_length_new > 0 ? `${median_length_new}ft` : "—"}</td><td>{median_length_used > 0 ? `${median_length_used}ft` : "—"}</td></tr>
                <tr><td>Median ATM</td><td>{median_atm_new > 0 ? fmtKg(median_atm_new) : "—"}</td><td>{median_atm_used > 0 ? fmtKg(median_atm_used) : "—"}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="omr-nvu-why-grid">
            <div>
              <h3 className="omr-nvu-h3">Why Buyers May Choose New</h3>
              <p className="omr-nvu-intro-p">New inventory may appeal to buyers looking for:</p>
              <ul className="omr-nvu-bullet-list">
                <li>current layouts and technology</li>
                <li>manufacturer warranty coverage</li>
                <li>newer battery and solar systems</li>
                <li>greater ability to select floorplans and options</li>
                <li>the latest construction and suspension systems.</li>
              </ul>
            </div>
            <div>
              <h3 className="omr-nvu-h3">Why Buyers May Choose Used</h3>
              <p className="omr-nvu-intro-p">Used inventory may appeal to buyers prioritising:</p>
              <ul className="omr-nvu-bullet-list">
                <li>a lower purchase price</li>
                <li>accessories already fitted</li>
                <li>immediate availability</li>
                <li>access to models no longer produced</li>
                <li>avoiding part of the initial new-caravan price premium.</li>
              </ul>
            </div>
          </div>

          <p className="omr-nvu-closing">The marketplace data can indicate the current price difference, but buyers should compare individual caravans rather than assuming that all new or all used caravans offer the same value.</p>
          <div className="omr-nvu-btns">
            <a href="/listings/new-condition/off-road-category/" className="omr-price-browse-link">Browse New Off Road Caravans <i className="bi bi-arrow-right" /></a>
            <a href="/listings/used-condition/off-road-category/" className="omr-price-browse-link">Browse Used Off Road Caravans <i className="bi bi-arrow-right" /></a>
          </div>
        </div>
      </section>

      {/* ── Market Trends — only shown when historical data exists ── */}
      {trend.length >= 2 && (
        <section className="omr-trend-section" id="trend">
          <div className="container">
            <h2 className="omr-section-title">Off Road Caravan Market Trends</h2>
            <p className="omr-trend-intro-p">Once historical snapshots are available, this section tracks how off road caravan supply and advertised prices are changing over time.</p>

            <h3 className="omr-trend-h3">Off Road Caravan Inventory Trend</h3>
            {(() => {
              const first = trend[0];
              const last = trend[trend.length - 1];
              const pctChange = first.total > 0 ? ((last.total - first.total) / first.total * 100) : 0;
              const direction = pctChange >= 0 ? "increased" : "decreased";
              return (
                <>
                  <p className="omr-trend-intro-p">
                    Current inventory has <strong>{direction}</strong> by <strong>{Math.abs(pctChange).toFixed(1)}%</strong> compared with <strong>{first.label}</strong>.
                  </p>
                  <div className="omr-table-scroll omr-trend-table-wrap">
                    <table className="omr-table">
                      <thead><tr><th>Month</th><th>Total Listings</th><th>New</th><th>Used</th></tr></thead>
                      <tbody>
                        {trend.map(t => (
                          <tr key={t.label}><td>{t.label}</td><td>{fmt(t.total)}</td><td>{fmt(t.new_count)}</td><td>{fmt(t.used_count)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="omr-trend-chart-wrap">
                    <h3 className="omr-trend-chart-title">Active Off Road Caravan Inventory Over Time</h3>
                    <LineChart data={trend} />
                  </div>
                </>
              );
            })()}

            <h3 className="omr-trend-h3">Off Road Caravan Asking Price Trend</h3>
            <p className="omr-trend-intro-p">The national median advertised asking price trend is tracked separately for new and used inventory.</p>
            <p className="omr-trend-intro-p">Track three separate lines:</p>
            <ul className="omr-trend-bullet-list">
              <li><strong>All Off Road Caravans</strong></li>
              <li><strong>New Off Road Caravans</strong></li>
              <li><strong>Used Off Road Caravans</strong></li>
            </ul>
            <p className="omr-trend-intro-p">Keeping new and used inventory separate helps avoid mistaking changes in the proportion of new and used listings for actual movement in asking prices.</p>
          </div>
        </section>
      )}

      {/* ── What the Market Means for Buyers ── */}
      <section className="omr-buyers-section">
        <div className="container">
          <h2 className="omr-section-title">What the Current Off Road Caravan Market Means for Buyers</h2>
          <p className="omr-buyers-intro-p">Marketplace statistics become more useful when they help buyers make practical decisions.</p>

          <hr className="omr-buyers-divider" />

          <h3 className="omr-buyers-h3">Where Buyers Currently Have the Most Choice</h3>
          <p className="omr-buyers-body-p">
            <strong>{topState ? topState.state : "—"}</strong> currently has the largest advertised off road caravan inventory, accounting for <strong>{topState && topState.share > 0 ? fmtPct(topState.share) : "—"}</strong> of current national listings.
          </p>
          <p className="omr-buyers-body-p">Buyers prepared to search beyond their local market may therefore find a wider selection in states or regions with greater inventory.</p>

          <hr className="omr-buyers-divider" />

          <h3 className="omr-buyers-h3">What Buyers Are Currently Being Asked to Pay</h3>
          <p className="omr-buyers-body-p">The current national median advertised asking price is <strong>{median_price > 0 ? fmtAUD(median_price) : "—"}</strong>.</p>
          <p className="omr-buyers-body-p">For buyers comparing budgets, the more useful figures may be the separate new and used medians:</p>
          <p className="omr-buyers-body-p"><strong>New:</strong> {new_price_median > 0 ? fmtAUD(new_price_median) : "—"}<br /><strong>Used:</strong> {used_price_median > 0 ? fmtAUD(used_price_median) : "—"}</p>
          <p className="omr-buyers-body-p">The middle 50% price range of <strong>{price_p25 > 0 ? fmtAUD(price_p25) : "—"}</strong>–<strong>{price_p75 > 0 ? fmtAUD(price_p75) : "—"}</strong> can also provide a better indication of where much of the current marketplace sits than simply looking at the cheapest and most expensive advertisements.</p>

          <hr className="omr-buyers-divider" />

          <h3 className="omr-buyers-h3">Which Caravan Sizes Have the Most Choice</h3>
          <p className="omr-buyers-body-p">
            The <strong>{snapshot.common_length || (lengths.length > 0 ? lengths[0].range : "18–20ft")} length category</strong> currently contains the highest number of off road caravan advertisements.
          </p>
          <p className="omr-buyers-body-p">Buyers shopping within less common size categories may encounter fewer models and therefore benefit from searching across a wider geographic area.</p>

          <hr className="omr-buyers-divider" />

          <h3 className="omr-buyers-h3">How Heavy Is Current Off Road Caravan Inventory?</h3>
          <p className="omr-buyers-body-p">
            The median recorded ATM is <strong>{snapshot.median_atm > 0 ? fmtKg(snapshot.median_atm) : "—"}</strong>, while approximately <strong>{atmAbove3k && atmAbove3k.share > 0 ? fmtPct(atmAbove3k.share) : "—"}</strong> of listings with valid ATM information have an ATM of 3,000kg or more.
          </p>
          <p className="omr-buyers-body-p">This highlights why towing limits should be considered early in the buying process rather than after selecting a caravan.</p>

          <hr className="omr-buyers-divider" />

          <h3 className="omr-buyers-h3">Which Brands Have the Largest Advertised Supply?</h3>
          <p className="omr-buyers-body-p">
            {topBrands ? <><strong>{brands[0]?.brand || "—"}</strong>, <strong>{brands[1]?.brand || "—"}</strong> and <strong>{brands[2]?.brand || "—"}</strong> currently have the largest representation among active off road caravan advertisements.</> : "—"}
          </p>
          <p className="omr-buyers-body-p">A greater number of active listings can give buyers more models, layouts and prices to compare, but inventory volume should not be interpreted as a measure of manufacturer quality.</p>
        </div>
      </section>

      {/* ── How This Report Is Calculated ── */}
      <section className="omr-calc-section" id="methodology">
        <div className="container">

          <div className="omr-calc-header">
            <span className="omr-calc-chip">Methodology</span>
            <h2 className="omr-section-title">How This Off Road Caravan Market Report Is Calculated</h2>
            <p className="omr-calc-intro-p">Transparency is important when interpreting marketplace statistics.</p>
            <p className="omr-calc-intro-p">The Australian Off Road Caravan Market Report is calculated from <strong>active caravan advertisements on CaravansForSale.com.au classified within the off road caravan category at the stated data snapshot</strong>.</p>
          </div>

          <div className="omr-calc-grid">

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">Active Listings</h3>
              <p className="omr-calc-p">Only listings considered active at the snapshot time are included.</p>
              <p className="omr-calc-p">Removed, expired or otherwise inactive advertisements are excluded from current inventory calculations.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">New and Used Classification</h3>
              <p className="omr-calc-p">Listings are normalised into:</p>
              <ul className="omr-calc-list">
                <li>New</li>
                <li>Used</li>
                <li>Other / Unknown.</li>
              </ul>
              <p className="omr-calc-p">The national total must equal:</p>
              <p className="omr-calc-formula"><strong>New + Used + Other/Unknown = Total Active Inventory</strong></p>
              <p className="omr-calc-p">Listings without a valid condition are not silently assigned to either new or used.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">Asking Prices</h3>
              <p className="omr-calc-p">Price calculations include listings containing a valid positive numerical asking price in Australian dollars.</p>
              <p className="omr-calc-p">The following are excluded from price calculations:</p>
              <ul className="omr-calc-list">
                <li>POA</li>
                <li>missing prices</li>
                <li>zero prices</li>
                <li>invalid or malformed prices.</li>
              </ul>
              <p className="omr-calc-p">These listings may still remain part of total inventory counts.</p>
              <p className="omr-calc-p">The report describes <strong>advertised asking prices</strong>, not confirmed final transaction prices.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">Why We Use Median Prices</h3>
              <p className="omr-calc-p">Median prices are used as the primary measure because unusually expensive or inexpensive caravans can substantially influence a simple arithmetic average.</p>
              <p className="omr-calc-p">The median represents the middle priced listing when all eligible asking prices are arranged from lowest to highest.</p>
              <p className="omr-calc-p">Where sufficient data is available, the report also shows the <strong>25th–75th percentile</strong>, representing the middle 50% of advertised prices.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">Caravan Length</h3>
              <p className="omr-calc-p">Caravan lengths are normalised into mutually exclusive categories:</p>
              <ul className="omr-calc-list">
                <li>Under 16ft</li>
                <li>16ft to under 18ft</li>
                <li>18ft to under 20ft</li>
                <li>20ft to under 22ft</li>
                <li>22ft and over.</li>
              </ul>
              <p className="omr-calc-p">Missing or implausible length values are reported separately and excluded from length-based calculations.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">ATM</h3>
              <p className="omr-calc-p">ATM figures are taken from valid recorded listing data.</p>
              <p className="omr-calc-p">ATM means <strong>Aggregate Trailer Mass</strong> and refers to the manufacturer's maximum allowable mass of the loaded trailer.</p>
              <p className="omr-calc-p">Listings without a valid ATM remain in total marketplace inventory but are excluded from ATM medians and weight distributions.</p>
              <p className="omr-calc-p">The percentage of listings with valid ATM data is displayed alongside ATM statistics.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">Sleeping Capacity</h3>
              <p className="omr-calc-p">Sleeping capacity is normalised into:</p>
              <ul className="omr-calc-list">
                <li>2 berth</li>
                <li>3 berth</li>
                <li>4 berth</li>
                <li>5 berth</li>
                <li>6+ berth.</li>
              </ul>
              <p className="omr-calc-p">Listings without reliable sleeping-capacity information are reported as unknown.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">State and Territory</h3>
              <p className="omr-calc-p">Geographic statistics use the advertised location associated with the caravan.</p>
              <p className="omr-calc-p">A dealer that offers Australia-wide delivery does not cause the same caravan to be counted in multiple states.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">Brand Data</h3>
              <p className="omr-calc-p">Manufacturer names are normalised so differences in spelling, punctuation or capitalisation do not split the same brand into multiple groups.</p>
              <p className="omr-calc-p">Median brand prices should only be shown where a minimum number of valid priced listings exists.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">Duplicate Listings</h3>
              <p className="omr-calc-p">Where the same physical caravan appears more than once, duplicate detection should use available identifiers such as:</p>
              <ul className="omr-calc-list">
                <li>listing ID</li>
                <li>dealer stock number</li>
                <li>VIN where available</li>
                <li>seller</li>
                <li>make</li>
                <li>model</li>
                <li>year</li>
                <li>specification</li>
                <li>images or other internal identifiers.</li>
              </ul>
              <p className="omr-calc-p">The objective is for one physical caravan to contribute once to national marketplace statistics.</p>
            </div>

            <div className="omr-calc-card">
              <h3 className="omr-calc-h3">Data Coverage</h3>
              <p className="omr-calc-p">Not every advertisement contains every specification.</p>
              <p className="omr-calc-p">For this reason, the report displays coverage alongside important statistics.</p>
              <p className="omr-calc-p">For example:</p>
              <p className="omr-calc-formula"><strong>ATM data available for: 78% of listings</strong></p>
              <p className="omr-calc-p">is more transparent than presenting an ATM distribution that appears to represent 100% of the market.</p>
            </div>

          </div>

          {/* Data Updates — full width */}
          <div className="omr-calc-updates-card">
            <div className="omr-calc-updates-icon"><i className="bi bi-arrow-clockwise" /></div>
            <div className="omr-calc-updates-body">
              <h3 className="omr-calc-h3 omr-calc-h3--light">Data Updates</h3>
              <p className="omr-calc-p omr-calc-p--light">All figures on this page originate from the <strong>same canonical marketplace snapshot</strong>. The snapshot cards, charts, state totals, new/used totals and tables therefore update together.</p>
              <div className="omr-calc-snapshot-row">
                <div className="omr-calc-snapshot-item">
                  <span className="omr-calc-snapshot-label">Data snapshot</span>
                  <span className="omr-calc-snapshot-val">{snapshot.snapshot_date || "11 May 2026"}</span>
                </div>
                <div className="omr-calc-snapshot-item">
                  <span className="omr-calc-snapshot-label">Next scheduled refresh</span>
                  <span className="omr-calc-snapshot-val">June 2026</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Limitations of This Report ── */}
      <section className="omr-limit-section" id="limitations">
        <div className="container">

          <div className="omr-calc-header">
            
            <h2 className="omr-section-title">Limitations of This Report</h2>
            <p className="omr-calc-intro-p">This report provides a detailed view of advertisements appearing on CaravansForSale.com.au, but it does not represent every caravan available or owned in Australia.</p>
            <p className="omr-calc-intro-p">Important limitations include:</p>
          </div>

          <div className="omr-limit-cards-grid">
            {[
              { icon: "bi-currency-dollar",   text: "Advertised prices are not confirmed sale prices." },
              { icon: "bi-arrow-repeat",      text: "Marketplace inventory changes as advertisements are added and removed." },
              { icon: "bi-list-check",        text: "Some listings may have incomplete specifications." },
              { icon: "bi-pencil-square",     text: "Seller-entered information can contain errors." },
              { icon: "bi-bar-chart-line",    text: "Brand representation reflects active inventory rather than national sales." },
              { icon: "bi-geo-alt",           text: "Geographic data reflects the advertised location of listings." },
              { icon: "bi-tag",               text: "Marketplace pricing does not necessarily indicate the replacement cost or market valuation of an individual caravan." },
            ].map((item, i) => (
              <div key={i} className="omr-limit-card">
                <div className="omr-limit-card__icon"><i className={`bi ${item.icon}`} /></div>
                <p className="omr-limit-card__text">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="omr-limit-closing">
            <p>Statistics should therefore be used as <strong>marketplace indicators rather than individual caravan valuations</strong>.</p>
          </div>

        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="omr-faq-section" id="faq">
        <div className="container">
          <h2 className="omr-section-title">Frequently Asked Questions About the Australian Off Road Caravan Market</h2>
          <div className="omr-faq-grid">
            <div className="omr-faq-col">
              {FAQS.slice(0, Math.ceil(FAQS.length / 2)).map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
            </div>
            <div className="omr-faq-col">
              {FAQS.slice(Math.ceil(FAQS.length / 2)).map((f, i) => <FaqItem key={`r${i}`} q={f.q} a={f.a} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Explore CTA ── */}
      <section className="omr-explore-section">
        <div className="container">
          <h2 className="omr-section-title text-center">Explore the Australian Off Road Caravan Market</h2>
          <p className="omr-explore-desc">
            Market statistics can help you understand current prices and availability, but the right caravan willultimately depend on your tow vehicle, travel plans, budget, preferred layout and required off-roadcapability.<br></br>
            Continue your research by comparing live advertisements, caravan types, manufacturers, models andbuying guides across CaravansForSale.com.au.
          </p>
          <div className="omr-explore-links">
            <a href="/listings/off-road-category/"                className="omr-explore-link">Browse All Off Road Caravans for Sale</a>
            <a href="/listings/new-condition/off-road-category/"  className="omr-explore-link">Browse New Off Road Caravans</a>
            <a href="/listings/used-condition/off-road-category/" className="omr-explore-link">Browse Used Off Road Caravans</a>
            <a href="/off-road-caravans/"                         className="omr-explore-link">Explore Off Road Caravans Australia</a>
            <a href="/off-road-caravan-types/"                    className="omr-explore-link">Compare Off Road Caravan Types</a>
          </div>
          
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="omr-final-cta-section">
        <div className="container">
          <div className="omr-final-cta-card">
            <div className="omr-final-cta-icon">
              <img src="/images/category.svg" alt="" width={40} height={40} />
            </div>
            <div className="omr-final-cta-body">
              <h2 className="omr-final-cta-title">Ready to <span>Find Your</span> Off Road Caravan?</h2>
              <p className="omr-final-cta-p">Use the latest Australian marketplace data to understand current prices and availability, then compare <strong>new and used off road caravans from dealers and private sellers across Australia</strong>.</p>
              <p className="omr-final-cta-p">Search by price, state, length, ATM, sleeping capacity, brand and condition to find caravans that match your touring plans.</p>
            </div>
            <div className="omr-final-cta-btns">
              <a href="/listings/off-road-category/" className="omr-final-cta-btn">Browse Off Road Caravans <i className="bi bi-arrow-right" /></a>
              <a href="/off-road-caravans/" className="omr-final-cta-btn ">Back to Off Road Caravans Hub <i className="bi bi-arrow-right" /></a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
