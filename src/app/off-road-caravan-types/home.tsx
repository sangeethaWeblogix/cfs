"use client";

import { useState } from "react";
import Image from "next/image";
import "./main.css";

interface SnapshotData {
  total_count: number;
  new_count: number;
  used_count: number;
  used_price_median: number;
  new_price_median: number;
}

interface Props {
  snapshot: SnapshotData;
  popularBlogs: any[];
}


const SEMI_VS_FULL = [
  { feature: "Sealed Highways",           icon: "bi-signpost-2",        semi: { val: "Excellent",                  type: "good" }, full: { val: "Excellent",               type: "good" } },
  { feature: "Formed Gravel Roads",        icon: "bi-map",               semi: { val: "Generally Suitable",         type: "good" }, full: { val: "Suitable",                type: "good" } },
  { feature: "Maintained Dirt Roads",      icon: "bi-compass",           semi: { val: "Generally Suitable",         type: "good" }, full: { val: "Suitable",                type: "good" } },
  { feature: "Corrugated Remote Roads",    icon: "bi-activity",          semi: { val: "Limited / Model Dependent",  type: "mid"  }, full: { val: "Generally Better Suited",  type: "good" } },
  { feature: "Heavy-duty Suspension",      icon: "bi-wrench-adjustable", semi: { val: "Sometimes",                  type: "mid"  }, full: { val: "Common",                  type: "good" } },
  { feature: "Off-road Coupling",          icon: "bi-link-45deg",        semi: { val: "Model Dependent",            type: "mid"  }, full: { val: "Common",                  type: "good" } },
  { feature: "Large Off-grid Electrical",  icon: "bi-lightning-charge",  semi: { val: "Optional / Model Dependent", type: "mid"  }, full: { val: "More Common",             type: "good" } },
  { feature: "Larger Water Capacity",      icon: "bi-droplet-half",      semi: { val: "Model Dependent",            type: "mid"  }, full: { val: "More Common",             type: "good" } },
  { feature: "Weight",                     icon: "bi-boxes",             semi: { val: "Generally Lower",            type: "down" }, full: { val: "Generally Higher",        type: "up"   } },
  { feature: "Purchase Price",             icon: "bi-tag",               semi: { val: "Generally Lower",            type: "down" }, full: { val: "Generally Higher",        type: "up"   } },
];

const FULL_VS_HYBRID = [
  { feature: "Size",                full: "Larger",                  hybrid: "Compact" },
  { feature: "Living Space",        full: "More",                    hybrid: "Less" },
  { feature: "Off-Grid Capability", full: "High",                    hybrid: "High" },
  { feature: "Manoeuvrability",     full: "Lower",                   hybrid: "Higher" },
  { feature: "Setup",               full: "Quick",                   hybrid: "Pop-top (some)" },
  { feature: "Best For",            full: "Families & Long Trips",   hybrid: "Couples & Compact Travel" },
];

const TERRAIN = [
  { terrain: "Sealed Highways",     semi: "✓", full: "✓", extreme: "✓", hybrid: "✓" },
  { terrain: "Gravel Roads",        semi: "✓", full: "✓", extreme: "✓", hybrid: "✓" },
  { terrain: "Maintained Dirt",     semi: "✓", full: "✓", extreme: "✓", hybrid: "✓" },
  { terrain: "Corrugated Roads",    semi: "~", full: "✓", extreme: "✓", hybrid: "✓" },
  { terrain: "Rough Remote Tracks", semi: "~", full: "✓", extreme: "✓", hybrid: "✓" },
  { terrain: "Demanding Terrain",   semi: "–", full: "~", extreme: "✓", hybrid: "~" },
];

const GUIDES = [
  { title: "Best Off Road Caravans in Australia",  desc: "Compare the best off road caravans for Australian touring.",           img: "/images/off-road.webp",          href: "/best-off-road-caravans-australia/" },
  { title: "Best Semi Off Road Caravans",           desc: "Top semi off road caravans for touring and maintained unsealed roads.", img: "/images/Semi-Off-Road.png",      href: "/best-semi-off-road-caravans-australia/" },
  { title: "Best Hybrid Off Road Caravans",         desc: "Compact hybrid caravans with serious off-road capability.",             img: "/images/Hybrid-Off-Road.png",    href: "/best-off-road-hybrid-caravans-australia/" },
  { title: "Best Lightweight Off Road Caravans",    desc: "Lighter off road caravans that are easier to tow off road.",            img: "/images/Full-Off-Road.png",      href: "/best-lightweight-off-road-caravans-australia/" },
  { title: "Best Single Axle Off Road Caravans",    desc: "Smaller single axle caravans perfect for couples and compact touring.", img: "/images/Extreme-Off-Road.png",   href: "/best-single-axle-off-road-caravans/" },
  { title: "Off Road Caravans with Bunk Beds",      desc: "Family-friendly layouts with bunks for kids.",                          img: "/images/australian-offroad.png", href: "/off-road-caravans-with-bunk-beds/" },
];

const FAQS = [
  { q: "What are the main types of off road caravans?",                            a: "The most commonly used categories in Australia are semi off road, full off road, extreme off road and hybrid off road caravans. These are market descriptions rather than one nationally standardised classification system, so specifications should always be compared between individual models." },
  { q: "What is the difference between semi off road and full off road caravans?", a: "Semi off road caravans are generally intended for sealed roads, gravel and maintained unsealed roads. Full off road caravans typically add more substantial suspension, chassis, ground clearance, protection and off-grid equipment for more demanding remote-road travel." },
  { q: "What is an extreme off road caravan?",                                     a: "Extreme off road is generally a marketing term used for highly specified caravans designed around serious remote travel. They often include heavy-duty suspension, increased payload, extensive protection and larger water, battery and solar systems." },
  { q: "What is a hybrid off road caravan?",                                       a: "A hybrid off road caravan combines features of an off-road camper trailer and a caravan. Hybrids are commonly more compact than conventional caravans while retaining hard-sided sleeping accommodation and many caravan-style amenities." },
  { q: "Is a hybrid caravan better than a full off road caravan?",                 a: "Neither type is automatically better. A hybrid generally offers more compact dimensions and manoeuvrability, while a full-size off road caravan usually offers greater internal living space and storage. The right choice depends on your travel plans." },
  { q: "Do I need a 4WD to tow an off road caravan?",                              a: "Not every off road caravan automatically requires a 4WD, but the tow vehicle must be suitable for the caravan's loaded weight and intended terrain. Remote or demanding off-road travel will generally favour appropriately rated four-wheel-drive tow vehicles." },
  { q: "Does full off road mean a caravan can go anywhere?",                        a: "No. A caravan marketed as full off road still has limits. Always check the manufacturer's intended-use statement, specifications and warranty conditions before travelling on difficult terrain." },
  { q: "Are off road caravans heavier than touring caravans?",                      a: "They often can be because stronger chassis components, suspension, larger tyres, additional batteries, water tanks and protection systems add weight. However, weight varies significantly between models." },
  { q: "Is independent suspension essential for an off road caravan?",              a: "Independent suspension is common on full off-road caravans because it can improve wheel movement over uneven terrain, but it is only one part of the overall design. Chassis, tyres, brakes, clearance, body construction and payload are also important." },
  { q: "How do I know which off road caravan is right for me?",                     a: "Start with the roads you genuinely intend to travel, then consider your tow vehicle, caravan ATM, payload requirements, desired layout, number of travellers, off-grid duration and budget. Choose the level of off-road capability that matches those needs." },
  { q: "Where can I find off road caravans for sale in Australia?",                 a: "Browse new and used off road caravans from dealers and private sellers across Australia on CaravansForSale.com.au. Compare by price, location, size, ATM, sleeping capacity and condition." },
];

function terrainClass(v: string) {
  if (v === "✓") return "ort-terrain--yes";
  if (v === "~") return "ort-terrain--maybe";
  return "ort-terrain--no";
}

function CmpCell({ v }: { v: { val: string; type: string } }) {
  return (
    <div className={`ort-cmp-val ort-cmp-val--${v.type}`}>
      <span className="ort-cmp-val__icon">
        {v.type === "good" && <i className="bi bi-check-lg" />}
        {v.type === "mid"  && <span>~</span>}
        {v.type === "down" && <i className="bi bi-arrow-down-short" />}
        {v.type === "up"   && <i className="bi bi-arrow-up-short" />}
      </span>
      {v.val}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ort-faq__item${open ? " ort-faq__item--open" : ""}`}>
      <button className="ort-faq__q" onClick={() => setOpen(!open)} aria-expanded={open}>
        <h3 className="ort-faq__q-text">{q}</h3>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"} ort-faq__icon`} />
      </button>
      {open && <div className="ort-faq__a"><p>{a}</p></div>}
    </div>
  );
}

function fmtNum(n: number, prefix = "") {
  return n > 0 ? `${prefix}${n.toLocaleString()}` : null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

export default function Home({ snapshot, popularBlogs }: Props) {
  const { total_count, new_count, used_count, used_price_median, new_price_median } = snapshot;
  const totalAdv = used_count + new_count;
  const medianAdv = totalAdv > 0 && used_price_median > 0 && new_price_median > 0
    ? Math.round((used_price_median * used_count + new_price_median * new_count) / totalAdv)
    : 0;

  return (
    <div className="ort-page">

      {/* ── Hero ── */}
      <section className="ort-hero">
        <div className="container">
          <h1 className="ort-hero__title">
            Compare Off Road <span className="ort-hero__title-accent">Caravan Types</span>
          </h1>
          <div className="ort-hero__divider">
            <span className="ort-hero__divider-line" />
            <img src="/images/aus_outline.svg" alt="" aria-hidden="true" className="ort-hero__divider-icon" />
            <span className="ort-hero__divider-line" />
          </div>
          <div className="ort-hero__body">
            <p>
              Choosing an off road caravan involves much more than deciding how rugged you want your caravan to look. Australian buyers will commonly come across terms such as <strong>semi off road, full off road, extreme off road and hybrid</strong>, but these labels can mean different things between manufacturers.
            </p>
            <p>
              There is no single industry-wide classification that automatically guarantees how or where a caravan can be used. Instead, the best way to compare off road caravan types is to look at the caravan&rsquo;s intended use, chassis, suspension, ground clearance, coupling, tyres, protection, weight, payload and off-grid capabilities.
            </p>
            <p>
              This guide explains the main types of <a href="/off-road-caravans/" style={{ color: "#ec7200", fontWeight: 600, textDecoration: "none" }}>off road caravans in Australia</a>, their typical differences and which type may suit your tow vehicle, destinations and style of travel.
            </p>
          </div>
          <div className="ort-hero__btns">
            <a href="/listings/off-road-category/" className="ort-btn ort-btn--pill">
              <i className="bi bi-search" /> Off Road Caravan Listings
            </a>
          </div>
        </div>
      </section>

      {/* ── Types at a Glance ── */}
      <section className="ort-glance section-padding">
        <div className="container">
          <h2 className="ort-section-title text-center mb-2">Off Road Caravan Types at a Glance</h2>
          <p className="ort-section-subtitle text-center mb-4">
            While manufacturers may use slightly different terminology, most off road caravans can broadly be compared across four common categories.
          </p>
          <div className="ort-glance-wrap">
            <table className="ort-glance-table">
              <thead>
                <tr>
                  <th>Caravan Type</th>
                  <th>Typically Best For</th>
                  <th>Terrain</th>
                  <th>Off-Grid Capability</th>
                  <th>Main Advantage</th>
                  <th>Main Consideration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong className="ort-type-label ort-type-label--semi">Semi Off Road</strong></td>
                  <td>Touring with occasional unsealed roads</td>
                  <td>Bitumen, gravel and maintained dirt roads</td>
                  <td><span className="ort-badge ort-badge--moderate">Moderate</span></td>
                  <td>Lower weight and cost</td>
                  <td>Less suited to sustained rough terrain</td>
                </tr>
                <tr>
                  <td><strong className="ort-type-label ort-type-label--full">Full Off Road</strong></td>
                  <td>Outback and remote touring</td>
                  <td>Corrugations and rough unsealed roads</td>
                  <td><span className="ort-badge ort-badge--high">High</span></td>
                  <td>Strong balance of durability and comfort</td>
                  <td>Usually heavier and more expensive</td>
                </tr>
                <tr>
                  <td><strong className="ort-type-label ort-type-label--extreme">Extreme Off Road</strong></td>
                  <td>Serious remote-area touring</td>
                  <td>More demanding remote terrain</td>
                  <td><span className="ort-badge ort-badge--veryhigh">Very High</span></td>
                  <td>Maximum durability and self-sufficiency</td>
                  <td>Higher weight, cost and tow-vehicle requirements</td>
                </tr>
                <tr>
                  <td><strong className="ort-type-label ort-type-label--hybrid">Hybrid Off Road</strong></td>
                  <td>Compact adventure touring</td>
                  <td>Gravel, rough roads and remote tracks</td>
                  <td><span className="ort-badge ort-badge--high">High</span></td>
                  <td>Compact size and manoeuvrability</td>
                  <td>Less internal living space</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="ort-glance-note">
            <p>The important point is that the <strong>name alone should never determine your decision</strong>. Two caravans both marketed as &ldquo;full off road&rdquo; can have very different suspension systems, payloads, construction methods and manufacturer limitations.</p>
            <p>Use the categories below as a starting point, then compare the actual specifications of every caravan you are considering.</p>
          </div>
        </div>
      </section>

      {/* ── Semi Off Road Caravans ── */}
      <section id="semi-off-road" className="ort-type-detail section-padding">
        <div className="container">

          <div className="ort-td-hero">
            <div className="ort-td-hero__img-col">
              <Image src="/images/Semi-Off-Road.jpg" alt="Semi Off Road Caravans" width={480} height={320} className="ort-td-hero__img" unoptimized />
            </div>
            <div className="ort-td-hero__text">
              
              <h2 className="ort-td-hero__h2">Semi Off Road <span className="ort-td-hero__h2-accent">Caravans</span></h2>
              <div className="ort-td-hero__underline" />
              <p>A <strong>semi off road caravan</strong> is a caravan positioned in the market above a standard touring caravan but below a fully built off road caravan.</p>
              <p>These caravans are generally designed for travellers who primarily travel on sealed roads but want a caravan that can handle gravel roads, well-maintained unsealed roads and accessible bush camps in better condition than a conventional caravan.</p>
              <p>They commonly include some off-road-oriented upgrades — such as improved suspension, extra ground clearance or all-terrain tyres — while retaining a layout and price point designed for mainstream touring.</p>
            </div>
          </div>

          <div className="ort-td-card ort-td-card--split">
            <div className="ort-td-card__left">
              <div className="ort-td-card__icon-wrap"><i className="bi bi-people-fill" /></div>
              <h3 className="ort-td-card__h3">Who Is a Semi Off Road Caravan Best For?</h3>
            </div>
            <div className="ort-td-card__right">
              <p className="ort-td-intro-bold">A semi off road caravan may suit you if your trips involve:</p>
              <ul className="ort-check-list">
                {["Bitumen highways with occasional gravel sections", "Well-maintained dirt roads leading to popular campsites", "Accessible national park roads", "Regularly serviced outback routes", "Occasional bush camps with basic tracks"].map(item => (
                  <li key={item}><i className="bi bi-check-circle-fill" /> {item}</li>
                ))}
              </ul>
              <p>They are popular with buyers who want more capability than a conventional touring caravan but do not need the weight, cost or engineering of a fully rated off road model.</p>
            </div>
          </div>

          <div className="ort-td-features">
            <h3 className="ort-td-features__h3">Typical Semi Off Road Features</h3>
            <div className="ort-td-feat-divider">
              <span /><i className="bi bi-gear-fill" /><span />
            </div>
            <p className="ort-td-features__intro">Depending on the manufacturer and model, you may find a combination of these upgrades:</p>
            <div className="ort-td-feat-grid">
              {[
                { img: "off_road_icon3.png",  label: "Upgraded Suspension" },
                { img: "off_road_icon5.png",  label: "Higher Ground Clearance" },
                { img: "off_road_icon10.png", label: "Stone Protection" },
                { img: "off_road_icon4.png",  label: "All-terrain Tyres" },
                { img: "off_road_icon9.png",  label: "Increased Water Capacity" },
                { img: "off_road_icon2.png",  label: "Solar & Battery Options" },
                { img: "off_road_icon11.png", label: "Off-grid Camping Prep" },
                { img: "off_road_icon1.png",  label: "Stronger Chassis" },
                { img: "off_road_icon6.png",  label: "Underbody Protection" },
              ].map(f => (
                <div key={f.label} className="ort-td-feat-item">
                  <div className="ort-td-feat-icon">
                    <img src={`/images/${f.img}`} alt="" className="ort-td-feat-img" />
                  </div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
            <p className="ort-td-features__note">The presence of these features does not guarantee off-road performance. Always check the manufacturer&rsquo;s intended-use statement.</p>
          </div>

          <div className="ort-td-card ort-td-card--split">
            <div className="ort-td-card__left">
              <div className="ort-td-card__icon-wrap"><i className="bi bi-clipboard-check-fill" /></div>
              <h3 className="ort-td-card__h3">What to Check Before Buying a Semi Off Road Caravan</h3>
            </div>
            <div className="ort-td-card__right">
              <p className="ort-td-intro-bold">Ask the manufacturer or dealer:</p>
              <ul className="ort-q-list">
                {[
                  "Which roads and terrain is this caravan designed for?",
                  "Are there any terrain restrictions in the warranty?",
                  "What suspension system is fitted and what is its rating?",
                  "What is the ATM and how much usable payload is available?",
                  "Does this caravan have an off-road coupling or a standard ball coupling?",
                  "What is the tow-ball weight at ATM?",
                ].map(q => (
                  <li key={q}><i className="bi bi-question-circle-fill" /> {q}</li>
                ))}
              </ul>
              <div className="ort-td-tip">
                <i className="bi bi-lightbulb-fill" />
                <p>The last question is particularly important if you intend to tow on rough roads, because suspension and chassis ratings can vary significantly between models marketed with the same category label.</p>
              </div>
            </div>
          </div>

          <div className="ort-td-continue">
            <div className="ort-td-continue__search"><i className="bi bi-search" /></div>
            <span className="ort-td-continue__label">CONTINUE RESEARCHING</span>
            <div className="ort-td-continue__divider" />
            <a href="/best-semi-off-road-caravans-australia/" className="ort-td-continue__link">
              Best Semi Off Road Caravans in Australia <i className="bi bi-arrow-right" />
            </a>
          </div>

        </div>
      </section>

      {/* ── Full Off Road Caravans ── */}
      <section id="full-off-road" className="ort-type-detail section-padding" style={{ background: "#f6f7fb" }}>
        <div className="container">

          <div className="ort-td-hero ort-td-hero--reverse">
            <div className="ort-td-hero__img-col">
              <Image src="/images/Full-Off-Road.jpg" alt="Full Off Road Caravans" width={480} height={320} className="ort-td-hero__img" unoptimized />
            </div>
            <div className="ort-td-hero__text">
              
              <h2 className="ort-td-hero__h2">Full Off Road <span className="ort-td-hero__h2-accent" style={{ color: "#ec7200" }}>Caravans</span></h2>
              <div className="ort-td-hero__underline" style={{ background: "#ec7200" }} />
              <p>A <strong>full off road caravan</strong> is generally designed for travellers who expect to spend considerably more time away from sealed highways.</p>
              <p>These caravans commonly combine stronger construction with suspension designed for rougher roads, increased ground clearance, off-road couplings, all-terrain tyres and additional protection for components exposed underneath the caravan.</p>
              <p>They also frequently include larger electrical and water systems because the destinations they are designed to reach may have limited access to mains power, water or established campgrounds.</p>
            </div>
          </div>

          <div className="ort-td-card ort-td-card--split">
            <div className="ort-td-card__left">
              <div className="ort-td-card__icon-wrap" style={{ background: "#fff3e8", color: "#ec7200" }}><i className="bi bi-people-fill" /></div>
              <h3 className="ort-td-card__h3">Who Is a Full Off Road Caravan Best For?</h3>
            </div>
            <div className="ort-td-card__right">
              <p className="ort-td-intro-bold">A full off road caravan may be suitable if you regularly plan to travel on:</p>
              <ul className="ort-check-list">
                {["Corrugated Outback roads", "Rough unsealed roads", "Remote touring routes", "Station tracks", "National park access roads", "Extended routes where services are limited"].map(item => (
                  <li key={item}><i className="bi bi-check-circle-fill" style={{ color: "#ec7200" }} /> {item}</li>
                ))}
              </ul>
              <p>They are particularly popular with travellers who want to explore remote areas while retaining the comfort of a conventional caravan, including an internal kitchen, shower, toilet, large bed and substantial storage.</p>
            </div>
          </div>

          <div className="ort-td-features">
            <h3 className="ort-td-features__h3">Typical Full Off Road Features</h3>
            <div className="ort-td-feat-divider">
              <span /><i className="bi bi-gear-fill" style={{ color: "#ec7200" }} /><span />
            </div>
            <p className="ort-td-features__intro">Depending on the caravan, you may find:</p>
            <div className="ort-td-feat-grid">
              {[
                { img: "off_road_icon1.png",  label: "Heavy-duty Chassis" },
                { img: "off_road_icon3.png",  label: "Independent Suspension" },
                { img: "off_road_icon5.png",  label: "High Ground Clearance" },
                { img: "off_road_icon8.png",  label: "Off-road Coupling" },
                { img: "off_road_icon4.png",  label: "All-terrain Tyres" },
                { img: "off_road_icon10.png", label: "Stone & Underbody Shield" },
                { img: "off_road_icon9.png",  label: "Protected Water Tanks" },
                { img: "off_road_icon11.png", label: "Large Lithium Batteries" },
                { img: "off_road_icon2.png",  label: "Increased Solar Capacity" },
              ].map(f => (
                <div key={f.label} className="ort-td-feat-item">
                  <div className="ort-td-feat-icon">
                    <img src={`/images/${f.img}`} alt="" className="ort-td-feat-img" />
                  </div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
            <p className="ort-td-features__note">A long specification list does not automatically make one caravan better than another. What matters is how the entire caravan has been engineered to work together.</p>
          </div>

          <div className="ort-td-card ort-td-card--split">
            <div className="ort-td-card__left">
              <div className="ort-td-card__icon-wrap" style={{ background: "#fff3e8", color: "#ec7200" }}><i className="bi bi-exclamation-triangle-fill" /></div>
              <h3 className="ort-td-card__h3">Full Off Road Does Not Mean &ldquo;Go Anywhere&rdquo;</h3>
            </div>
            <div className="ort-td-card__right">
              <p className="ort-td-intro-bold">It is important not to assume that a caravan marketed as full off road can follow a 4WD across every type of terrain.</p>
              <ul className="ort-q-list">
                {[
                  "A caravan remains significantly longer, wider and heavier than the tow vehicle.",
                  "Deep washouts, steep creek crossings, tight tracks and soft sand can still exceed the caravan’s capability.",
                  "Severe angles and extreme terrain may damage even a full off road caravan.",
                ].map(q => (
                  <li key={q}><i className="bi bi-exclamation-circle-fill" style={{ color: "#ec7200" }} /> {q}</li>
                ))}
              </ul>
              <div className="ort-td-tip">
                <i className="bi bi-lightbulb-fill" />
                <p>Always check the manufacturer&rsquo;s <strong>intended-use statement and warranty conditions</strong> for the exact caravan you are considering before travelling on difficult terrain.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Extreme Off Road Caravans ── */}
      <section id="extreme-off-road" className="ort-type-detail section-padding">
        <div className="container">

          <div className="ort-td-hero">
            <div className="ort-td-hero__img-col">
              <Image src="/images/Extreme-Off-Road.jpg" alt="Extreme Off Road Caravans" width={480} height={320} className="ort-td-hero__img" unoptimized />
            </div>
            <div className="ort-td-hero__text">
              
              <h2 className="ort-td-hero__h2">Extreme Off Road <span className="ort-td-hero__h2-accent" style={{ color: "#ec7200" }}>Caravans</span></h2>
              <div className="ort-td-hero__underline" style={{ background: "#ec7200" }} />
              <p>The term <strong>extreme off road caravan</strong> is generally used for caravans positioned toward the highest end of remote touring capability.</p>
              <p>It is not a formal engineering classification. Instead, manufacturers commonly use the term for caravans incorporating more substantial chassis, suspension, protection, payload and off-grid systems designed around extended travel in remote parts of Australia.</p>
              <p>These caravans may carry significantly larger quantities of water, electrical storage, solar capacity and equipment than more conventional caravans.</p>
            </div>
          </div>

          <div className="ort-td-card ort-td-card--split">
            <div className="ort-td-card__left">
              <div className="ort-td-card__icon-wrap" style={{ background: "#fff3e8", color: "#ec7200" }}><i className="bi bi-people-fill" /></div>
              <h3 className="ort-td-card__h3">Who Is an Extreme Off Road Caravan Best For?</h3>
            </div>
            <div className="ort-td-card__right">
              <p className="ort-td-intro-bold">An extreme off road caravan is most relevant to travellers who:</p>
              <ul className="ort-check-list">
                {["Regularly undertake extended remote-area trips", "Expect sustained travel on difficult corrugated roads", "Spend long periods away from powered sites", "Require substantial water and battery capacity", "Carry significant tools, recovery gear and equipment", "Own a suitably rated tow vehicle"].map(item => (
                  <li key={item}><i className="bi bi-check-circle-fill" style={{ color: "#ec7200" }} /> {item}</li>
                ))}
              </ul>
              <p>For travellers who primarily visit caravan parks and maintained campsites, this additional capability may provide little practical benefit while increasing purchase price and towing weight.</p>
            </div>
          </div>

          <div className="ort-td-features">
            <h3 className="ort-td-features__h3">Typical Extreme Off Road Features</h3>
            <div className="ort-td-feat-divider">
              <span /><i className="bi bi-gear-fill" style={{ color: "#ec7200" }} /><span />
            </div>
            <p className="ort-td-features__intro">Features may include:</p>
            <div className="ort-td-feat-grid">
              {[
                { img: "off_road_icon1.png",  label: "Very Heavy-duty Chassis" },
                { img: "off_road_icon3.png",  label: "High-capacity Suspension" },
                { img: "off_road_icon5.png",  label: "Substantial Clearance" },
                { img: "off_road_icon8.png",  label: "Heavy-duty Coupling" },
                { img: "off_road_icon10.png", label: "Extensive Underbody Protection" },
                { img: "off_road_icon7.png",  label: "Large Payload Capacity" },
                { img: "off_road_icon9.png",  label: "Multiple Water Tanks" },
                { img: "off_road_icon11.png", label: "High-capacity Lithium" },
                { img: "off_road_icon2.png",  label: "Large Solar Arrays" },
              ].map(f => (
                <div key={f.label} className="ort-td-feat-item">
                  <div className="ort-td-feat-icon">
                    <img src={`/images/${f.img}`} alt="" className="ort-td-feat-img" />
                  </div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ort-td-card ort-td-card--split">
            <div className="ort-td-card__left">
              <div className="ort-td-card__icon-wrap" style={{ background: "#fff3e8", color: "#ec7200" }}><i className="bi bi-exclamation-triangle-fill" /></div>
              <h3 className="ort-td-card__h3">Consider the Additional Weight</h3>
            </div>
            <div className="ort-td-card__right">
              <p className="ort-td-intro-bold">Extreme off-road capability often adds significant weight:</p>
              <ul className="ort-q-list">
                {[
                  "A larger chassis, additional batteries and extra water capacity can significantly increase the caravan’s tare.",
                  "Multiple spare wheels, protection systems and recovery equipment increase the Aggregate Trailer Mass.",
                  "Additional weight can also change which tow vehicle you require.",
                ].map(q => (
                  <li key={q}><i className="bi bi-exclamation-circle-fill" style={{ color: "#ec7200" }} /> {q}</li>
                ))}
              </ul>
              <div className="ort-td-tip">
                <i className="bi bi-lightbulb-fill" />
                <p><strong>Do not choose the most extreme caravan simply because it appears more capable.</strong> Choose the caravan whose capability matches the travelling you actually intend to do.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Hybrid Off Road Caravans ── */}
      <section id="hybrid-off-road" className="ort-type-detail section-padding" style={{ background: "#f6f7fb" }}>
        <div className="container">

          <div className="ort-td-hero ort-td-hero--reverse">
            <div className="ort-td-hero__img-col">
              <Image src="/images/Hybrid-Off-Road.jpg" alt="Hybrid Off Road Caravans" width={480} height={320} className="ort-td-hero__img" unoptimized />
            </div>
            <div className="ort-td-hero__text">
              
              <h2 className="ort-td-hero__h2">Hybrid Off Road <span className="ort-td-hero__h2-accent" style={{ color: "#ec7200" }}>Caravans</span></h2>
              <div className="ort-td-hero__underline" style={{ background: "#ec7200" }} />
              <p>A <strong>hybrid off road caravan</strong> combines characteristics of an off-road camper trailer with the hard-sided accommodation and amenities normally associated with a caravan.</p>
              <p>There is no single universal definition of a hybrid caravan. In practice, hybrids are generally more compact than conventional full-size caravans and are designed to provide strong off-road capability while reducing overall towing dimensions.</p>
              <p>Some use pop-top roofs, while others use full-height bodies. Kitchens may be internal, external or a combination of both.</p>
            </div>
          </div>

          <div className="ort-td-card ort-td-card--split">
            <div className="ort-td-card__left">
              <div className="ort-td-card__icon-wrap" style={{ background: "#fff3e8", color: "#ec7200" }}><i className="bi bi-people-fill" /></div>
              <h3 className="ort-td-card__h3">Who Is a Hybrid Off Road Caravan Best For?</h3>
            </div>
            <div className="ort-td-card__right">
              <p className="ort-td-intro-bold">Hybrid caravans are particularly attractive to travellers who want:</p>
              <ul className="ort-check-list">
                {["A shorter, more compact caravan", "Easier manoeuvrability on tight tracks", "A narrower towing profile", "Strong off-road capability", "Lower overall towing bulk", "Hard-sided accommodation with good off-grid systems"].map(item => (
                  <li key={item}><i className="bi bi-check-circle-fill" style={{ color: "#ec7200" }} /> {item}</li>
                ))}
              </ul>
              <p>They can work especially well for couples and smaller families who prioritise where they can travel over having maximum internal floor space.</p>
            </div>
          </div>

          <div className="ort-td-features">
            <h3 className="ort-td-features__h3">Typical Hybrid Off Road Features</h3>
            <div className="ort-td-feat-divider">
              <span /><i className="bi bi-gear-fill" style={{ color: "#ec7200" }} /><span />
            </div>
            <p className="ort-td-features__intro">Depending on the model, a hybrid may include:</p>
            <div className="ort-td-feat-grid">
              {[
                { img: "off_road_icon7.png",  label: "Compact Body Dimensions" },
                { img: "off_road_icon12.png", label: "Pop-top / Low-profile Build" },
                { img: "off_road_icon3.png",  label: "Independent Suspension" },
                { img: "off_road_icon8.png",  label: "Off-road Coupling" },
                { img: "off_road_icon4.png",  label: "All-terrain Tyres" },
                { img: "off_road_icon5.png",  label: "High Ground Clearance" },
                { img: "off_road_icon11.png", label: "Lithium Battery Storage" },
                { img: "off_road_icon2.png",  label: "Solar Power" },
                { img: "off_road_icon9.png",  label: "Protected Water Tanks" },
              ].map(f => (
                <div key={f.label} className="ort-td-feat-item">
                  <div className="ort-td-feat-icon">
                    <img src={`/images/${f.img}`} alt="" className="ort-td-feat-img" />
                  </div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ort-td-card ort-td-card--split">
            <div className="ort-td-card__left">
              <div className="ort-td-card__icon-wrap" style={{ background: "#fff3e8", color: "#ec7200" }}><i className="bi bi-arrow-left-right" /></div>
              <h3 className="ort-td-card__h3">What Are the Compromises?</h3>
            </div>
            <div className="ort-td-card__right">
              <p className="ort-td-intro-bold">Compact size brings advantages, but there may also be trade-offs. Compared with a 20ft&ndash;22ft full-size caravan, a hybrid may offer:</p>
              <ul className="ort-q-list">
                {[
                  "Less internal floor space and smaller bathrooms",
                  "Less internal storage capacity",
                  "External cooking on some models",
                  "Additional setup steps with pop-top designs",
                  "Fewer large family layouts",
                ].map(q => (
                  <li key={q}><i className="bi bi-question-circle-fill" style={{ color: "#ec7200" }} /> {q}</li>
                ))}
              </ul>
              <div className="ort-td-tip">
                <i className="bi bi-lightbulb-fill" />
                <p>The decision comes down to whether you value <strong>compact towing and manoeuvrability</strong> more highly than internal living space.</p>
              </div>
            </div>
          </div>

          <div className="ort-td-continue">
            <div className="ort-td-continue__search"><i className="bi bi-search" /></div>
            <span className="ort-td-continue__label">CONTINUE RESEARCHING</span>
            <div className="ort-td-continue__divider" />
            <a href="/best-off-road-hybrid-caravans-australia/" className="ort-td-continue__link">
              Best Hybrid Off Road Caravans in Australia <i className="bi bi-arrow-right" />
            </a>
          </div>

        </div>
      </section>

      {/* ── Key Comparisons ── */}
      <section className="ort-compare section-padding">
        <div className="container">
          <h2 className="ort-section-title text-center mb-4">Key Comparisons</h2>
          <div className="ort-compare-grid">

            <div className="ort-compare-col">
              <h3 className="ort-cmp-title">
                Semi Off Road vs Full Off Road Caravans
              </h3>
              
              <p className="ort-cmp-intro">One of the most common questions Australian buyers ask is whether they actually need a full off road caravan. The answer depends mainly on where you intend to travel.</p>
              <div className="ort-table-scroll">
              <table className="ort-cmp-table">
                <thead>
                  <tr>
                    <th className="ort-cmp-th--feat">Feature</th>
                    <th className="ort-cmp-th--col">Semi Off Road</th>
                    <th className="ort-cmp-th--col">Full Off Road</th>
                  </tr>
                </thead>
                <tbody>
                  {SEMI_VS_FULL.map((r) => (
                    <tr key={r.feature}>
                      <td><span className="ort-cmp-feat">{r.feature}</span></td>
                      <td><CmpCell v={r.semi} /></td>
                      <td><CmpCell v={r.full} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="ort-cmp-info ort-cmp-info--orange">
                <i className="bi bi-info-circle ort-cmp-info__icon" />
                <p>If most of your trips involve highways with occasional gravel-road access to campsites, a <strong>semi off road caravan</strong> may be all you need.</p>
              </div>
              <div className="ort-cmp-info ort-cmp-info--blue">
                <i className="bi bi-info-circle ort-cmp-info__icon" />
                <p>If your travel plans regularly include long corrugated routes, remote touring and extended periods away from services, a <strong>full off road caravan</strong> is likely to provide a more appropriate starting point.</p>
              </div>
            </div>

            <div className="ort-compare-col mt-5">
              <h3 className="ort-cmp-title">Full Off Road vs Hybrid Off Road Caravans</h3>
              
              <p className="ort-cmp-intro">A full off road caravan and a hybrid caravan can both be highly capable away from sealed roads, but they generally prioritise different things.</p>
              <div className="ort-cmp-cols">
                <div className="ort-cmp-col-block">
                  <div className="ort-cmp-col-block__hd ort-cmp-col-block__hd--dark">Full Off Road typically provides more:</div>
                  <ul className="ort-cmp-col-block__list">
                    {["Internal living space", "Storage", "Larger kitchens", "Larger bathrooms", "Family-friendly layouts", "Residential-style comfort"].map(i => <li key={i}><i className="bi bi-check-lg" />{i}</li>)}
                  </ul>
                </div>
                <div className="ort-cmp-col-block">
                  <div className="ort-cmp-col-block__hd ort-cmp-col-block__hd--orange">Hybrid Off Road typically prioritises:</div>
                  <ul className="ort-cmp-col-block__list">
                    {["Shorter dimensions", "Lower towing profile", "Manoeuvrability", "Access to tighter campsites", "Potentially lower towing weight", "Compact remote touring"].map(i => <li key={i}><i className="bi bi-check-lg" />{i}</li>)}
                  </ul>
                </div>
              </div>
              <div className="ort-cmp-info ort-cmp-info--orange">
                <i className="bi bi-info-circle ort-cmp-info__icon" />
                <p>Neither is automatically more capable.</p>
              </div>
              <div className="ort-cmp-info ort-cmp-info--blue">
                <i className="bi bi-info-circle ort-cmp-info__icon" />
                <p>The better choice depends on the individual caravan&rsquo;s engineering and whether you value <strong>internal comfort or compact mobility</strong> more highly.</p>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* ── What Actually Makes an Off Road Caravan Different? ── */}
      <section className="ort-makes section-padding" style={{ background: "#f6f7fb" }}>
        <div className="container">
          <h2 className="ort-section-title text-center mb-2">What Actually Makes an Off Road Caravan Different?</h2>
          <p className="ort-section-subtitle text-center mb-5">Rather than judging a caravan by its marketing category, compare the components that determine how it performs.</p>
          <div className="ort-makes-grid">

            <div className="ort-makes-card">
              <div className="ort-makes-card__icon"><img src="/images/off_road_icon1.png" alt="" className="ort-makes-img-icon" /></div>
              <h3 className="ort-makes-card__title">Chassis &amp; Construction</h3>
              <p>The chassis forms the structural foundation of the caravan. Off-road caravans commonly use chassis designed to handle increased loads and repeated vibration associated with rough-road travel.</p>
              <p>When comparing caravans, consider: chassis material, dimensions, reinforcement, A-frame construction, body construction, mounting method and protection against corrosion.</p>
              <p className="ort-makes-card__note"><i className="bi bi-shield-check ort-makes-card__note-icon" />Do not assume the heaviest chassis is automatically the best. Good engineering balances structural strength with overall caravan weight.</p>
            </div>

            <div className="ort-makes-card">
              <div className="ort-makes-card__icon"><img src="/images/off_road_icon2.png" alt="" className="ort-makes-img-icon" /></div>
              <h3 className="ort-makes-card__title">Suspension</h3>
              <p>Suspension is one of the most important differences between touring and off-road caravans. Systems may include leaf springs, independent coil suspension, independent airbag suspension and trailing-arm systems.</p>
              <p>Independent suspension can provide greater wheel movement over uneven surfaces and allow each wheel to react independently.</p>
              <p className="ort-makes-card__note"><i className="bi bi-shield-check ort-makes-card__note-icon" />Suspension should never be assessed in isolation. Its rating, geometry, shock absorbers, brakes, tyres and chassis must work together.</p>
            </div>

            <div className="ort-makes-card">
              <div className="ort-makes-card__icon"><img src="/images/off_road_icon7.png" alt="" className="ort-makes-img-icon" /></div>
              <h3 className="ort-makes-card__title">Ground Clearance</h3>
              <p>Ground clearance helps protect vulnerable components when travelling over uneven terrain. Look carefully at the lowest points underneath the caravan, including water tanks, plumbing, steps, spare-wheel mounts, suspension components and stabilisers.</p>
              <p className="ort-makes-card__note"><i className="bi bi-shield-check ort-makes-card__note-icon" />A caravan may appear tall while still having vulnerable components mounted relatively low.</p>
            </div>

            <div className="ort-makes-card">
              <div className="ort-makes-card__icon"><img src="/images/off_road_icon8.png" alt="" className="ort-makes-img-icon" /></div>
              <h3 className="ort-makes-card__title">Off Road Coupling</h3>
              <p>An off-road articulation coupling is designed to allow greater movement between the caravan and tow vehicle than a conventional ball coupling. This becomes particularly important when the tow vehicle and caravan are travelling across uneven terrain at different angles.</p>
              <p className="ort-makes-card__note"><i className="bi bi-shield-check ort-makes-card__note-icon" />Check both the coupling type and its rated capacity.</p>
            </div>

            <div className="ort-makes-card">
              <div className="ort-makes-card__icon"><img src="/images/off_road_icon4.png" alt="" className="ort-makes-img-icon" /></div>
              <h3 className="ort-makes-card__title">Tyres &amp; Wheels</h3>
              <p>Off-road caravans commonly use stronger tyres with increased sidewall height and tread designed for unsealed surfaces. Check tyre load rating, wheel size, spare-wheel availability, compatibility with the tow vehicle where relevant and accessibility of replacements in remote areas.</p>
            </div>

            <div className="ort-makes-card">
              <div className="ort-makes-card__icon"><img src="/images/off_road_icon6.png" alt="" className="ort-makes-img-icon" /></div>
              <h3 className="ort-makes-card__title">Dust &amp; Water Protection</h3>
              <p>Dust ingress can become a significant issue during extended travel on dry, corrugated roads. Look for quality door and hatch seals, protected vents, pressurisation or dust-reduction systems, protected plumbing, protected water tanks and sealed electrical components.</p>
              <p className="ort-makes-card__note"><i className="bi bi-shield-check ort-makes-card__note-icon" />Water crossings require additional care because the capability and permitted use of individual caravans varies substantially.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Weight & Towing ── */}
      <section className="ort-weight section-padding">
        <div className="container">
          <h2 className="ort-section-title text-center mb-2">Compare Off Road Caravan Weight and Towing Requirements</h2>
          <p className="ort-section-subtitle text-center mb-5">Off road caravans can become considerably heavier as more equipment is added. Before choosing a caravan, understand its Tare Mass, Aggregate Trailer Mass, payload, tow-ball load and axle rating.</p>
          <div className="ort-weight-grid">

            <div className="ort-weight-card">
              <h3 className="ort-weight-card__title">What Is Aggregate Trailer Mass?</h3>
              <p><strong>Aggregate Trailer Mass (ATM)</strong> is the maximum permitted mass of the fully loaded caravan when it is not connected to the tow vehicle.</p>
              <p>Your caravan must remain within its ATM when loaded for travel.</p>
            </div>

            <div className="ort-weight-card">
              <h3 className="ort-weight-card__title">What Is Caravan Payload?</h3>
              <p>Payload is broadly the amount of weight available for your belongings and equipment after accounting for the caravan&rsquo;s base tare mass. This can be consumed quickly by water, batteries, solar upgrades, additional gas bottles, tools, generators, food, clothing, bikes and camping equipment.</p>
              <p>Remote touring often requires carrying more equipment, which makes payload particularly important when comparing off road caravans.</p>
            </div>

            <div className="ort-weight-card">
              <h3 className="ort-weight-card__title">Match the Caravan to Your Tow Vehicle</h3>
              <p>Never choose a caravan based only on the tow vehicle manufacturer&rsquo;s headline towing-capacity figure. You also need to consider the complete combination, including applicable towing capacity, tow-ball capacity, Gross Vehicle Mass, axle limits, Gross Combination Mass, caravan ATM and actual loaded weights.</p>
              <p>If you are uncertain, have the proposed vehicle and caravan combination professionally assessed before purchasing.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Off-Grid Capability ── */}
      <section className="ort-offgrid section-padding" style={{ background: "#f6f7fb" }}>
        <div className="container">
          <h2 className="ort-section-title text-center mb-2">How Much Off-Grid Capability Do You Need?</h2>
          <p className="ort-section-subtitle text-center mb-5">Being able to reach a remote campsite is only useful if your caravan can support you once you arrive.</p>
          <div className="ort-offgrid-grid">

            <div className="ort-offgrid-card">
              <div className="ort-offgrid-card__icon"><i className="bi bi-battery-charging" /></div>
              <h3 className="ort-offgrid-card__title">Battery Capacity</h3>
              <p>Lithium battery systems are becoming increasingly common in off-grid caravans. The amount of storage you need depends on the appliances you want to run and how long you expect to remain away from mains power.</p>
            </div>

            <div className="ort-offgrid-card">
              <div className="ort-offgrid-card__icon"><i className="bi bi-sun" /></div>
              <h3 className="ort-offgrid-card__title">Solar Capacity</h3>
              <p>Solar panels help replenish energy during extended stays. Consider both the total solar capacity and the charging equipment used to manage it.</p>
            </div>

            <div className="ort-offgrid-card">
              <div className="ort-offgrid-card__icon"><i className="bi bi-plug" /></div>
              <h3 className="ort-offgrid-card__title">Inverter Capacity</h3>
              <p>If you want to operate 240V appliances away from mains power, compare the inverter output and battery system required to support those appliances.</p>
            </div>

            <div className="ort-offgrid-card">
              <div className="ort-offgrid-card__icon"><i className="bi bi-droplet-half" /></div>
              <h3 className="ort-offgrid-card__title">Water Capacity</h3>
              <p>Water can become one of the most important limitations during remote touring. Compare fresh-water capacity, drinking-water storage, grey-water storage, tank protection and water monitoring.</p>
              <p>Remember that <strong>one litre of water weighs approximately one kilogram</strong>, so additional water also affects caravan payload.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Which Type to Choose ── */}
      <section className="ort-chooser section-padding">
        <div className="container">
          <h2 className="ort-section-title text-center mb-2">Which Type of Off Road Caravan Should You Choose?</h2>
          <p className="ort-section-subtitle text-center mb-5">The best off road caravan is not necessarily the caravan with the highest specification. It is the caravan that matches your <strong>actual travel plans</strong>.</p>
          <div className="ort-chooser-grid">

            <div className="ort-chooser-card" style={{ borderTopColor: "#ec7200" }}>
              <div className="ort-chooser-card__type" style={{ color: "#000000" }}>
                <Image src="/images/Full-Off-Road.png" alt="Semi Off Road" width={60} height={40} unoptimized className="ort-chooser-card__img" />
                Choose a Semi Off Road Caravan if:
              </div>
              <p>Your trips are mainly on sealed roads with occasional gravel, maintained dirt roads and accessible bush camps.</p>
              
            </div>

            <div className="ort-chooser-card" style={{ borderTopColor: "#ec7200" }}>
              <div className="ort-chooser-card__type" style={{ color: "#000000" }}>
                <Image src="/images/Full-Off-Road.png" alt="Full Off Road" width={60} height={40} unoptimized className="ort-chooser-card__img" />
                Choose a Full Off Road Caravan if:
              </div>
              <p>You expect regular travel on corrugated and rough unsealed roads and want greater durability and off-grid capability.</p>
              
            </div>

            <div className="ort-chooser-card" style={{ borderTopColor: "#ec7200" }}>
              <div className="ort-chooser-card__type" style={{ color: "#000000" }}>
                <Image src="/images/Full-Off-Road.png" alt="Extreme Off Road" width={60} height={40} unoptimized className="ort-chooser-card__img" />
                Choose an Extreme Off Road Caravan if:
              </div>
              <p>Remote and demanding touring forms a major part of your travel plans and you require substantial payload, power, water and protection.</p>
              
            </div>

            <div className="ort-chooser-card" style={{ borderTopColor: "#ec7200" }}>
              <div className="ort-chooser-card__type" style={{ color: "#000000" }}>
                <Image src="/images/Full-Off-Road.png" alt="Hybrid Off Road" width={60} height={40} unoptimized className="ort-chooser-card__img" />
                Choose a Hybrid Off Road Caravan if:
              </div>
              <p>You want strong off-road capability in a more compact package and are prepared to trade some internal living space for easier manoeuvrability.</p>
              
            </div>

          </div>
        </div>
      </section>

      {/* ── Buyer Checklist ── */}
      <section className="ort-checklist section-padding" style={{ background: "#f6f7fb" }}>
        <div className="container">
          <h2 className="ort-section-title text-center mb-2">Off Road Caravan Buyer Checklist</h2>
          <p className="ort-section-subtitle text-center mb-4">Before purchasing any caravan marketed as semi off road, full off road, extreme off road or hybrid, ask:</p>
          <div className="ort-checklist-grid">
            {[
              "What roads and terrain is the caravan specifically designed for?",
              "Are there any terrain restrictions in the warranty?",
              "What suspension system is fitted?",
              "What is the suspension rating?",
              "What is the caravan's ATM?",
              "What is the tare mass?",
              "How much usable payload is available?",
              "What is the expected tow-ball weight?",
              "What ground clearance does the caravan provide?",
              "Which components sit at the lowest point underneath?",
              "Are water tanks and plumbing protected?",
              "What off-road coupling is fitted?",
              "What tyres are fitted and what are their load ratings?",
              "How much fresh water can the caravan carry?",
              "What battery chemistry and capacity are provided?",
              "How much solar is installed?",
              "What inverter is fitted?",
              "Is a dust-reduction or pressurisation system included?",
              "How many spare wheels are supplied?",
              "Does the intended travel fall within the manufacturer's warranty conditions?",
              "Is your tow vehicle suitable when both vehicle and caravan are fully loaded?",
            ].map((q, i) => (
              <div key={i} className="ort-checklist-item">
                <span className="ort-checklist-item__num"><i className="bi bi-question-lg" /></span>
                <span className="ort-checklist-item__q">{q}</span>
              </div>
            ))}
          </div>
          <p className="ort-checklist-note">These questions are often more useful than simply asking whether a caravan is &ldquo;full off road&rdquo;.</p>
        </div>
      </section>

      {/* ── Market Snapshot ── */}
      <section className="ort-snapshot section-padding">
        <div className="container">
          <h2 className="ort-section-title text-center mb-2">Australian Off Road Caravan Market Snapshot</h2>
          <div className="ort-snapshot-grid">
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/caravan_black.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">{fmtNum(total_count) ?? "3,224+"}</span>
              <span className="ort-snapshot-label">Off Road Caravans Listed</span>
            </div>
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/caravan_black.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">{fmtNum(new_count) ?? "2,584"}</span>
              <span className="ort-snapshot-label">New Off Road Caravans</span>
            </div>
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/caravan_black.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">{fmtNum(used_count) ?? "616"}</span>
              <span className="ort-snapshot-label">Used Off Road Caravans</span>
            </div>
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/good.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">{medianAdv > 0 ? `$${medianAdv.toLocaleString()}` : "$78,500"}</span>
              <span className="ort-snapshot-label">Median Advertised Price</span>
            </div>
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/dollar_au.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">{fmtNum(new_price_median, "$") ?? "$110,900"}</span>
              <span className="ort-snapshot-label">Median New Price</span>
            </div>
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/dollar_au.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">{fmtNum(used_price_median, "$") ?? "$59,900"}</span>
              <span className="ort-snapshot-label">Median Used Price</span>
            </div>
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/ruler.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">19ft</span>
              <span className="ort-snapshot-label">Most Common Length</span>
            </div>
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/weight.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">2,500kg</span>
              <span className="ort-snapshot-label">Median ATM</span>
            </div>
            <div className="ort-snapshot-stat">
              <div className="ort-snapshot-icon"><img src="/images/double.png" alt="" className="ort-snapshot-img-icon" /></div>
              <span className="ort-snapshot-val">2–4 Berth</span>
              <span className="ort-snapshot-label">Most Common Sleeping</span>
            </div>
          </div>
          <p className="ort-snapshot-note">
            Marketplace statistics are calculated from active off road caravan advertisements on CaravansForSale.com.au. Prices represent advertised asking prices rather than confirmed final sale prices. Data is updated regularly as listings enter and leave the marketplace.
          </p>
          <div className="ort-snapshot-btns">
            <a href="/listings/new-condition/off-road-category/" className="ort-btn ort-btn--primary">Browse New Off Road Caravans <i className="bi bi-arrow-right" /></a>
            <a href="/listings/used-condition/off-road-category/" className="ort-btn ort-btn--primary">Browse Used Off Road Caravans <i className="bi bi-arrow-right" /></a>
            <a href="/listings/off-road-category/" className="ort-btn ort-btn--primary">View All Off Road Caravans for Sale <i className="bi bi-arrow-right" /></a>
          </div>
        </div>
      </section>

      {/* ── Explore More Guides ── */}
      {popularBlogs.length > 0 && (
        <section className="or-pop-guides">
          <div className="container">
            <h2 className="or-section-title">Explore More Off Road Caravan Guides</h2>
            <div className="or-pop-guides__grid">
              {popularBlogs.slice(0, 10).map((b: any) => (
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

      {/* ── FAQ ── */}
      <section className="ort-faq section-padding">
        <div className="container">
          <h2 className="ort-section-title text-center mb-4">Frequently Asked Questions</h2>
          <div className="ort-faq-grid">
            <div className="ort-faq-col">
              {FAQS.slice(0, 6).map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </div>
            <div className="ort-faq-col">
              {FAQS.slice(6).map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="ort-cta-banner">
        <div className="container">
          <div className="ort-cta-banner__card">
            <div className="ort-cta-banner__left">
              <div className="ort-cta-banner__icon-wrap">
                <div className="ort-cta-banner__icon-ring" />
                <div className="ort-cta-banner__icon-circle">
                  <img src="/images/category.svg" alt="" className="ort-cta-banner__svg-icon" />
                </div>
              </div>
              <div className="ort-cta-banner__text">
                <h2 className="ort-cta-banner__title">Ready to <span className="ort-cta-banner__title-accent">Find Your</span><br />Off Road Caravan?</h2>
                <p className="ort-cta-banner__desc">Now that you understand the different types of off road caravans, start exploring new and used caravans from dealers and private sellers across Australia.</p>
              </div>
            </div>
            <div className="ort-cta-banner__divider" />
            <div className="ort-cta-banner__btns">
              <a href="/listings/off-road-category/" className="ort-btn ort-btn--cta-outline">
                 Browse Off Road Caravans <i className="bi bi-arrow-right" />
              </a>
              <a href="/off-road-caravans/" className="ort-btn ort-btn--cta-outline">
                 Back to Off Road Caravans Hub <i className="bi bi-arrow-right" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
