"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEnquiryForm } from "@/app/components/ListContent/enquiryform";
import { Listing, SeoV2, buildFeaturedOrder } from "./listingShared";

export type { Listing, SeoV2 };
export { buildFeaturedOrder };

function useColCount() {
  const [cols, setCols] = useState(5);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w >= 1600 ? 5 : w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

interface Props {
  title: string;
  viewAllHref: string;
  /** Self-fetch mode: this grid owns its own request/loading/pagination/seo. */
  apiUrl?: string;
  /** Externally-supplied mode: parent already fetched + composed the items
   * (e.g. a single shared pool call split by slot_bucket across several
   * grids) — this grid just renders them, no fetch of its own. */
  items?: Listing[];
  loading?: boolean;
  showSpotlight?: boolean;
  hideViewAll?: boolean;
  hideTitle?: boolean;
  /** Render the title as the page's <h1> instead of <h2> — for pages where
   * the usual hero (which normally carries the h1) is skipped entirely. */
  titleAs?: "h1" | "h2";
  skeletonCount?: number;
  page?: number;
  onTotalPages?: (n: number) => void;
  onSeo?: (seo: SeoV2) => void;
  maxItems?: number;
  hideBanners?: boolean;
}

const PROMO_BANNERS = [
  { src: "/images/sell-my-caravan.jpg?=11", href: "/sell-my-caravan/", alt: "Sell My Caravan" },
  { src: "/images/home.jpg?=3",            href: "https://www.aussiefivestarcaravans.com.au/", alt: "Aussie Five Star Caravans" },
  { src: "/images/dealer-advertising.jpg?=7", href: "/dealer-advertising/", alt: "Dealer Advertising" },
];

function seededSample(size: number, count: number, seed: number): number[] {
  const arr = Array.from({ length: size }, (_, i) => i);
  let s = Math.abs(seed) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count).sort((a, b) => a - b);
}


function getImages(item: Listing): string[] {
  if (item.image_format?.length) return item.image_format;
  if (item.image_url?.length)    return item.image_url;
  if (item.image)                return [item.image];
  return [];
}

function formatPrice(p: string | undefined): string {
  if (!p) return "POA";
  const n = Number(p.replace(/[^0-9.]/g, ""));
  if (isNaN(n) || n === 0) return p;
  return `$${n.toLocaleString()}`;
}

function formatLength(len: string | undefined): string | null {
  if (!len) return null;
  const ft = parseFloat(len);
  if (isNaN(ft)) return null;
  const m = (ft * 0.3048).toFixed(1);
  return `${ft} ft (${m}m)`;
}

const AUS_ABBR: Record<string, string> = {
  "VICTORIA": "VIC",
  "NEW SOUTH WALES": "NSW",
  "QUEENSLAND": "QLD",
  "SOUTH AUSTRALIA": "SA",
  "WESTERN AUSTRALIA": "WA",
  "TASMANIA": "TAS",
  "NORTHERN TERRITORY": "NT",
  "AUSTRALIAN CAPITAL TERRITORY": "ACT",
};

const toTitleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** The pool no longer locks state=victoria,
 *  so a hardcoded "VIC" fallback is
 * wrong for most listings — derive the label from the item's own state/region/suburb. */
 function getLocationLabel(item: Listing): string {
   if (item.location) return item.location;
   const raw = item.state || item.region || item.suburb || "";
   if (!raw) return ""; // no state/region/suburb on this item — show nothing rather than a guessed fallback
   const name = raw.replace(/-/g, " ");
   return AUS_ABBR[name.toUpperCase()] ?? toTitleCase(name);
 }
 

/* ── Contact Seller Modal ── */
function ContactModal({ item, onClose }: { item: Listing; onClose: () => void }) {
  const { form, errors, touched, submitting, setField, onBlur, onSubmit } =
    useEnquiryForm({ id: item.id, slug: item.slug, name: item.name });

  return (
    <div className="lsd-contact-overlay" onClick={onClose}>
      <div className="lsd-contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lsd-contact-header">
          <h3 className="lsd-contact-title">Contact Seller</h3>
          <button className="lsd-contact-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sidebar-enquiry">
          <form className="wpcf7-form" noValidate onSubmit={onSubmit}>
            <div className="form">
              <div className="form-item">
                <p>
                  <input id="lsd-eq-name" className="wpcf7-form-control" value={form.name}
                    onChange={(e) => setField("name", e.target.value)} onBlur={() => onBlur("name")}
                    required autoComplete="off" />
                  <label htmlFor="lsd-eq-name">Name</label>
                </p>
                {touched.name && errors.name && <div className="cfs-error">{errors.name}</div>}
              </div>

              <div className="form-item">
                <p>
                  <input id="lsd-eq-email" className="wpcf7-form-control" type="email" value={form.email}
                    onChange={(e) => setField("email", e.target.value)} onBlur={() => onBlur("email")}
                    required autoComplete="off" />
                  <label htmlFor="lsd-eq-email">Email</label>
                </p>
                {touched.email && errors.email && <div className="cfs-error">{errors.email}</div>}
              </div>

              <div className="form-item">
                <p className="phone_country">
                  <span className="phone-label">+61</span>
                  <input id="lsd-eq-phone" className="wpcf7-form-control" inputMode="numeric" value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)} onBlur={() => onBlur("phone")}
                    required autoComplete="off" />
                  <label htmlFor="lsd-eq-phone">Phone</label>
                </p>
                {touched.phone && errors.phone && <div className="cfs-error">{errors.phone}</div>}
              </div>

              <div className="form-item">
                <p>
                  <input id="lsd-eq-postcode" className="wpcf7-form-control" inputMode="numeric" maxLength={4}
                    value={form.postcode} onChange={(e) => setField("postcode", e.target.value)}
                    onBlur={() => onBlur("postcode")} required autoComplete="off" />
                  <label htmlFor="lsd-eq-postcode">Postcode</label>
                </p>
                {touched.postcode && errors.postcode && <div className="cfs-error">{errors.postcode}</div>}
              </div>

              <div className="form-item">
                <p>
                  <label htmlFor="lsd-eq-message">Message (optional)</label>
                  <textarea id="lsd-eq-message" className="wpcf7-form-control wpcf7-textarea"
                    value={form.message} onChange={(e) => setField("message", e.target.value)} />
                </p>
              </div>

              <p className="terms_text">
                By clicking &apos;Send Enquiry&apos;, you agree to Marketplace Network{" "}
                <a href="/privacy-collection-statement" target="_blank" rel="noopener">Collection Statement</a>,{" "}
                <a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a> and{" "}
                <a href="/terms-conditions" target="_blank" rel="noopener">Terms and Conditions</a>.
              </p>

              <div className="submit-btn">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Enquiry"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Listing Card ── */
function ListingCard({
  item,
  spotlight,
  onContact,
}: {
  item: Listing;
  spotlight?: boolean;
  onContact: (item: Listing) => void;
}) {
  console.log("ooo", item)
  const images = getImages(item);
  const [idx, setIdx] = useState(0);
  const href   = `/product/${item.slug ?? item.id}/`;
  const cardRef = useRef<HTMLAnchorElement>(null);

  const prevImg = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); };
  const nextImg = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIdx((i) => (i + 1) % images.length); };

  const price    = formatPrice(item.sale_price || item.regular_price);
  const isNew    = item.condition?.toLowerCase() === "new";
  const type     = toTitleCase((item.categories?.[0] ?? "").replace(/-/g, " "));
  const sellerType = toTitleCase(item.seller_type ?? "");
  const lenFmt   = formatLength(item.length);
  const isDealer = item.seller_type !== "private";

  // Always 4 slots so grid rows are the same height across all cards
  const specSlots = [
    { icon: "/images/category.svg", text: type    || "" },
    { icon: "/images/length.svg",   text: lenFmt  || "" },
    { icon: "/images/weight.svg",   text: item.kg || "" },
    { icon: "",                     text: "" },
  ];

  
  // Remove all the lazy loading state and just load all images immediately
   const getIP = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
     const data = await res.json();
      return data.ip || "";
    } catch {
      return "";
   }
   };
 const postTrackClick = async (product_id: number) => {
    try {
      await fetch("/api/track-click", {
        method: "POST",
       headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id }),
      });
   } catch {}
   };

     const postTrackEvent = async (product_id: number) => {
    try {
       await fetch("/api/track", {
        method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ product_id }),
       });
     } catch {}
   };

    useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
       (entries) => {
        entries.forEach((entry) => {
           if (entry.isIntersecting) {
            const id = Number(entry.target.getAttribute("data-product-id"));
            if (id) postTrackEvent(id);
            observer.unobserve(entry.target);
          }
        });
     },
       { threshold: 0.3 },
    );
     observer.observe(el);
     return () => observer.disconnect();
   }, [item]);

  return (
    <Link
      ref={cardRef}
      href={href}
      prefetch={false}
      className={`lsd-card${spotlight ? " lsd-card--spotlight" : ""}`}
      data-product-id={item.id}
      onClick={() => postTrackClick(item.id)}
    >
      {/* Image */}
      <div className="lsd-card__img-wrap">
        {images.length > 0 ? (
          images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={item.name}
              loading={i === 0 ? "eager" : "lazy"}
              className={`lsd-card__img${
                i === idx ? " lsd-card__img--active"
                : i < idx  ? " lsd-card__img--prev"
                : ""
              }`}
            />
          ))
        ) : (
          <div className="lsd-card__img-placeholder" />
        )}

        {spotlight && (
          <div className="lsd-card__spotlight-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Spotlight Van
          </div>
        )}

        {images.length > 1 && idx === images.length - 1 && (
          <span className="lsd-card__view-more" onClick={(e) => e.preventDefault()}>
            View more
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        )}

        {images.length > 1 && (
          <>
            <button className="lsd-card__arr lsd-card__arr--prev" onClick={prevImg} aria-label="Previous">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7l6 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="lsd-card__arr lsd-card__arr--next" onClick={nextImg} aria-label="Next">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="lsd-card__dots" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              {images.map((_, i) => (
                <span key={i} className={`lsd-card__dot${i === idx ? " lsd-card__dot--active" : ""}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Body — CSS grid with fixed row heights keeps all sections aligned */}
      <div className="lsd-card__body">

        {/* Row 1: title — always 2 lines */}
        <p className="lsd-card__title">{item.name}</p>

        {/* Row 2: location */}
        <div className="lsd-card__location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {getLocationLabel(item)}
        </div>

        {/* Row 3: price */}
        <div className="lsd-card__price-row">
          <span className="lsd-card__price">{price}</span>
          {item.is_premium && (
            <span className="lsd-card__premium">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#000000" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Premium
            </span>
          )}
        </div>

        {/* Row 4: divider */}
        <hr className="lsd-card__divider" />

        {/* Row 5: specs — always 4 slots in 2×2 grid */}
        <div className="lsd-card__specs-grid">
          {specSlots.map((s, i) => (
            <span key={i} className="lsd-card__spec">
              {s.text && s.icon && (
                <img src={s.icon} alt="" className="lsd-card__spec-icon" />
              )}
              {s.text}
            </span>
          ))}
        </div>

        {/* Row 6: divider */}
        <hr className="lsd-card__divider" />

        {/* Row 7: condition */}
        <div className="lsd-card__cond-row">
          <span className="lsd-card__cond-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M7.5 12l3 3 6-6"/>
            </svg>
            Condition {item.condition}
          </span>
          <span className="lsd-card__cond-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="11" x2="12" y2="17"/><circle cx="12" cy="7.5" r="0.5" fill="#888" stroke="none"/>
            </svg>
            
            {sellerType}
          </span>
        </div>

        

        {/* Row 9: buttons */}
        <div className="lsd-card__actions">
          <button className="lsd-card__btn-contact" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onContact(item); }}>
            Contact Seller
          </button>
          <span className="lsd-card__btn-view">View Details</span>
        </div>

      </div>
    </Link>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="lsd-card lsd-card--skeleton">
      <div className="lsd-card__img-wrap lsd-skeleton" />
      <div className="lsd-card__body">
        <div className="lsd-skeleton" style={{ height: 36 }} />
        <div className="lsd-skeleton" style={{ width: "40%", height: 14 }} />
        <div className="lsd-skeleton" style={{ width: "55%", height: 22 }} />
        <div />
        <div className="lsd-skeleton" style={{ height: 44 }} />
        <div />
        <div className="lsd-skeleton" style={{ width: "70%", height: 18 }} />
        <div />
        <div style={{ display: "flex", gap: 8 }}>
          <div className="lsd-skeleton" style={{ flex: 1, height: 40, borderRadius: 6 }} />
          <div className="lsd-skeleton" style={{ flex: 1, height: 40, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main grid component ── */
export default function StateListingGrid({ title, viewAllHref, apiUrl, items: externalItems, loading: externalLoading, showSpotlight, hideViewAll, hideTitle, titleAs = "h2", skeletonCount = 10, page = 1, onTotalPages, onSeo, maxItems, hideBanners }: Props) {

  const [fetchedItems,  setFetchedItems]  = useState<Listing[]>([]);
  const [fetchLoading,  setFetchLoading]  = useState(true);
  const [contactItem,   setContactItem]   = useState<Listing | null>(null);
  const cols = useColCount();

  const externalMode = externalItems !== undefined;

  useEffect(() => {
    if (externalMode || !apiUrl) return;
    setFetchLoading(true);
    const requestUrl = `${apiUrl}&page=${page}`;
    // Logged as an absolute URL so devtools renders it as a clickable link —
    // click it to open the raw JSON response in a new tab.
    const absoluteUrl = new URL(requestUrl, window.location.origin).toString();
    console.log(`[StateListingGrid] "${title}" API:`, absoluteUrl);

    fetch(requestUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        console.log(`[StateListingGrid] "${title}" API response:`, json);

        // pool_test returns products/premium_products/exclusive_products at the
        // top level; new_optimize_code nests them under `data` — support both shapes.
        const products: Listing[]      = json?.data?.products ?? json?.products ?? [];
        const premiumsRaw: Listing[]   = json?.data?.premium_products ?? json?.premium_products ?? [];
        const exclusivesRaw: Listing[] = json?.data?.exclusive_products ?? json?.exclusive_products ?? [];
        const empExclusivesRaw: Listing[] = json?.data?.emp_exclusive_products ?? json?.emp_exclusive_products ?? [];
        const totalCount: number = json?.data?.counts?.total_count ?? json?.counts?.total_count ?? products.length;

        // Split `products` by whatever slot_bucket value actually comes back —
        // the API isn't limited to just featured/new/used (e.g. "featured_core"
        // also shows up), so group dynamically rather than hardcoding 3 buckets.
        const productsBySlotBucket = new Map<string, Listing[]>();
        for (const p of products) {
          const key = p.slot_bucket || "(none)";
          if (!productsBySlotBucket.has(key)) productsBySlotBucket.set(key, []);
          productsBySlotBucket.get(key)!.push(p);
        }
        for (const [bucket, items] of productsBySlotBucket) {
          console.log(`[StateListingGrid] "${title}" slot_bucket=${bucket}:`, items);
        }
        console.log(`[StateListingGrid] "${title}" slot_bucket=premium:`, premiumsRaw);
        console.log(`[StateListingGrid] "${title}" slot_bucket=exclusive:`, exclusivesRaw);

        // Featured (and combined) grid: slots 1 & 2 are regular featured vans,
        // slot 3 is the exclusive spotlight van, slots 4 & 5 are premium vans,
        // then the rest of the pool fills in after. New/Used grids: premium &
        // exclusive vans only ever show on the Featured tab — plain
        // condition-matched products here, nothing spliced in.
        // No products at all — fall back to the emp_exclusive_products pool
        // so the section isn't empty, all shown with the Spotlight Van design.
        const merged: Listing[] = totalCount === 0 && empExclusivesRaw.length > 0
          ? empExclusivesRaw.map((p) => ({ ...p, is_exclusive: true }))
          : showSpotlight
            ? buildFeaturedOrder(products, premiumsRaw, exclusivesRaw)
            : products.filter((p) => !p.is_premium && !p.is_exclusive);

        setFetchedItems(maxItems ? merged.slice(0, maxItems) : merged);
        onTotalPages?.(json?.pagination?.total_pages ?? 1);
        const seo = json?.data?.seo_v2 ?? json?.seo_v2;
        if (seo) onSeo?.(seo);
      })
      .catch(() => setFetchedItems([]))
      .finally(() => setFetchLoading(false));
  }, [externalMode, apiUrl, page]);

  const items   = externalMode ? (externalItems as Listing[]) : fetchedItems;
  const loading = externalMode ? (externalLoading ?? false) : fetchLoading;

  // Promo banner slots — fill empty last-row cells with priority banners
  const emptyInLastRow = (!loading && items.length > 0 && cols > 0)
    ? (cols - (items.length % cols)) % cols
    : 0;
  const bannerPositions: number[] = emptyInLastRow === 0
    ? []
    : emptyInLastRow <= 3
      ? Array.from({ length: emptyInLastRow }, (_, i) => i)
      : [0, 1, 2];
  const activeBanners = (hideBanners || !!(apiUrl?.includes('make=')))
    ? PROMO_BANNERS.filter(b => !b.src.includes('home.jpg'))
    : PROMO_BANNERS;

  // No title/section at all once we know for sure there's nothing to show —
  // an empty heading with a blank grid under it reads as broken, not "no results".
  if (!loading && items.length === 0) return null;

  return (
    <>
      <section className={`lsd-grid-section${hideTitle ? " lsd-grid-section--no-title" : ""}`}>
        <div className="container">
          {!hideTitle && (
            <div className="lsd-grid-header">
              {loading ? (
                <div className="lsd-skeleton lsd-grid-title-skeleton" />
              ) : titleAs === "h1"
                ? <h1 className="lsd-grid-title">{title}</h1>
                : <h2 className="lsd-grid-title">{title}</h2>}
              {!hideViewAll && (
                <Link href={viewAllHref} className="lsd-grid-viewall">
                  View all
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              )}
            </div>
          )}

          <div className="lsd-grid lsd-grid--4col">
            {loading
              ? [...Array(Math.floor(skeletonCount / cols) * cols || cols)].map((_, i) => <SkeletonCard key={i} />)
              : items.map((item, idx) => (
                  <ListingCard
                    key={item.id ?? idx}
                    item={item}
                    spotlight={item.is_exclusive === true}
                    onContact={setContactItem}
                  />
                ))}

            {!loading && bannerPositions.length > 0 &&
              Array.from({ length: emptyInLastRow }, (_, i) => {
                const bi = bannerPositions.indexOf(i);
                if (bi === -1) {
                  return <div key={`spacer-${i}`} className="lsd-promo-spacer" aria-hidden="true" />;
                }
                const b = activeBanners[bi];
                if (!b) {
                  return <div key={`spacer-${i}`} className="lsd-promo-spacer" aria-hidden="true" />;
                }
                return (
                  <a key={`promo-${i}`} href={b.href} className="lsd-promo-card" aria-label={b.alt}>
                    <img src={b.src} alt={b.alt} className="lsd-promo-card__img" />
                  </a>
                );
              })
            }
          </div>

        </div>
      </section>

      {contactItem && (
        <ContactModal item={contactItem} onClose={() => setContactItem(null)} />
      )}
    </>
  );
}
