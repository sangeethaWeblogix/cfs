"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";

import { type HomeBlogPost } from "@/api/home/api";
import HomeFeatured from "./HomeFeatured";
import HomeStateSection from "./HomeStateSection";
import HomeTypeSection from "./HomeTypeSection";
import HomeLocationSection from "./HomeLocationSection";
import HomeBuyerGuide from "./HomeBuyerGuide";
import HomeListingSlider from "./HomeListingSlider";
import { useBanners } from "@/components/BannerHandler";
import { useBannerTracking } from "@/hooks/useBannerTracking";
import "./main.css?=24";

const BlogSection = dynamic(() => import("../blogSection"), { ssr: false });
const PostRequirement = dynamic(() => import("../postRequirement"), { ssr: false });

const SEED_MAX = 15;

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
  homeblog: HomeBlogPost[];
}
/* --------------------------------- Page ---------------------------------- */
export default function HomePage({
  sleepBands,
  regionBands,
  manufactureBands,
  atmBands,
  lengthBands,
  priceBands,
  usedData,
  stateBands,
  requirements,
  homeblog,
}: Props) {
  const [usedCategoryList, setUsedCategoryList] = useState<Item[]>([]);
  const [usedState, setUsedState] = useState<Item[]>([]);
  const [usedRegion, setUsedRegion] = useState<Item[]>([]);
  const [adIndex, setAdIndex] = useState<number>(0);
  // Fresh random seed (1-15) every page load/refresh — drives the backend's
  // randomized featured pick so the same visitor sees a different set each visit.
  // Starts null so the featured/slider fetches below wait for the real seed
  // instead of firing once with a placeholder and again with the real value.
  const [seed, setSeed] = useState<number | null>(null);

  useEffect(() => {
    const fresh = Math.floor(Math.random() * SEED_MAX) + 1;
    console.log("[HomePage] seed:", fresh);
    setSeed(fresh);
  }, []);

  const { matchedBanners, isMobile, isLoading: bannerLoading } = useBanners();
  const sortedHome = [...matchedBanners]
    .filter(b => b.placement === "home")
    .sort((a, b) => Number(b.id) - Number(a.id));
  const homeDkBanner = sortedHome.find(b => b.device_target === "desktop");
  const homeMbBanner = sortedHome.find(b => b.device_target === "mobile");
  const activeBanner = isMobile ? (homeMbBanner ?? homeDkBanner) : (homeDkBanner ?? homeMbBanner);
  const activeBanners = useMemo(() => activeBanner ? [activeBanner] : [], [activeBanner]);

  const bannerClickUrl = useMemo(() => {
    if (!activeBanner?.target_url) return "#";
    try {
      const url = new URL(activeBanner.target_url);
      url.searchParams.set("utm_source", "caravansforsale");
      url.searchParams.set("utm_medium", "display");
      url.searchParams.set("utm_campaign", `${activeBanner.placement}_banner`);
      url.searchParams.set("utm_content", `banner_${activeBanner.id}`);
      return url.toString();
    } catch {
      return activeBanner.target_url;
    }
  }, [activeBanner]);
  const { bannerRefs, trackClick } = useBannerTracking(activeBanners);
const [clientIp, setClientIp] = useState<string>("");
async function fetchClientIp(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || "";
  } catch (err) {
    console.error("[home] fetchClientIp failed:", err);
    return "";
  }
}

useEffect(() => {
  fetchClientIp().then(setClientIp);
}, []);
const handleBannerClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
  if (!activeBanner) return;
  e.preventDefault();

  const clickId = "ck_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

  let finalUrl = bannerClickUrl;
  try {
    const u = new URL(bannerClickUrl);
    u.searchParams.set("cfs_click_id", clickId);
    finalUrl = u.toString();
  } catch { /* fallback to base url */ }

  const body = JSON.stringify({
    banner_id: Number(activeBanner.id),
    event_type: "click",
    click_id: clickId,
    session_id: sessionStorage.getItem("blr_session") || "home_" + Date.now(),
    page_url: window.location.href,
    device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    user_agent: navigator.userAgent,
    ip_address: clientIp,   // 👈 fix: hardcoded "" -> state value
  });
  const trackUrl = `${process.env.NEXT_PUBLIC_CF7_BASE || "https://admin.caravansforsale.com.au"}/wp-json/ads-manager/v1/banners/track`;
  fetch(trackUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
    .catch((err) => console.error("[home] banner click tracking failed:", err));

  window.open(finalUrl, "_blank", "noopener,noreferrer");
}, [activeBanner, bannerClickUrl, clientIp]);   // 👈 clientIp dependency-la add pannunga

  const bannerSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedIndex = Number.parseInt(
      localStorage.getItem("ad_index") || "0",
      10,
    );
    setAdIndex(Number.isFinite(storedIndex) ? storedIndex : 0);

    const container = bannerSectionRef.current;
    if (container) {
      const items = container.querySelectorAll<HTMLElement>(".items");
      const safeIndex =
        items.length > 0 ? Math.min(storedIndex, items.length - 1) : 0;

      items.forEach((item, i) => {
        item.style.display = i === safeIndex ? "block" : "none";
      });

      const modulo = items.length || 4;
      const next = (safeIndex + 1) % modulo;
      localStorage.setItem("ad_index", String(next));
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ── Hero Banner ── */}
      <section className="hd-banner">
        <div className="container">
          <h1 className="hd-banner__title">
            Caravans for Sale <span className="hd-banner__title--orange">Across Australia</span>
          </h1>
          <div className="hd-banner__divider">
            <span className="hd-banner__divider-line" />
            <img src="/images/aus_outline.svg" alt="" className="hd-banner__divider-icon" />
            <span className="hd-banner__divider-line" />
          </div>
          <p className="hd-banner__subtitle">
            Browse thousands of new and used caravans for sale across Australia from trusted dealers and private sellers. Compare off-road, family, touring, luxury and pop-top caravans to find the right van for your next adventure.
          </p>
          <div className="hd-banner__trust">
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/category.svg" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>Thousands of Listings</strong>
                <span>New &amp; used caravans across Australia</span>
              </div>
            </div>
            <div className="hd-banner__trust-item">
              <div className="hd-banner__trust-icon-wrap">
                <img src="/images/australia.png" alt="" className="hd-banner__trust-icon" width={26} height={26} />
              </div>
              <div className="hd-banner__trust-text">
                <strong>Australia Wide</strong>
                <span>Find caravans from every state &amp; territory</span>
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
          <a href="/listings/" className="hd-banner__cta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Browse Caravans for Sale
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

      

      {/* ── Featured Caravans ── */}
      <HomeFeatured seed={seed ?? undefined} />

      {/* ── Banner Ad ── */}
      <div className="hd-banner-ad pb-4">
        <div className="container">
          {bannerLoading ? (
            <div style={{ width: "100%", aspectRatio: "2000/517", background: "#f0f0f0", borderRadius: 8 }} />
          ) : activeBanner ? (
            <a
              href={bannerClickUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hd-banner-ad__inner"
              ref={(el) => { bannerRefs.current[0] = el; }}
              data-banner-id={activeBanner.id}
              onClick={handleBannerClick}
            >
              <span className="hd-banner-ad__label">Advertisement</span>
              <picture>
                {homeMbBanner && <source media="(max-width: 767px)" srcSet={homeMbBanner.image_url} />}
                <img
                  src={(homeDkBanner ?? homeMbBanner)?.image_url}
                  alt={activeBanner.name}
                  className="hd-banner-ad__img"
                />
              </picture>
            </a>
          ) : (
            <a href="https://www.aussiefivestarcaravans.com.au/" target="_blank" rel="noopener noreferrer" className="hd-banner-ad__inner">
              <span className="hd-banner-ad__label">Advertisement</span>
              <picture>
                <source media="(max-width: 767px)" srcSet="/images/aussiefivestar-1157x598.jpg" />
                <img src="/images/aussiefivestar-2000x517.jpg" alt="Aussie Fivestar Caravans" className="hd-banner-ad__img" />
              </picture>
            </a>
          )}
        </div>
      </div>

      {/* ── New Caravans for Sale ── */}
      <HomeListingSlider
        title="New Caravans for Sale"
        viewAllHref="/listings/new-condition/"
        apiUrl="/api/home-featured/?type=new"
        badgeVariant="new"
        seed={seed ?? undefined}
      />

      {/* ── Sell CTA Banner ── */}
      <section className="caravans_by_state related-products services ">
        <div className="container">
          <div className="sell-banner">
            <div className="sell-content">
              <h3>List Your Caravan For Sale Today</h3>
              <p className="subtitle">Reach thousands of caravan buyers daily.</p>
              <p className="desc">List your caravan on CaravansForSale.com.au — Australia&apos;s trusted marketplace to buy and sell caravans.</p>
              <div className="btns_two">
                <a href="/dealer-advertising/" className="btn primary-btn">Dealer Sign Up</a>
                <a href="/sell-my-caravan/" className="btn secondary-btn">Private Seller - Click Here</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Used Caravans for Sale ── */}
      <HomeListingSlider
        title="Used Caravans for Sale"
        viewAllHref="/listings/used-condition/"
        apiUrl="/api/home-featured/?type=used"
        badgeVariant="used"
        seed={seed ?? undefined}
      />

      {/* ── Browse by State ── */}
      <HomeStateSection stateBands={stateBands} />

      {/* ── Post Requirements ── */}
      <div className="hd-postreq-wrap">
        <div className="container">
          <PostRequirement requirements={requirements} />
        </div>
      </div>

      {/* ── Browse by Type ── */}
      <HomeTypeSection />

      {/* ── Find by Location ── */}
      <HomeLocationSection />

      {/* ── Buyer Guide + Why Australians ── */}
      <HomeBuyerGuide />

      {/* Deal of the Month Section */}
      {/*}<section className="deal-of-month product-details section-padding">
            <FeaturedSection />
          </section> */}
      {/*<section className="post-requirements product-details section-padding">
          <PostRequirement />
        </section> */}


      {/* Latest Blog Section */}
      <BlogSection />
    </div>
  );
}
