"use client";

import { useRef, useEffect, useState, useCallback, type ReactNode } from "react";

interface Filters {
  keyword: string;
  type: string;
  condition: string;
  make: string;
  minPrice: string;
  maxPrice: string;
  atm: string;
  sleeps: string;
  region: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onSearch: () => void;
  onClear: () => void;
}

const CARAVAN_TYPES = [
  { name: "Family Caravan",   slug: "family-category" },
  { name: "Hybrid Caravan",   slug: "hybrid-category" },
  { name: "Luxury Caravan",   slug: "luxury-category" },
  { name: "Off Road Caravan", slug: "off-road-category" },
  { name: "Pop Top Caravan",  slug: "pop-top-category" },
  { name: "Touring Caravan",  slug: "touring-category" },
  { name: "Camper Trailer",   slug: "camper-trailer" },
  { name: "Fifth Wheeler",    slug: "fifth-wheeler" },
];

const POPULAR_MAKES = ["Jayco", "Coromal", "New Age", "Regent", "Avida", "Lotus", "Concept", "Elross", "Track Trailer", "Tvan"];

const REGIONS_VIC = [
  "Melbourne", "Geelong", "Ballarat", "Bendigo", "Gippsland",
  "Shepparton", "Mornington Peninsula", "Dandenong", "Bayswater", "Traralgon",
];

const PRICE_PRESETS = [
  { label: "Under $30k",  min: "", max: "30000" },
  { label: "Under $50k",  min: "", max: "50000" },
  { label: "Under $75k",  min: "", max: "75000" },
  { label: "Under $100k", min: "", max: "100000" },
  { label: "Over $100k",  min: "100000", max: "" },
];

const ATM_PRESETS = [
  { label: "Under 2000kg",    min: "", max: "2000" },
  { label: "2000 – 2500kg",   min: "2000", max: "2500" },
  { label: "2500 – 3000kg",   min: "2500", max: "3000" },
  { label: "Over 3000kg",     min: "3000", max: "" },
];

const SLEEP_PRESETS = [
  { label: "2 Berth",        val: "2" },
  { label: "3 – 4 Berth",    val: "3-4" },
  { label: "5 – 6 Berth",    val: "5-6" },
  { label: "7+ Berth",       val: "7+" },
];


type ModalSection = "all" | "type" | "condition" | "make" | "price" | "atm" | "sleeps" | "region" | null;

export default function StateSearch({ filters, onChange, onSearch, onClear }: Props) {
  const [openModal, setOpenModal] = useState<ModalSection>(null);

  // Temp state (uncommitted until "Search" clicked in modal)
  const [tempType,     setTempType]     = useState(filters.type);
  const [tempCond,     setTempCond]     = useState(filters.condition);
  const [tempMake,     setTempMake]     = useState(filters.make);
  const [tempMinPrice, setTempMinPrice] = useState(filters.minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(filters.maxPrice);
  const [tempAtmMin,   setTempAtmMin]   = useState("");
  const [tempAtmMax,   setTempAtmMax]   = useState("");
  const [tempSleeps,   setTempSleeps]   = useState(filters.sleeps);
  const [tempRegion,   setTempRegion]   = useState(filters.region);
  const [makeSearch,   setMakeSearch]   = useState("");

  // Sync temp state when modal opens
  const openSection = useCallback((s: ModalSection) => {
    setTempType(filters.type);
    setTempCond(filters.condition);
    setTempMake(filters.make);
    setTempMinPrice(filters.minPrice);
    setTempMaxPrice(filters.maxPrice);
    setTempSleeps(filters.sleeps);
    setTempRegion(filters.region);
    setMakeSearch("");
    setOpenModal(s);
  }, [filters]);

  const closeModal = () => setOpenModal(null);

  const commitAndSearch = (patch: Partial<Filters>) => {
    onChange({ ...filters, ...patch });
    onSearch();
    closeModal();
  };

  // Per-section commit
  const applyType     = () => commitAndSearch({ type: tempType });
  const applyCond     = () => commitAndSearch({ condition: tempCond });
  const applyMake     = () => commitAndSearch({ make: tempMake });
  const applyPrice    = () => commitAndSearch({ minPrice: tempMinPrice, maxPrice: tempMaxPrice });
  const applyAtm      = () => commitAndSearch({ atm: `${tempAtmMin}-${tempAtmMax}` });
  const applySleeps   = () => commitAndSearch({ sleeps: tempSleeps });
  const applyRegion   = () => commitAndSearch({ region: tempRegion });

  const applyAll = () => {
    commitAndSearch({
      type: tempType,
      condition: tempCond,
      make: tempMake,
      minPrice: tempMinPrice,
      maxPrice: tempMaxPrice,
      sleeps: tempSleeps,
      region: tempRegion,
    });
  };

  // Detect active filters for chip indicators
  const activeType    = filters.type !== "All Types";
  const activeCond    = filters.condition !== "All Conditions";
  const activeMake    = !!filters.make;
  const activePrice   = !!(filters.minPrice || filters.maxPrice);
  const activeAtm     = filters.atm !== "Any ATM";
  const activeSleeps  = filters.sleeps !== "Any Sleeps";
  const activeRegion  = filters.region !== "All Regions";
  const totalActive   = [activeType, activeCond, activeMake, activePrice, activeAtm, activeSleeps, activeRegion].filter(Boolean).length;

  // Close on overlay click
  const overlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = openModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openModal]);

  // ── Section components (reusable inside modal) ──
  const TypeSection = (
    <div className="filter-item">
      <h4 className="filter-section-title">Caravan Type</h4>
      <ul className="loc-state-list">
        {CARAVAN_TYPES.map((cat) => (
          <li key={cat.slug} className="loc-state-item"
            onClick={() => setTempType(tempType === cat.slug ? "All Types" : cat.slug)}>
            <span className={`loc-checkbox${tempType === cat.slug ? " checked" : ""}`}>
              {tempType === cat.slug && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }} />}
            </span>
            <span className="loc-state-name">{cat.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const CondSection = (
    <div className="filter-item">
      <h4 className="filter-section-title">Condition</h4>
      <ul className="loc-state-list">
        {["New", "Used"].map((c) => (
          <li key={c} className="loc-state-item"
            onClick={() => setTempCond(tempCond === c ? "All Conditions" : c)}>
            <span className={`loc-checkbox${tempCond === c ? " checked" : ""}`}>
              {tempCond === c && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }} />}
            </span>
            <span className="loc-state-name">{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const MakeSection = (
    <div className="filter-item">
      <h4 className="filter-section-title">Make / Brand</h4>
      <div className="loc-search-wrap" style={{ marginBottom: 12 }}>
        <div style={{ position: "relative" }}>
          <i className="bi bi-search loc-search-icon" />
          <input className="loc-search-input" placeholder="Search make or brand…"
            value={makeSearch} onChange={(e) => { setMakeSearch(e.target.value); setTempMake(e.target.value); }} autoComplete="off" />
        </div>
      </div>
      <ul className="loc-state-list">
        {POPULAR_MAKES.filter((m) => !makeSearch || m.toLowerCase().includes(makeSearch.toLowerCase())).map((m) => (
          <li key={m} className="loc-state-item"
            onClick={() => { setTempMake(tempMake === m ? "" : m); setMakeSearch(""); }}>
            <span className={`loc-checkbox${tempMake === m ? " checked" : ""}`}>
              {tempMake === m && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }} />}
            </span>
            <span className="loc-state-name">{m}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const PriceSection = (
    <div className="filter-item">
      <h4 className="filter-section-title">Price Range</h4>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input className="loc-search-input" placeholder="Min Price ($)" value={tempMinPrice}
          onChange={(e) => setTempMinPrice(e.target.value)} style={{ flex: 1 }} />
        <span style={{ alignSelf: "center", color: "#888" }}>to</span>
        <input className="loc-search-input" placeholder="Max Price ($)" value={tempMaxPrice}
          onChange={(e) => setTempMaxPrice(e.target.value)} style={{ flex: 1 }} />
      </div>
      <ul className="loc-state-list">
        {PRICE_PRESETS.map((p) => {
          const sel = tempMinPrice === p.min && tempMaxPrice === p.max;
          return (
            <li key={p.label} className="loc-state-item"
              onClick={() => { setTempMinPrice(sel ? "" : p.min); setTempMaxPrice(sel ? "" : p.max); }}>
              <span className={`loc-checkbox${sel ? " checked" : ""}`}>
                {sel && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }} />}
              </span>
              <span className="loc-state-name">{p.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const AtmSection = (
    <div className="filter-item">
      <h4 className="filter-section-title">Weight (ATM)</h4>
      <ul className="loc-state-list">
        {ATM_PRESETS.map((a) => {
          const sel = `${tempAtmMin}-${tempAtmMax}` === `${a.min}-${a.max}`;
          return (
            <li key={a.label} className="loc-state-item"
              onClick={() => { setTempAtmMin(sel ? "" : a.min); setTempAtmMax(sel ? "" : a.max); }}>
              <span className={`loc-checkbox${sel ? " checked" : ""}`}>
                {sel && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }} />}
              </span>
              <span className="loc-state-name">{a.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const SleepsSection = (
    <div className="filter-item">
      <h4 className="filter-section-title">Sleeping Capacity</h4>
      <ul className="loc-state-list">
        {SLEEP_PRESETS.map((s) => (
          <li key={s.val} className="loc-state-item"
            onClick={() => setTempSleeps(tempSleeps === s.val ? "Any Sleeps" : s.val)}>
            <span className={`loc-checkbox${tempSleeps === s.val ? " checked" : ""}`}>
              {tempSleeps === s.val && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }} />}
            </span>
            <span className="loc-state-name">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const RegionSection = (
    <div className="filter-item">
      <h4 className="filter-section-title">Region in Victoria</h4>
      <ul className="loc-state-list">
        {REGIONS_VIC.map((r) => (
          <li key={r} className="loc-state-item"
            onClick={() => setTempRegion(tempRegion === r ? "All Regions" : r)}>
            <span className={`loc-checkbox${tempRegion === r ? " checked" : ""}`}>
              {tempRegion === r && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }} />}
            </span>
            <span className="loc-state-name">{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  // Helper: render a standalone modal
  function Modal({
    title, onClear, onApply, clearDisabled, children,
  }: {
    title: string;
    onClear: () => void;
    onApply: () => void;
    clearDisabled?: boolean;
    children: ReactNode;
  }) {
    return (
      <div className="filter-overlay" onClick={overlayClick}>
        <div className="filter-modal">
          <div className="filter-header">
            <h3>{title}</h3>
            <button className="filter-close" onClick={closeModal}>×</button>
          </div>
          <div className="filter-body">{children}</div>
          <div className="filter-footer">
            <button className="clear" onClick={onClear}
              style={{ opacity: clearDisabled ? 0.4 : 1, cursor: clearDisabled ? "not-allowed" : "pointer" }}>
              Clear filters
            </button>
            <button className="search active" onClick={onApply}>Search</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Filter bar ── */}
      <div className="search-bar lsd-state-search-bar">
        <div className="container">
          <div className="search_flex">
            {/* Orange Filters button */}
            <div className="filter_btn_top">
              <button className="filter-btn tag" onClick={() => openSection("all")}>
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                </span>
                Filters
                {totalActive > 0 && (
                  <span style={{
                    background: "#ec7200", color: "#fff", borderRadius: "50%",
                    width: 18, height: 18, fontSize: 11, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>{totalActive}</span>
                )}
              </button>
            </div>

            {/* Pill chips — same order as existing site */}
            <div className="filter-row">
              <div className="slider-wrapper">
                <div className="filter-swiper">
                  <button className={`tag${activeType ? " active" : ""}`} onClick={() => openSection("type")}>
                    {activeType ? CARAVAN_TYPES.find((t) => t.slug === filters.type)?.name ?? "Caravan Type" : "Caravan Type"}
                    {activeType && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>
                  <button className={`tag${activeRegion ? " active" : ""}`} onClick={() => openSection("region")}>
                    {activeRegion ? `Victoria · ${filters.region}` : "Location"}
                    {activeRegion && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>
                  <button className={`tag${activeCond ? " active" : ""}`} onClick={() => openSection("condition")}>
                    {activeCond ? filters.condition : "Condition"}
                    {activeCond && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>
                  <button className={`tag${activeMake ? " active" : ""}`} onClick={() => openSection("make")}>
                    {activeMake ? filters.make : "Make"}
                    {activeMake && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>
                  <button className={`tag${activePrice ? " active" : ""}`} onClick={() => openSection("price")}>
                    {activePrice
                      ? filters.minPrice && filters.maxPrice
                        ? `$${Number(filters.minPrice).toLocaleString()} – $${Number(filters.maxPrice).toLocaleString()}`
                        : filters.minPrice ? `From $${Number(filters.minPrice).toLocaleString()}` : `Up to $${Number(filters.maxPrice).toLocaleString()}`
                      : "Price"}
                    {activePrice && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>
                  <button className={`tag${activeAtm ? " active" : ""}`} onClick={() => openSection("atm")}>
                    {activeAtm ? filters.atm : "ATM"}
                    {activeAtm && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>
                  <button className={`tag${activeSleeps ? " active" : ""}`} onClick={() => openSection("sleeps")}>
                    {activeSleeps ? filters.sleeps : "Sleeps"}
                    {activeSleeps && <span className="active_filter"><i className="bi bi-circle-fill" /></span>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active chips row */}
          {totalActive > 0 && (
            <div className="active-chips-row">
              {activeType && (
                <span className="active-chip">
                  <span className="chip-label" onClick={() => openSection("type")}>
                    {CARAVAN_TYPES.find((t) => t.slug === filters.type)?.name ?? filters.type}
                  </span>
                  <span className="chip-close" onClick={() => { onChange({ ...filters, type: "All Types" }); onSearch(); }}>×</span>
                </span>
              )}
              {activeRegion && (
                <span className="active-chip">
                  <span className="chip-label" onClick={() => openSection("region")}>{filters.region} (VIC)</span>
                  <span className="chip-close" onClick={() => { onChange({ ...filters, region: "All Regions" }); onSearch(); }}>×</span>
                </span>
              )}
              {activeCond && (
                <span className="active-chip">
                  <span className="chip-label" onClick={() => openSection("condition")}>{filters.condition}</span>
                  <span className="chip-close" onClick={() => { onChange({ ...filters, condition: "All Conditions" }); onSearch(); }}>×</span>
                </span>
              )}
              {activeMake && (
                <span className="active-chip">
                  <span className="chip-label" onClick={() => openSection("make")}>{filters.make}</span>
                  <span className="chip-close" onClick={() => { onChange({ ...filters, make: "" }); onSearch(); }}>×</span>
                </span>
              )}
              {activePrice && (
                <span className="active-chip">
                  <span className="chip-label" onClick={() => openSection("price")}>
                    {filters.minPrice && filters.maxPrice
                      ? `$${Number(filters.minPrice).toLocaleString()} – $${Number(filters.maxPrice).toLocaleString()}`
                      : filters.minPrice ? `From $${Number(filters.minPrice).toLocaleString()}` : `Up to $${Number(filters.maxPrice).toLocaleString()}`}
                  </span>
                  <span className="chip-close" onClick={() => { onChange({ ...filters, minPrice: "", maxPrice: "" }); onSearch(); }}>×</span>
                </span>
              )}
              {activeAtm && (
                <span className="active-chip">
                  <span className="chip-label" onClick={() => openSection("atm")}>{filters.atm}</span>
                  <span className="chip-close" onClick={() => { onChange({ ...filters, atm: "Any ATM" }); onSearch(); }}>×</span>
                </span>
              )}
              {activeSleeps && (
                <span className="active-chip">
                  <span className="chip-label" onClick={() => openSection("sleeps")}>{filters.sleeps}</span>
                  <span className="chip-close" onClick={() => { onChange({ ...filters, sleeps: "Any Sleeps" }); onSearch(); }}>×</span>
                </span>
              )}
              {activeRegion && (
                <span className="active-chip">
                  <span className="chip-label" onClick={() => openSection("region")}>{filters.region} (VIC)</span>
                  <span className="chip-close" onClick={() => { onChange({ ...filters, region: "All Regions" }); onSearch(); }}>×</span>
                </span>
              )}
              <button className="chip-clear-all" onClick={onClear}>Clear all</button>
            </div>
          )}

        </div>
      </div>

      {/* ── Modals ── */}

      {/* Combined "All Filters" modal */}
      {openModal === "all" && (
        <Modal title="Filters"
          onClear={() => { setTempType("All Types"); setTempCond("All Conditions"); setTempMake(""); setTempMinPrice(""); setTempMaxPrice(""); setTempAtmMin(""); setTempAtmMax(""); setTempSleeps("Any Sleeps"); setTempRegion("All Regions"); }}
          onApply={applyAll}
          clearDisabled={false}>
          {TypeSection}
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />
          {CondSection}
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />
          {MakeSection}
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />
          {PriceSection}
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />
          {AtmSection}
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />
          {SleepsSection}
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />
          {RegionSection}
        </Modal>
      )}

      {openModal === "type"      && <Modal title="Caravan Type" onClear={() => setTempType("All Types")}        onApply={applyType}    clearDisabled={tempType === "All Types"}>{TypeSection}</Modal>}
      {openModal === "condition" && <Modal title="Condition"    onClear={() => setTempCond("All Conditions")}   onApply={applyCond}    clearDisabled={tempCond === "All Conditions"}>{CondSection}</Modal>}
      {openModal === "make"      && <Modal title="Make"         onClear={() => setTempMake("")}                 onApply={applyMake}    clearDisabled={!tempMake}>{MakeSection}</Modal>}
      {openModal === "price"     && <Modal title="Price"        onClear={() => { setTempMinPrice(""); setTempMaxPrice(""); }} onApply={applyPrice} clearDisabled={!tempMinPrice && !tempMaxPrice}>{PriceSection}</Modal>}
      {openModal === "atm"       && <Modal title="ATM Weight"   onClear={() => { setTempAtmMin(""); setTempAtmMax(""); }}    onApply={applyAtm}   clearDisabled={!tempAtmMin && !tempAtmMax}>{AtmSection}</Modal>}
      {openModal === "sleeps"    && <Modal title="Sleeping Capacity" onClear={() => setTempSleeps("Any Sleeps")} onApply={applySleeps} clearDisabled={tempSleeps === "Any Sleeps"}>{SleepsSection}</Modal>}
      {openModal === "region"    && <Modal title="Region"       onClear={() => setTempRegion("All Regions")}    onApply={applyRegion}  clearDisabled={tempRegion === "All Regions"}>{RegionSection}</Modal>}
    </>
  );
}
