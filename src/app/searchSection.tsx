
  // src/app/components/SearchSection.tsx
  "use client";
  import React, { useEffect, useRef, useState } from "react";
  import Image from "next/image";
  import { Swiper, SwiperSlide } from "swiper/react";
  import { Navigation } from "swiper/modules";
  import "swiper/css";
  import "swiper/css/navigation";
  import {
    fetchHomeSearchList, // GET /home_search (base list)
    fetchKeywordSuggestions, // GET /home_search/?keyword=<q> (typed list)
  } from "@/api/homeSearch/api";
  import { fetchSleepBands } from "@/api/homeApi/sleep/api";
  import { fetchRegion } from "@/api/homeApi/region/api";
  import { fetchManufactures } from "@/api/homeApi/manufacture/api";
  import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
  import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
  import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
  import { fetchUsedCaravansList } from "@/api/homeApi/usedCaravanList/api";
  import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
  import TabCardSkeleton from "./components/TabCardSkeleton";
  import CaravansByStateSkeleton from "./components/Caravansbystateskeleton";
  import SearchSuggestionSkeleton from "./components/Searchsuggestionskeleton ";
  import { useBanners } from "@/components/BannerHandler";
  import { useBannerTracking } from "@/hooks/useBannerTracking";
  import PostRequirement from "./postRequirement";
  import { fetchRequirements, Requirement } from "@/api/postRquirements/api";

  interface TabsItem {
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

  type TabCard = {
    title: string;
    sub: string;
    url: string;
  };

  type Item = {
    title?: string;
    name?: string;
    heading?: string;
    make?: string;
    url?: string;
    model?: string;
    variant?: string;
    slug?: string | number;
    id?: string | number;
    label?: string;
  } & Record<string, unknown>;


  interface SearchSectionProps {
    requirements: Requirement[];
    sleepBands: TabsItem[];
    regionBands: TabsItem[];
    manufactureBands: TabsItem[];
    atmBands: TabsItem[];
    lengthBands: TabsItem[];
    priceBands: TabsItem[];
    usedData: {
      by_category: TabsItem[];
      by_state: TabsItem[];
      by_region: TabsItem[];
    };
    stateBands: TabsItem[];
  }
  export default function SearchSection({
    requirements,
    sleepBands = [],
    regionBands = [],
    manufactureBands = [],
    atmBands = [],
    lengthBands = [],
    priceBands = [],
    usedData = { by_category: [], by_state: [], by_region: [] },
    stateBands = [],
  }: SearchSectionProps) {
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Item[]>([]);
    const [baseSuggestions, setBaseSuggestions] = useState<Item[]>([]); // list for first-click
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [conditionValue, setConditionValue] = useState("");
  const stateBandsLoading = stateBands.length === 0;
    const isSearchEnabled = category || location || conditionValue;
    const [activeIndex, setActiveIndex] = useState(0);

    const stateMeta = {
      victoria: { code: "VIC", image: "/images/vic_map.svg" },
      "new-south-wales": { code: "NSW", image: "/images/nsw_map.svg" },
      queensland: { code: "QLD", image: "/images/qld_map.svg" },
      "south-australia": { code: "SA", image: "/images/sa_map.svg" },
      "western-australia": { code: "WA", image: "/images/wa_map.svg" },
      tasmania: { code: "TAS", image: "/images/tas_map.svg" },
    };

    const [usedCategoryList, setUsedCategoryList] = useState<TabsItem[]>([]);
    const [usedState, setUsedState] = useState<TabsItem[]>([]);
    const [usedRegion, setUsedRegion] = useState<TabsItem[]>([]);
  
    

    const tabsData: {
      key: string;
      label: string;
      cards: TabCard[];
    }[] = [
        {
          key: "Region",
          label: "Location",
          cards: regionBands.map((item) => ({
            title: "Caravans for Sale in " + item.region,
            sub: `${item.caravan_count ?? 0}`,
            url: `/listings/${item.permalink}`,
          })),
        },
        {
          key: "price",
          label: "Price",
          cards: priceBands.map((item) => ({
            title: "Caravans for Sale " + item.short_label,
            sub: `${item.caravan_count ?? 0}`,
            url: `/listings/${item.permalink}`,
          })),
        },
        {
          key: "Weight",
          label: "Weight",
          cards: atmBands.map((item) => ({
            title: "Caravans for Sale " + item.short_label,
            sub: `${item.caravan_count ?? 0}`,
            url: `/listings/${item.permalink}`,
          })),
        },
        {
          key: "Sleep",
          label: "Sleep",
          cards: sleepBands.map((item) => ({
            title: "Caravans for Sale " + item.short_label,
            sub: `${item.caravan_count ?? 0}`,
            url: `/listings/${item.permalink}`,
          })),
        },
        {
          key: "Length",
          label: "Length",
          cards: lengthBands.map((item) => ({
            title: "Caravans for Sale " + item.short_label,
            sub: `${item.caravan_count ?? 0}`,
            url: `/listings/${item.permalink}`,
          })),
        },
        // {
        //   key: "Used",
        //   label: "Used",
        //   cards: usedCategoryList.map((item) => ({
        //     title: item.short_label,
        //     sub: item.short_count,
        //     url: `/listings/${item.permalink}`,
        //   })),
        // },
        {
          key: "Manufacturer",
          label: "Manufacturer",
          cards: manufactureBands.map((item) => ({
            title: item.short_label + " Caravans for Sale",
            sub: `${item.caravan_count ?? 0}`,
            url: `/listings/${item.permalink}`,
          })),
        },
      ];

    const [activeTab, setActiveTab] = useState(tabsData[0].key);
    const currentTab = tabsData.find((t) => t.key === activeTab);

    const flips = [
      {
        type: "Off Road",
        budget: "$90,000",
        msg: "Queen, ensuite, ample power, ample water and grey water, 19 foot, rear door, 600 kg plus payload, tare <2800, atm 3500",
      },
      {
        type: "Off Road",
        budget: "$85,000",
        msg: "Couples van, approx 19ft tandem axel, tare approx 2200kg. Atm up to 3300kg. Full time touring, off grid essentials.",
      },
      {
        type: "Hybrid",
        budget: "$50,000",
        msg: "Island Bed, Compressor fridge, ensuite, Hot Water heater, Solar, 2 x freshwater tanks, 1 x grey, awning.",
      },
      {
        type: "Family",
        budget: "$75,000",
        msg: "Tare weight 2200 or less, bunks, semi off road, off grid. Max solar, 3000w inverter, lithium batteries.",
      },
      {
        type: "Luxury",
        budget: "$100,000",
        msg: "Slide out van under 3500kg. Suitable for Ford Ranger Next Gen. 2–3 beds preferred.",
      },
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % flips.length);
      }, 4000);

      return () => clearInterval(interval);
    }, []);

    const handleSearch = () => {
      if (!category && !location && !conditionValue) {
        alert("Select at least one filter");
        return;
      }
      if (conditionValue === "All") {
        window.location.href = "/listings";
        return;
      }
      const parts: string[] = [];

      // 1️⃣ Condition always first
      if (conditionValue && conditionValue !== "All") {
        const conditionSlug =
          conditionValue.toLowerCase().replace(/\s+/g, "-") + "-condition";
        parts.push(conditionSlug);
      }
      // 2️⃣ Category always second
      if (category) {
        const catSlug = category.toLowerCase().replace(/\s+/g, "-") + "-category";
        parts.push(catSlug);
      }

      // 3️⃣ State always last
      if (location) {
        const stateSlug = location.toLowerCase().replace(/\s+/g, "-") + "-state";
        parts.push(stateSlug);
      }

      const finalUrl = `/listings/${parts.join("/")}`;
      window.location.href = finalUrl;
    };

    const navigateBySelect = (value: string, suffix: string) => {
      if (!value) return;

      const slug = value.toLowerCase().replace(/\s+/g, "-") + suffix;
      window.location.href = `/listings/${slug}`;
    };


    // ------------- base list (first click) -------------
    const loadBaseOnce = async () => {
      if (baseSuggestions.length) {
        setSuggestions(baseSuggestions);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const data = await fetchHomeSearchList();

        const labels: Item[] = data.map((x) => ({
          id: x.id,
          label: (x.name ?? "").toString().trim(),
          url: (x.url ?? "").toString(),
        }));

        setBaseSuggestions(labels);
        setSuggestions(labels);
      } catch {
        setBaseSuggestions([]);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const showSuggestions = async () => {
      setIsSuggestionBoxOpen(true);
      if (!query.trim()) {
        await loadBaseOnce();
      }
    };

    const closeSuggestions = () => setIsSuggestionBoxOpen(false);
    const isTabsLoading = tabsData.every((t) => t.cards.length === 0);

    // ------------- typed suggestions (≥ 3 chars) -------------
    useEffect(() => {
      const controller = new AbortController();

      if (query.length >= 3) {
        setLoading(true);
        setError("");
        const t = setTimeout(async () => {
          try {
            const list = await fetchKeywordSuggestions(query, controller.signal);
            // Normalize into Item[]
            const uniq: Item[] = Array.from(
              new Map(
                list.map((x, idx: number) => [
                  (x.keyword || "").toString().trim(),
                  {
                    id: x.id ?? idx, // fallback id
                    label: (x.keyword || "").toString().trim(), // ✅ always set label
                    url: (x.url || "").toString(),
                  },
                ]),
              ).values(),
            );

            setSuggestions(uniq);
          } catch (e: unknown) {
            if (e instanceof DOMException && e.name === "AbortError") return;
            setError(e instanceof Error ? e.message : "Failed");
          } finally {
            setLoading(false);
          }
        }, 300);

        return () => {
          controller.abort();
          clearTimeout(t);
        };
      } else {
        setSuggestions(baseSuggestions);
        setLoading(false);
        return () => controller.abort();
      }
    }, [query, baseSuggestions]);

    const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      setQuery(e.target.value);
      if (!isSuggestionBoxOpen) setIsSuggestionBoxOpen(true);
    };

    useEffect(() => {
      // dynamically import bootstrap JS only in the browser
      if (typeof window === "undefined") return;
      import("bootstrap/dist/js/bootstrap.bundle.min.js").catch((err) =>
        console.error("Failed to load bootstrap JS", err),
      );
    }, []);
    //   const navigateWithKeyword = (kwRaw: string) => {
    //     const kw = kwRaw.trim();
    //     if (!kw) return;
    //     // Put value in input for UX
    //     if (searchInputRef.current) searchInputRef.current.value = kw;
    //     // Navigate: /listings/?keyword=<kw>
    //     router.push(`/listings/?keyword=${encodeURIComponent(kw)}`);
    //     // Optional: close dropdown
    //     setIsSuggestionBoxOpen(false);
    //   };
    // ------------- navigate helper (two routes) -------------
    const navigateWithKeyword = (s: Item) => {
      const human = s.label?.trim();
      if (!human) return;

      setQuery(human);
      setIsSuggestionBoxOpen(false);

      if (s.url && s.url.trim().length > 0) {
        window.location.href = s.url;
      } else {
        const slug = human
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        window.location.href = `/listings/${slug}-search`;
      }
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
      if (e.key === "Enter") {
        const kw = (e.currentTarget as HTMLInputElement).value.trim();
        if (kw) {
          navigateWithKeyword({ label: kw });
        }
      }
      if (e.key === "Escape") closeSuggestions();
    };

    const showingFromKeywordApi = query.length >= 3;

    const { matchedBanners, isMobile, currentHomeBannerIndex, isLoading  } = useBanners();
    const { bannerRefs, trackClick } = useBannerTracking(matchedBanners);
    const homeBanners = matchedBanners.filter(b => b.placement === "home");
    const activeBanner =
    homeBanners.length > 0
      ? homeBanners[currentHomeBannerIndex % homeBanners.length]
      : null;

const BANNER_ENABLED = false;


    return (
      <div>
        {/* <div className="ad_banner">
    {isLoading ? (
      // ✅ Nothing renders during fetch — no fallback flash
      <div style={{ width: "100%", aspectRatio: "20/7", background: "#f0f0f0" }} />
    ) : activeBanner ? (
        <a
          key={activeBanner.id}
        ref={(el) => { bannerRefs.current[0] = el; }}
          href={activeBanner.target_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick(activeBanner.id)}
        >
          <div className="item-image">
                      {activeBanner.name}

            <Image
              src={activeBanner.image_url}
              alt={activeBanner.name}
              width={isMobile ? 600 : 2000}
              height={isMobile ? 300 : 700}
              // ✅ mobile banner → hidden-lg hidden-md hidden-sm (mobile-ல் மட்டும் காட்டு)
              // ✅ desktop banner → hidden-xs (desktop-ல் மட்டும் காட்டு)
              className={activeBanner.device_target === "mobile" ? "hidden-lg hidden-md hidden-sm" : "hidden-xs"}
              style={{ width: "100%", height: "auto" }}
              priority
            />
          </div>
        </a>
    
    ) : (
      // Fallback static
      <a href="https://www.caravansforsale.com.au/listings/">
        <div className="item-image">
          <Image
            src="/images/banner_top_dk.webp"
            className="hidden-xs"
            alt="off-road"
            width={2000}
            height={700}
            style={{ width: "100%", height: "auto" }}
            unoptimized
          />
          <Image
            src="/images/banner_top_mb.webp"
            className="hidden-lg hidden-md hidden-sm"
            alt="off-road"
            width={2000}
            height={700}
            style={{ width: "100%", height: "auto" }}
            unoptimized
          />
        </div>
      </a>
    )}
  </div> */}
<div className="ad_banner">
  {BANNER_ENABLED && !isLoading && activeBanner ? (
    <a
      key={activeBanner.id}
      ref={(el) => { bannerRefs.current[0] = el; }}
      href={activeBanner.target_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClick(activeBanner.id)}
    >
      <div className="item-image">
        <Image
          src={activeBanner.image_url}
          alt={activeBanner.name}
          width={isMobile ? 600 : 2000}
          height={isMobile ? 300 : 700}
          sizes="100vw"
          className={activeBanner.device_target === "mobile" ? "hidden-lg hidden-md hidden-sm" : "hidden-xs"}
          style={{ width: "100%", height: "auto" }}
          priority
        />
      </div>
    </a>
  ) : (
    // ✅ BANNER_ENABLED=false ஆனாலும் fallback எப்பவும் காட்டும்
    
      <div className="item-image">
        <Image
          src="/images/banner_top_dk.webp"
          className="hidden-xs"
          alt="Browse caravans for sale"
          width={2000}
          height={700}
          sizes="(max-width: 767px) 1px, 100vw"
          style={{ width: "100%", height: "auto" }}
          priority
          fetchPriority="high"
        />
        <Image
          src="/images/banner_top_mb.webp"
          className="hidden-lg hidden-md hidden-sm"
          alt="Browse caravans for sale"
          width={600}
          height={300}
          sizes="(max-width: 767px) 100vw, 1px"
          style={{ width: "100%", height: "auto" }}
          priority
          fetchPriority="high"
        />
      </div>
    
  )}
</div>
        <div className="search_requirement_area">
          <div className="container">
            <div className="row align-items-center justify-content-start">
              <div className="col-lg-12">
                <div className="section-head search_home">
                  <h1 className="divide-orange">
                    Browse New &amp; Used Caravans For Sale
                  </h1>
                  <p>
                    Find your ideal caravan from thousands of new and used listings
                    across Australia’s top brands, dealers, and private sellers.

                  </p>

                  {/* Bootstrap Pills Navigation */}
                  <ul className="nav nav-pills" id="pills-tab" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link active"
                        id="pills-find-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#pills-find"
                        type="button"
                        role="tab"
                        aria-controls="pills-find"
                        aria-selected="true"
                      >
                        <span>Caravan Listings by Type</span>
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link"
                        id="pills-smart-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#pills-smart"
                        type="button"
                        role="tab"
                        aria-controls="pills-smart"
                        aria-selected="false"
                      >
                        <span>Smart Search</span>
                      </button>
                    </li>
                  </ul>

                  {/* Bootstrap Tab Content */}
                  <div className="tab-content" id="pills-tabContent">
                    {/* --- Tab 1 --- */}
                    <div
                      className="tab-pane fade show active"
                      id="pills-find"
                      role="tabpanel"
                      aria-labelledby="pills-find-tab"
                    >
                      <div className="content-info text-center pb-0">
                        <ul className="category_icon list-unstyled d-flex justify-content-start">
                          <li>
                            <a href="/listings/off-road-category/">
                              <div className="item-image">
                                <Image
                                  src="/images/off-road.webp"
                                  alt="off-road"
                                  width={80}
                                  height={80}
                                                    />
                              </div>
                              <span>Off Road</span>
                            </a>
                          </li>

                          <li>
                            <a href="/listings/hybrid-category/">
                              <div className="item-image">
                                <Image
                                  src="/images/hybrid.webp"
                                  alt="hybrid"
                                  width={80}
                                  height={80}
                                                    />
                              </div>
                              <span>Hybrid</span>
                            </a>
                          </li>

                          <li>
                            <a href="/listings/pop-top-category/">
                              <div className="item-image">
                                <Image
                                  src="/images/pop-top.webp"
                                  alt="pop-top"
                                  width={80}
                                  height={80}
                                                    />
                              </div>
                              <span>Pop Top</span>
                            </a>
                          </li>

                          <li>
                            <a href="/listings/luxury-category/">
                              <div className="item-image">
                                <Image
                                  src="/images/luxury.webp"
                                  alt="luxury"
                                  width={80}
                                  height={80}
                                                    />
                              </div>
                              <span>Luxury</span>
                            </a>
                          </li>

                          <li>
                            <a href="/listings/family-category/">
                              <div className="item-image">
                                <Image
                                  src="/images/family.webp"
                                  alt="family"
                                  width={80}
                                  height={80}
                                                    />
                              </div>
                              <span>Family</span>
                            </a>
                          </li>

                          <li>
                            <a href="/listings/touring-category/">
                              <div className="item-image">
                                <Image
                                  src="/images/touring.webp"
                                  alt="touring"
                                  width={80}
                                  height={80}
                                                    />
                              </div>
                              <span>Touring</span>
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* --- Tab 2 --- */}
                    <div
                      className="tab-pane fade"
                      id="pills-smart"
                      role="tabpanel"
                      aria-labelledby="pills-smart-tab"
                    >
                      <div className="content-info pb-0">
                        {/* overlay to close */}
                        <div
                          className="overlay_search"
                          style={{
                            display: isSuggestionBoxOpen ? "block" : "none",
                          }}
                          onClick={closeSuggestions}
                        />

                        {/* search box */}
                        <div className="search-container">
                          <div className="search-wrapper">
                            <i className="bi bi-search search-icon" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              className="search-box"
                              placeholder="Try 'caravans with bunks'"
                              id="searchInput"
                              autoComplete="off"
                              value={query}
                              onChange={handleInputChange}
                              onFocus={showSuggestions}
                              onClick={showSuggestions}
                              onKeyDown={handleKeyDown}
                              aria-haspopup="listbox"
                              aria-expanded={isSuggestionBoxOpen}
                            />
                            <div
                              className="close-btn"
                              style={{
                                display: isSuggestionBoxOpen ? "block" : "none",
                              }}
                              onClick={closeSuggestions}
                              role="button"
                              aria-label="Close suggestions"
                            >
                              <i className="bi bi-x-lg" />
                            </div>
                          </div>

                          {/* dropdown */}
                          <div
                            className="suggestions"
                            style={{
                              display: isSuggestionBoxOpen ? "block" : "none",
                              maxHeight: "300px", // ← scroll height limit
                              overflowY: "auto", // ← enables scrolling
                            }}
                            role="listbox"
                          >
                            {!loading && <h4>
                              {showingFromKeywordApi
                                ? "Suggested searches"
                                : "Popular searches"}
                            </h4>}

                            {error && <p className="text-red-600">{error}</p>}

                            {!error && loading && (
                              <SearchSuggestionSkeleton
                                count={6}
                                label={
                                  showingFromKeywordApi
                                    ? "Suggested searches"
                                    : "Popular searches"
                                }
                              />
                            )}
                            {!error && !loading && (
                              <ul className="text-left" id="suggestionList">
                                {suggestions?.length ? (
                                  suggestions.map((s, idx) => (
                                    <li
                                      key={`${s.label}-${idx}`}
                                      onPointerDown={(e) => {
                                        e.preventDefault();
                                        navigateWithKeyword(s);
                                      }}
                                      style={{ cursor: "pointer" }}
                                      role="option"
                                      aria-selected="false"
                                    >
                                      {s.label}
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-muted">No matches</li>
                                )}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>





                </div>
              </div>
            </div>
            <div className="explore-boxes">
              {/* Box 1 */}
              <div className="explore-box active">
                <h3>See New Caravan Listings</h3>
                <p>
                  Browse the latest new caravans from top dealerships in Australia.
                </p>
                <a href="/listings/new-condition/" className="btn btn-primary">
                  Browse New Listings <i className="bi bi-chevron-right"></i>
                </a>
                <div className="illustration left" />
              </div>

              {/* Box 2 */}
              <div className="explore-box">
                <h3>Used Caravans For Sale</h3>
                <p>
                  Find great deals on quality used caravans for sale by dealers and
                  private sellers.
                </p>
                <a href="/listings/used-condition/" className="btn btn-primary">
                  Search Used Listings <i className="bi bi-chevron-right"></i>
                </a>
                <div className="illustration center" />
              </div>

              {/* Box 3 */}
              <div className="explore-box">
                <h3>See All Caravans</h3>
                <p>
                  Explore the full range of new and used caravans across Australia.
                </p>
                <a href="/listings/" className="btn btn-primary">
                  Start Searching <i className="bi bi-chevron-right"></i>
                </a>
                <div className="illustration right" />
              </div>
            </div>
      
          </div>
        </div>
        <section className="caravans_by_state related-products services section-padding pt-2 style-1">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <div className="sell-banner">

                  {/* LEFT CONTENT */}
                  <div className="sell-content">
                    <h3>List Your Caravan For Sale Today</h3>

                    <p className="subtitle">Reach thousands of caravan buyers daily.</p>

                    <p className="desc">List your caravan on CaravansForSale.com.au — Australia’s trusted marketplace to buy and sell caravans.</p>

                    <div className="btns_two">
                      <a href="/dealer-advertising/" className="btn primary-btn">
                        Dealer Sign Up
                      </a>

                      <a href="/sell-my-caravan/" className="btn secondary-btn">
                        Private Seller - Click Here
                      </a>
                    </div>
                  </div>

                  {/* RIGHT IMAGE */}
                  {/* <div className="sell-image">
                    <Image
                      src="/images/selling_banner.jpg"
                      alt="Sell Caravan"
                      fill
                      className="image"
                      priority
                    />
                  </div> */}

                </div>

                      <PostRequirement requirements={requirements}   />
              </div>
            </div>
          </div>
        </section>

        {/* Caravans by State Section */}
        <div className="caravans_by_state related-products services section-padding style-1 pt-0">
          <div className="container">
            <div className="row">
              <div className="col">
                <div className="section-head mb-2 py-2">
                  <h2>Browse Caravans for sale in Australia by State</h2>
                </div>
              </div>
            </div>
            {stateBandsLoading ? (
              <CaravansByStateSkeleton count={4} />
            ) : (
              <div className="content">
                <div className="explore-state position-relative">
                  <Swiper
                    modules={[Navigation]}
                    navigation={{
                      nextEl: ".state-manu-next",
                      prevEl: ".state-manu-prev",
                    }}
                    //autoplay={{ delay: 3000 }}
                    spaceBetween={20}
                    slidesPerView={1}
                    breakpoints={{
                      768: { slidesPerView: 2 },
                      1024: { slidesPerView: 4 },
                      1280: { slidesPerView: 4 },
                    }}
                  >
                    {stateBands.map((item, index) => {
                      const key = item.state.toLowerCase().replace(/\s+/g, "-");

                      const meta = stateMeta[key] || {};
                      const stateCode = meta.code || "";
                      const mapImage = meta.image || "";

                      return (
                        <SwiperSlide key={index}>
                          <div className="service-box">
                            <div className="sec_right">
                              <span>
                                <Image
                                  src={mapImage}
                                  alt={`${item.state} map`}
                                  width={100}
                                  height={100}
                                />
                              </span>
                            </div>
                            <div className="sec_left">
                              <h3>{item.state}</h3>
                              <div className="info">
                                <div className="quick_linkss">
                                  {/* ✔ API BASED DISPLAY TEXT */}
                                  <p>{item.display_text}</p>

                                  <a
                                    className="view_all"
                                    href={`/listings${item.permalink}/`}
                                  >
                                    View All Caravans for Sale in {stateCode}{" "}
                                    <i className="bi bi-chevron-right"></i>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>

                  {/* Arrows */}
                  <div className="swiper-button-next state-manu-next" />
                  <div className="swiper-button-prev state-manu-prev" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="quick_links_tabs pb-5">
          <div className="container">
            <div className="section-head mb-2 py-2">
              <h2>Popular Caravan Searches Across Australia</h2>
            </div>
            <div className="custom-tabs-wrap">
              {/* Tabs */}
              <div className="custom-tabs-top">
                <div className="custom-tabs-nav">
                  {tabsData.map((tab) => (
                    <button
                      key={tab.key}
                      className={`custom-tab-btn ${activeTab === tab.key ? "active" : ""
                        }`}
                      onClick={() => setActiveTab(tab.key)}
                      type="button"
                    >
                      {tab.label}
                      {tab.label === "More" && (
                        <span className="tab-arrow">⌄</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards */}
              {/* <div className="custom-tabs-content">
                <div className="custom-card-grid">
                  {currentTab?.cards?.map((item, index) => (
                    <a href={item.url} className="custom-card" key={index}>
                      <h4 className="custom-card-title"><span className="count">{item.sub}</span> {item.title}</h4>
                    </a>
                  ))}
                </div>
              </div> */}
              {/* Cards - All tabs rendered in DOM, only active visible (SEO-friendly) */}
              <div className="custom-tabs-content">
                {tabsData.map((tab) => (
                  <div
                    key={tab.key}
                    className="custom-card-grid"
                    style={{ display: activeTab === tab.key ? "grid" : "none" }}
                  >
                    {isTabsLoading
                      ? Array.from({ length: 6 }).map((_, i) => (
                        <TabCardSkeleton key={i} />
                      ))
                      : tab.cards?.map((item, index) => (
                        <a href={item.url} className="custom-card" key={index}>
                          <h4 className="custom-card-title">
                            <span className="count">{item.sub}</span>{" "}
                            {item.title}
                          </h4>
                        </a>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
