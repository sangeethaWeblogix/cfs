"use client";
import Image from "next/image";
import { redirect } from "next/navigation";
import FaqSection from "./FaqSection";
import RelatedNews from "./RelatedNews";
import BlogFeaturedListings from "./BlogFeaturedListings";
import "./details.css";
import { useEffect, useRef, useState } from "react";
import { formatPostDate } from "@/utils/date";
import { useBanners } from "@/components/BannerHandler";
import { useBannerTracking } from "@/hooks/useBannerTracking";

type BrowseLink = { text: string; href: string };
type BrowseTab = {
  label: string;
  icon: string;
  viewAll: { text: string; href: string };
  links: BrowseLink[];
  states?: BrowseLink[];
  regions?: BrowseLink[];
};

const CAT_MAJOR_CITIES = [
  { name: "Adelaide",       img: "/images/Adelaide.png",   state: "south-australia-state",           region: "adelaide-region" },
  { name: "Brisbane",       img: "/images/Brisbane.png",   state: "queensland-state",                region: "brisbane-region" },
  { name: "Gold Coast",     img: "/images/Gold-Coast.png", state: "queensland-state",                region: "gold-coast-region" },
  { name: "Melbourne",      img: "/images/Melbourne.png",  state: "victoria-state",                  region: "melbourne-region" },
  { name: "Perth",          img: "/images/Perth.png",      state: "western-australia-state",         region: "perth-region" },
  { name: "Sydney",         img: "/images/Sydney.png",     state: "new-south-wales-state",           region: "sydney-region" },
];
const CAT_MINOR_CITIES = [
  { name: "Cairns",         state: "queensland-state",                   region: "cairns-region" },
  { name: "Canberra",       state: "australian-capital-territory-state", region: "" },
  { name: "Darwin",         state: "northern-territory-state",           region: "darwin-region" },
  { name: "Geelong",        state: "victoria-state",                     region: "geelong-region" },
  { name: "Hobart",         state: "tasmania-state",                     region: "hobart-region" },
  { name: "Newcastle",      state: "new-south-wales-state",              region: "newcastle-region" },
  { name: "Sunshine Coast", state: "queensland-state",                   region: "sunshine-coast-region" },
  { name: "Townsville",     state: "queensland-state",                   region: "townsville-region" },
  { name: "Wollongong",     state: "new-south-wales-state",              region: "illawarra-region" },
  { name: "Ballarat",       state: "victoria-state",                     region: "ballarat-region" },
];
const CAT_STATES = [
  { name: "Victoria",          slug: "victoria-state",                  img: "/images/vic_map.svg" },
  { name: "New South Wales",   slug: "new-south-wales-state",           img: "/images/nsw_map.svg" },
  { name: "Queensland",        slug: "queensland-state",                img: "/images/qld_map.svg" },
  { name: "South Australia",   slug: "south-australia-state",           img: "/images/sa_map.svg" },
  { name: "Western Australia", slug: "western-australia-state",         img: "/images/wa_map.svg" },
  { name: "Tasmania",          slug: "tasmania-state",                  img: "/images/tas_map.svg" },
];

const BROWSE_TABS: BrowseTab[] = [
  {
    label: "Location",
    icon: "bi-geo-alt",
    viewAll: { text: "View all locations", href: "/listings/" },
    links: [],
    states: [
      { text: "Caravans for Sale in Victoria",          href: "/listings/victoria-state/" },
      { text: "Caravans for Sale in New South Wales",   href: "/listings/new-south-wales-state/" },
      { text: "Caravans for Sale in Queensland",        href: "/listings/queensland-state/" },
      { text: "Caravans for Sale in South Australia",   href: "/listings/south-australia-state/" },
      { text: "Caravans for Sale in Western Australia", href: "/listings/western-australia-state/" },
      { text: "Caravans for Sale in Tasmania",          href: "/listings/tasmania-state/" },
      { text: "Caravans for Sale in ACT",               href: "/listings/australian-capital-territory-state/" },
      { text: "Caravans for Sale in Northern Territory",href: "/listings/northern-territory-state/" },
    ],
    regions: [
      { text: "Melbourne",     href: "/listings/victoria-state/melbourne-region/" },
      { text: "Sydney",        href: "/listings/new-south-wales-state/sydney-region/" },
      { text: "Brisbane",      href: "/listings/queensland-state/brisbane-region/" },
      { text: "Perth",         href: "/listings/western-australia-state/perth-region/" },
      { text: "Adelaide",      href: "/listings/south-australia-state/adelaide-region/" },
      { text: "Gold Coast",    href: "/listings/queensland-state/gold-coast-region/" },
      { text: "Cairns",        href: "/listings/queensland-state/cairns-region/" },
      { text: "Canberra",      href: "/listings/australian-capital-territory-state/australian-capital-territory-region/" },
      { text: "Darwin",        href: "/listings/northern-territory-state/darwin-region/" },
      { text: "Geelong",       href: "/listings/victoria-state/geelong-region/" },
      { text: "Hobart",        href: "/listings/tasmania-state/hobart-region/" },
      { text: "Newcastle",     href: "/listings/new-south-wales-state/newcastle-region/" },
      { text: "Sunshine Coast",href: "/listings/queensland-state/sunshine-coast-region/" },
      { text: "Townsville",    href: "/listings/queensland-state/townsville-region/" },
      { text: "Wollongong",    href: "/listings/new-south-wales-state/illawarra-region/" },
      { text: "Ballarat",      href: "/listings/victoria-state/ballarat-region/" },
    ],
  },
  {
    label: "Manufacturer",
    icon: "bi-buildings",
    viewAll: { text: "View all manufacturers", href: "/caravan-manufacturers/" },
    links: [
      { text: "Jayco Caravans for Sale",       href: "/listings/jayco/" },
      { text: "Snowy River Caravans for Sale", href: "/listings/snowy-river/" },
      { text: "Evernew Caravans for Sale",     href: "/listings/evernew/" },
      { text: "Crusader Caravans for Sale",    href: "/listings/crusader/" },
      { text: "New Age Caravans for Sale",     href: "/listings/new-age/" },
      { text: "MDC Caravans for Sale",         href: "/listings/mdc/" },
      { text: "Essential Caravans for Sale",   href: "/listings/essential/" },
      { text: "Design RV Caravans for Sale",   href: "/listings/design-rv/" },
      { text: "JB Caravans for Sale",          href: "/listings/jb/" },
      { text: "Supreme Caravans for Sale",     href: "/listings/supreme/" },
      { text: "Avan Caravans for Sale",        href: "/listings/avan/" },
      { text: "Lotus Caravans for Sale",       href: "/listings/lotus/" },
      { text: "Royal Flair Caravans for Sale", href: "/listings/royal-flair/" },
      { text: "Windsor Caravans for Sale",     href: "/listings/windsor/" },
      { text: "Golf Caravans for Sale",        href: "/listings/golf/" },
      { text: "Nova Caravans for Sale",        href: "/listings/nova/" },
      { text: "Retreat Caravans for Sale",     href: "/listings/retreat/" },
      { text: "Adria Caravans for Sale",       href: "/listings/adria/" },
      { text: "Coromal Caravans for Sale",     href: "/listings/coromal/" },
    ],
  },
  {
    label: "Condition",
    icon: "bi-patch-check",
    viewAll: { text: "Browse all caravans", href: "/listings/" },
    links: [
      { text: "New Caravans for Sale", href: "/listings/new-condition/" },
      { text: "Used Caravans for Sale", href: "/listings/used-condition/" },
    ],
  },
  {
    label: "Weight",
    icon: "bi-speedometer2",
    viewAll: { text: "Browse by weight", href: "/listings/" },
    links: [
      { text: "Under 1500kg", href: "/listings/under-1500-kg-atm/" },
      { text: "Under 2000kg", href: "/listings/under-2000-kg-atm/" },
      { text: "Under 2500kg", href: "/listings/under-2500-kg-atm/" },
      { text: "Under 3000kg", href: "/listings/under-3000-kg-atm/" },
      { text: "Over 3000kg",  href: "/listings/over-3000-kg-atm/" },
    ],
  },
  {
    label: "Length",
    icon: "bi-rulers",
    viewAll: { text: "Browse by length", href: "/listings/" },
    links: [
      { text: "Under 16ft",  href: "/listings/under-16-length-in-feet/" },
      { text: "16ft – 18ft", href: "/listings/between-16-18-length-in-feet/" },
      { text: "18ft – 20ft", href: "/listings/between-18-20-length-in-feet/" },
      { text: "20ft – 22ft", href: "/listings/between-20-22-length-in-feet/" },
      { text: "Over 22ft",   href: "/listings/over-22-length-in-feet/" },
    ],
  },
  {
    label: "Price",
    icon: "bi-currency-dollar",
    viewAll: { text: "View all price ranges", href: "/listings/" },
    links: [
      { text: "Under $30,000",       href: "/listings/under-30000/" },
      { text: "$30,000 – $40,000",   href: "/listings/between-30000-40000/" },
      { text: "$40,000 – $50,000",   href: "/listings/between-40000-50000/" },
      { text: "$50,000 – $70,000",   href: "/listings/between-50000-70000/" },
      { text: "$70,000 – $80,000",   href: "/listings/between-70000-80000/" },
      { text: "$80,000 – $100,000",  href: "/listings/between-80000-100000/" },
      { text: "Over $100,000",       href: "/listings/over-100000/" },
    ],
  },
  {
    label: "Sleep",
    icon: "bi-moon-stars",
    viewAll: { text: "Browse by sleeping capacity", href: "/listings/" },
    links: [
      { text: "2 Berth",  href: "/listings/2-people-sleeping-capacity/" },
      { text: "3 Berth",  href: "/listings/3-people-sleeping-capacity/" },
      { text: "4 Berth",  href: "/listings/4-people-sleeping-capacity/" },
      { text: "5 Berth",  href: "/listings/5-people-sleeping-capacity/" },
      { text: "6+ Berth", href: "/listings/over-5-people-sleeping-capacity/" },
    ],
  },
];

type CategoryFeaturedProduct = {
  id: number;
  name: string;
  slug: string;
  condition: string;
  location: string;
  state?: string;
  regular_price: string;
  sale_price: string;
  categories: string[];
  image_format: string[];
  seller_type?: string;
};

type BlogDetail = {
  id: number;
  slug: string;
  title: string;
  date: string;
  banner_image?: string;
  image?: string;
  toc?: string;
  content?: string;
  product_category?: string | string[];
  category_featured_products?: CategoryFeaturedProduct[];
  faq?: { heading: string; content: string }[];
};

type FaqItem = {
  heading: string;
  content: string;
};

type RelatedBlog = {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image?: string;
  imageAlt?: string;
  slug?: string;
};

type BlogDetailResponse = {
  data?: {
    blog_detail?: BlogDetail;
    faq?: FaqItem[];
    related_blogs?: RelatedBlog[];
  };
  seo?: { metatitle?: string; metadescription?: string; index?: string };
};
export default function BlogDetailsPage({
  data,
}: {
  data: BlogDetailResponse;
}) {
  const [tocItems, setTocItems] = useState<Element[]>([]);
  const [showFullToc, setShowFullToc] = useState(false);
  const [browseTab, setBrowseTab] = useState(0);

  // ✅ Run DOMParser only on client
  const post = data?.data?.blog_detail;
  // console.log("dataaa", post);
  useEffect(() => {
  if (post?.toc) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.toc, "text/html");

    // ✅ Get the main ul element
    const mainUl = doc.querySelector("ul.ez-toc-list");

    if (mainUl) {
      // Get only direct children using childNodes filter
      const items = Array.from(mainUl.children).filter(
        (child) => child.tagName === "LI"
      );
      setTocItems(items as Element[]);
    }
  }
}, [post?.toc]);
  // put this near the top of the file (outside the component)
  const decodeEntities = (s = "") =>
    s
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16))
      );

  const stripHtml = (s?: string) =>
    (s ?? "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const cleanTitle = (s?: string) => decodeEntities(stripHtml(s));
  const plainTitle = cleanTitle(data?.data?.blog_detail?.title);

  const rawCatRaw = data?.data?.blog_detail?.product_category;
  const rawCats = Array.isArray(rawCatRaw) ? rawCatRaw : rawCatRaw ? [rawCatRaw] : [];
  const cats = rawCats
    .map(c => c.trim())
    .filter(Boolean)
    .map(c => ({
      label: c.replace(/-/g, " ").replace(/\b\w/g, (ch: string) => ch.toUpperCase()),
      link: `/listings/${c.toLowerCase()}-category/`,
    }));
  const catLabel = cats[0]?.label ?? "";
  const catLink  = cats[0]?.link ?? "/listings/";

  const blogContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = blogContentRef.current;
    if (!container || !post?.content || !post?.id) return;

    const getSessionId = () => {
      let sid = sessionStorage.getItem("blr_session");
      if (!sid) {
        sid =
          "sess_" +
          Math.random().toString(36).slice(2) +
          Date.now().toString(36);
        sessionStorage.setItem("blr_session", sid);
      }
      return sid;
    };

    const getDeviceType = () => {
      const w = window.innerWidth;
      if (w < 768) return "mobile";
      if (w < 1024) return "tablet";
      return "desktop";
    };

     const trackBlogLink = async (
      linkId: string,
      eventType: "click" | "impression",
    ) => {
      return;

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_CF7_BASE}/wp-json/ads-manager/v1/blog-links/track`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              link_id: parseInt(linkId),
              post_id: post?.id,
              event_type: eventType,
              session_id: getSessionId(),
              device_type: getDeviceType(),
              user_agent: navigator.userAgent,
            }),
          },
        );
      } catch (e) {}
    };


    // CLICK TRACKING
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest(
        ".blog-tracked-link",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const linkId = anchor.dataset.linkId;
      if (!linkId) return;
      trackBlogLink(linkId, "click");
    };

    container.addEventListener("click", handleClick);

    // VIEW TRACKING
    let observer: IntersectionObserver | null = null;
    let raf1: number;
    let raf2: number;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const trackedLinks =
          container.querySelectorAll<HTMLAnchorElement>(".blog-tracked-link");

        if (!trackedLinks.length) return;

        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;

              const anchor = entry.target as HTMLAnchorElement;
              const linkId = anchor.dataset.linkId;
              if (!linkId) return;

              trackBlogLink(linkId, "impression");
              observer?.unobserve(anchor);
            });
          },
          { threshold: 0.5 },
        );

        trackedLinks.forEach((link) => observer!.observe(link));
      });
    });

    // CLEANUP
    return () => {
      container.removeEventListener("click", handleClick);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer?.disconnect();
    };
  }, [post?.content, post?.id]);

  const { matchedBanners, isMobile } = useBanners();
  const { bannerRefs, trackClick } = useBannerTracking(matchedBanners);
  const rightBanners = matchedBanners.filter((b) => b.position === "right");

  const readingTime = post?.content
    ? `${Math.max(1, Math.round(stripHtml(post.content).split(/\s+/).length / 200))} min read`
    : null;

  if (!post) {
    redirect("/404");
  }

  return (
    <div className="blog-page style-5 color-4">
      {/* ── Hero ── */}
      <section className="blog-hero">
        {/* Left: title + meta */}
        <div className="blog-hero__left">
          <div className="blog-hero__left-inner">
            <h1 className="blog-hero__title">{plainTitle}</h1>
            <div className="blog-hero__meta">
              <span><i className="bi bi-calendar3" />{formatPostDate(post.date)}</span>
              {readingTime && <span><i className="bi bi-clock" />{readingTime}</span>}
            </div>
          </div>
        </div>
        {/* Right: banner image */}
        <div className="blog-hero__right">
          {post.banner_image ? (
            <Image
              src={post.banner_image}
              alt={plainTitle}
              width={0}
              height={0}
              sizes="100vw"
              unoptimized
              className="blog-hero__img"
              priority
            />
          ) : (
            <div className="blog-hero__no-image" />
          )}
        </div>
      </section>

      {/* ── Mobile TOC (shown only on mobile, hidden on desktop) ── */}
      {post?.toc && tocItems.length > 0 && (
        <div className="blog-mobile-toc">
          <div className="blog-browse-toc">
            <h3 className="blog-browse-toc__heading">Table of Contents</h3>
            <ul className="blog-browse-toc__list">
              {(showFullToc ? tocItems : tocItems.slice(0, 5)).map((item, index) => {
                const anchor = item.querySelector("a");
                if (!anchor) return null;
                return (
                  <li key={index}>
                    <a href={anchor.getAttribute("href") ?? "#"}>
                      {anchor.textContent ?? ""}
                    </a>
                  </li>
                );
              })}
            </ul>
            {tocItems.length > 5 && (
              <button
                className="blog-browse-toc__more"
                onClick={() => setShowFullToc((prev) => !prev)}
              >
                {showFullToc ? <>Show Less <i className="bi bi-chevron-up" /></> : <>Show More <i className="bi bi-chevron-down" /></>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Quick Browse Widget (hidden) ── */}
      {false && <section className="blog-browse-section">
        <div className="container">
          <div className="blog-browse-layout">


            {/* Right: CTA + tabs + links */}
            <div className="blog-browse-main">
              <div className="blog-browse-cta">
                <div className="blog-browse-cta__text">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/category.svg" alt="" width={32} height={32} className="blog-browse-cta__icon-img" />
                  <div>
                    <h3 className="blog-browse-cta__heading">
                      {catLabel ? `Ready to Browse ${catLabel} Caravans?` : "Ready to Browse Caravans?"}
                    </h3>
                    <p className="blog-browse-cta__desc">
                      {catLabel ? `Explore hundreds of ${catLabel.toLowerCase()} caravans for sale across Australia.` : "Explore thousands of caravans for sale across Australia."}
                    </p>
                  </div>
                </div>
                <a href={catLink} className="blog-browse-cta__btn">
                  {catLabel ? `Browse ${catLabel} Caravans` : "Browse Caravans"} <i className="bi bi-arrow-right" />
                </a>
              </div>

              <div className="blog-browse-tabs">
                {BROWSE_TABS.map((tab, i) => (
                  <button
                    key={tab.label}
                    className={`blog-browse-tab${browseTab === i ? " active" : ""}`}
                    onClick={() => setBrowseTab(i)}
                  >
                    <i className={`bi ${tab.icon}`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="blog-browse-links">
                {BROWSE_TABS[browseTab].states ? (
                  <>
                    <p className="blog-browse-sublabel">By State</p>
                    <div className="blog-browse-links__inner">
                      {BROWSE_TABS[browseTab].states!.map((link) => (
                        <a key={link.href} href={link.href} className="blog-browse-link">{link.text}</a>
                      ))}
                    </div>
                    <p className="blog-browse-sublabel">By Region</p>
                    <div className="blog-browse-links__pills">
                      {BROWSE_TABS[browseTab].regions!.map((link) => (
                        <a key={link.href} href={link.href} className="blog-browse-link blog-browse-link--pill">{link.text}</a>
                      ))}
                    </div>
                  </>
                ) : (
                  BROWSE_TABS[browseTab].links.map((link) => (
                    <a key={link.href} href={link.href} className="blog-browse-link">{link.text}</a>
                  ))
                )}
              </div>


            </div>

          </div>
        </div>
      </section>}

      {/* ── Article body ── */}
      <section className="blog-article-section">
        <div className="container">
          <div className="blog-article-layout">
            {/* Main content */}
            <div className="blog-article-main single_blog">
              <div
                ref={blogContentRef}
                className="all-news toc_hide_details"
                dangerouslySetInnerHTML={{
                  __html: post.content || "<p>No content available</p>",
                }}
              />
            </div>

            {/* Sidebar: TOC + CTA cards */}
            <aside className="blog-article-sidebar">
              {post?.toc && tocItems.length > 0 && (
                <div className="blog-browse-toc blog-sidebar-toc">
                  <h3 className="blog-browse-toc__heading">Table of Contents</h3>
                  <ul className="blog-browse-toc__list">
                    {(showFullToc ? tocItems : tocItems.slice(0, 5)).map((item, index) => {
                      const anchor = item.querySelector("a");
                      if (!anchor) return null;
                      return (
                        <li key={index}>
                          <a href={anchor.getAttribute("href") ?? "#"}>
                            {anchor.textContent ?? ""}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  {tocItems.length > 5 && (
                    <button
                      className="blog-browse-toc__more"
                      onClick={() => setShowFullToc((prev) => !prev)}
                    >
                      {showFullToc ? <>Show Less <i className="bi bi-chevron-up" /></> : <>Show More <i className="bi bi-chevron-down" /></>}
                    </button>
                  )}
                </div>
              )}
              <div className="blog-sidebar-sticky">
                <div className="blog-sidebar-cta">
                  <h3 className="blog-sidebar-cta__heading">Ready to Find Your Next Caravan?</h3>
                  <p className="blog-sidebar-cta__desc">Browse thousands of new and used caravans from trusted dealers and private sellers across Australia.</p>
                  <a href="/listings/" className="blog-sidebar-cta__btn">
                    Search Caravans Now <i className="bi bi-arrow-right" />
                  </a>
                </div>
                <div className="blog-sidebar-cta blog-sidebar-cta--sell">
                  <h3 className="blog-sidebar-cta__heading">Sell Your Caravan Faster with Australia's Growing Caravan Marketplace</h3>
                  <a href="/sell-my-caravan/" className="blog-sidebar-cta__btn">
                    List Your Caravan Now <i className="bi bi-arrow-right" />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <FaqSection data={data?.data?.blog_detail?.faq ?? []} cats={cats} />

      {/* ── Browse by Popular Location ── */}
      {cats.length > 0 && (
        <section className="bds-cat-loc">
          <div className="container">
            <h2 className="bds-cat-title">Find {catLabel} Caravans by Popular Location</h2>
            <div className="bds-cat-loc__major">
              {CAT_MAJOR_CITIES.map((city) => (
                <a key={city.name} href={`${catLink}${city.state}/${city.region}/`} className="bds-cat-city-card">
                  <div className="bds-cat-city-img-wrap">
                    <img src={city.img} alt={city.name} className="bds-cat-city-img" loading="lazy" />
                  </div>
                  <span className="bds-cat-city-name">{catLabel} Caravans in {city.name} <i className="bi bi-chevron-right bds-cat-city-arrow" /></span>
                </a>
              ))}
            </div>
            <div className="bds-cat-loc__minor">
              {CAT_MINOR_CITIES.map((city) => (
                <a key={city.name} href={`${catLink}${city.state}/${city.region ? city.region + "/" : ""}`} className="bds-cat-minor-pill">
                  {catLabel} Caravans in {city.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Browse by State ── */}
      {cats.length > 0 && (
        <section className="bds-cat-state">
          <div className="container">
            <h2 className="bds-cat-title">Find {catLabel} Caravans by State</h2>
            <div className="bds-cat-state__grid">
              {CAT_STATES.map((s) => (
                <a key={s.name} href={`${catLink}${s.slug}/`} className="bds-cat-state-card">
                  <img src={s.img} alt={s.name} className="bds-cat-state-img" loading="lazy" />
                  <span className="bds-cat-state-name">{catLabel} Caravans in {s.name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <BlogFeaturedListings products={data?.data?.blog_detail?.category_featured_products ?? []} category={catLabel} />
      <RelatedNews blogs={data?.data?.related_blogs ?? []} />

      {/* ── Buy or Sell CTA ── */}
      <section className="bds-cta-section">
        <div className="bds-cta-card">
          <h2 className="bds-cta-title">Ready to Buy or Sell a Caravan?</h2>
          <p className="bds-cta-body">
            <strong>Looking to buy?</strong> Browse{" "}
            <a href="/" className="bds-cta-link">caravans for sale</a>{" "}
            from dealers and private sellers across Australia, with listings available by make, model, price, location and caravan type.
          </p>
          <p className="bds-cta-body">
            <strong>Looking to sell?</strong> If you&apos;re upgrading to a newer caravan or no longer need your current one,{" "}
            <a href="/sell-my-caravan/" className="bds-cta-link">sell your caravan</a>{" "}
            by creating a listing on CaravansForSale.com.au. Your advertisement stays online until it&apos;s sold for a one-time fee of $49.
          </p>
        </div>
      </section>
    </div>
  );
}