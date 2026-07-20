"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useEnquiryForm } from "@/app/components/ListContent/enquiryform";
import CaravanDetailModal from "@/app/product/[slug]/CaravanDetailModal";
import "./demo.css";

/* ── Types ── */
type Attribute = { label?: string; value?: string; url?: string };
type Category  = { name?: string; label?: string; value?: string } | string;
type Region    = { label?: string; value?: string; slug?: string };

interface ProductData {
  id?: string | number;
  slug?: string;
  name?: string;
  title?: string;
  description?: string;
  image_url?: string[];
  image?: string[];
  regular_price?: string | number;
  sale_price?: string | number;
  location?: string;
  location_shortcode?: string;
  region?: Region;
  suburb?: Region;
  categories?: Category[];
  attribute_urls?: Attribute[];
  sku?: string;
  seller_type?: string;
}

interface ApiData {
  product_details?: ProductData;
  categories?: Category[];
  id?: string | number;
  slug?: string;
  related?: ProductData[];
  latest_blog_posts?: BlogPost[];
}

interface BlogPost {
  id: number;
  title: string;
  thumbnail?: string;
  first_image?: string;
  image?: string;
  slug?: string;
  permalink?: string;
  date?: string;
  excerpt?: string;
}

interface MakeListing {
  id: number;
  name: string;
  slug?: string;
  thumbnail?: string;
  first_image?: string;
  image?: string;
  image_url?: string[];
  image_format?: string[];
  price?: string;
  regular_price?: string;
  sale_price?: string;
  location?: string;
  state?: string;
  suburb?: string;
  region?: string;
  condition?: string;
  seller_type?: string;
  category?: string;
  categories?: string[];
  make?: string;
  model?: string;
}

interface SimilarSection {
  label?: string;
  count?: number;
  products?: MakeListing[];
  blogs?: BlogPost[];
}

interface SimilarData {
  similar_by_make?: SimilarSection;
  similar_by_price?: SimilarSection;
  similar_blogs?: SimilarSection;
  related_blogs?: SimilarSection;
  make_similar?: MakeListing[];
  price_similar?: MakeListing[];
  blogs?: BlogPost[];
  latest_blog_posts?: BlogPost[];
  make_label?: string;
}

interface Props {
  data: { data?: ApiData } | null;
  similarData?: SimilarData | null;
}

/* ── Helpers ── */
const parseAmt = (v: string | number | undefined) => {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const slugify = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");
const toInt = (s: string) => { const n = parseInt(String(s).replace(/[^\d]/g, ""), 10); return Number.isFinite(n) && n > 0 ? n : null; };
const linkFromApiUrl = (rawUrl: string, text: string) => { const u = (rawUrl || "").trim().replace(/^\/+|\/+$/g, ""); return { href: /[=&]/.test(u) ? `/listings/?${u}` : `/listings/${u}/`, text }; };
const STATE_ABBR: Record<string, string> = {
  queensland: "QLD", "new-south-wales": "NSW", "new south wales": "NSW", nsw: "NSW",
  victoria: "VIC", vic: "VIC", "western-australia": "WA", "western australia": "WA", wa: "WA",
  "south-australia": "SA", "south australia": "SA", sa: "SA",
  tasmania: "TAS", tas: "TAS", "northern-territory": "NT", "northern territory": "NT", nt: "NT",
  "australian-capital-territory": "ACT", act: "ACT",
};
const resolveState = (s: string) => STATE_ABBR[s.toLowerCase().trim()] ?? s.toUpperCase();
const fmtCat = (cat: string) =>
  cat.split(",")[0].trim().replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const PRICE_STEPS = [10000,20000,30000,40000,50000,60000,70000,80000,90000,100000,125000,150000,175000,200000,225000,250000,275000,300000];
const getPriceRangeLinks = (price: number): { label: string; href: string }[] => {
  const upperIdx = PRICE_STEPS.findIndex(s => s >= price);
  if (upperIdx <= 0) return [];
  const links: { label: string; href: string }[] = [];
  const hi1 = PRICE_STEPS[upperIdx];
  const lo1 = PRICE_STEPS[upperIdx - 1];
  links.push({ label: `Caravans for Sale near $${lo1.toLocaleString()} to $${hi1.toLocaleString()}`, href: `/listings/?from_price=${lo1}&to_price=${hi1}` });
  if (upperIdx >= 2) {
    const hi2 = PRICE_STEPS[upperIdx - 1];
    const lo2 = PRICE_STEPS[upperIdx - 2];
    links.push({ label: `Caravans for Sale near $${lo2.toLocaleString()} to $${hi2.toLocaleString()}`, href: `/listings/?from_price=${lo2}&to_price=${hi2}` });
  }
  return links;
};

const fmtDate = (d: string) => {
  const dateOnly = d.split(" ")[0];
  const [y, m, day] = dateOnly.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mo = months[parseInt(m, 10) - 1];
  return mo ? `${mo} ${parseInt(day, 10)}, ${y}` : dateOnly;
};

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/* ── Mosaic gallery ── */
const Gallery = memo(function Gallery({ images, onOpen }: { images: string[]; onOpen: (index: number) => void }) {
  const extra = images.length - 3;
  const [mobileSlide, setMobileSlide] = useState(1);
  const go = (dir: 1 | -1) =>
    setMobileSlide(p => Math.max(0, Math.min(images.length - 1, p + dir)));

  return (
    <div className="pdd-gallery">
      {/* Desktop: mosaic layout */}
      <div className="pdd-gallery__mosaic">
        <div className="pdd-gallery__mosaic-main" onClick={() => onOpen(0)}>
          {images[0]
            ? <Image src={images[0]} alt="Caravan" fill style={{ objectFit: "cover" }} unoptimized />
            : <div className="pdd-gallery__placeholder" />}
        </div>
        <div className="pdd-gallery__mosaic-grid">
          {[1, 2].map(i => (
            <div key={i} className="pdd-gallery__mosaic-cell" onClick={() => onOpen(i)}>
              {images[i]
                ? <Image src={images[i]} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                : <div className="pdd-gallery__placeholder" />}
              {i === 2 && extra > 0 && (
                <div className="pdd-gallery__more">+{extra} Photos</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: pure CSS slider */}
      <div className="pdd-gallery__mobile-slider" onClick={() => onOpen(mobileSlide)}>
        <div
          className="pdd-gallery__mobile-track"
          style={{ transform: `translateX(-${mobileSlide * 100}%)` }}
        >
          {images.map((img, i) => (
            <div key={i} className="pdd-gallery__mobile-item">
              <Image src={img} alt={`Photo ${i + 1}`} fill style={{ objectFit: "cover" }} unoptimized />
            </div>
          ))}
        </div>
        <button className="pdd-gallery__prev" onClick={e => { e.stopPropagation(); go(-1); }} aria-label="Previous">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className="pdd-gallery__next" onClick={e => { e.stopPropagation(); go(1); }} aria-label="Next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div className="pdd-gallery__mobile-counter">{mobileSlide + 1} / {images.length}</div>
      </div>
    </div>
  );
});

/* ── Sidebar enquiry form — always open ── */
function EnquiryForm({ product }: { product: { id?: string | number; slug?: string; name?: string } }) {
  const { form, errors, touched, submitting, setField, onBlur, onSubmit } =
    useEnquiryForm({ id: product.id ?? product.slug ?? "", slug: product.slug, name: product.name ?? "" });

  const msgInit = useRef(false);
  useEffect(() => {
    if (!msgInit.current && product.name) {
      msgInit.current = true;
      setField("message", `Hi, I'm interested in your ${product.name}. Please contact me.`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pdd-sidebar__form">
      <div className="pdd-enquire-heading">Enquire Now</div>
      <form className="pdd-form" noValidate onSubmit={onSubmit}>
        <div className="pdd-form__item">
          <input placeholder="Your Name*" value={form.name}
            onChange={e => setField("name", e.target.value)} onBlur={() => onBlur("name")} />
          {touched.name && errors.name && <span className="pdd-form__err">{errors.name}</span>}
        </div>
        <div className="pdd-form__item">
          <input placeholder="Your Email*" type="email" value={form.email}
            onChange={e => setField("email", e.target.value)} onBlur={() => onBlur("email")} />
          {touched.email && errors.email && <span className="pdd-form__err">{errors.email}</span>}
        </div>
        <div className="pdd-form__item">
          <input placeholder="Your Phone*" inputMode="numeric" value={form.phone}
            onChange={e => setField("phone", e.target.value)} onBlur={() => onBlur("phone")} />
          {touched.phone && errors.phone && <span className="pdd-form__err">{errors.phone}</span>}
        </div>
        <textarea className="pdd-form__msg" rows={4}
          value={form.message}
          onChange={e => setField("message", e.target.value)} />
        <button type="submit" className="pdd-btn-send" disabled={submitting}>
          {submitting ? "Sending..." : "Send Enquiry"}
        </button>
        <p className="pdd-form__legal">
          By sending an enquiry, you agree to our{" "}
          <a href="/terms-conditions/" target="_blank">Terms of Use</a> and{" "}
          <a href="/privacy-policy/" target="_blank">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}

/* ── Main component ── */
export default function ProductDetailDemo({ data, similarData }: Props) {
  const pd: ApiData  = data?.data ?? {};
  const product: ProductData = pd.product_details ?? {};
  const attributes: Attribute[] = Array.isArray(product.attribute_urls) ? product.attribute_urls : [];
  const blogPosts: BlogPost[]  = Array.isArray(pd.latest_blog_posts) ? pd.latest_blog_posts : [];

  const getAttr = (label: string) =>
    attributes.find(a => String(a?.label ?? "").toLowerCase() === label.toLowerCase())?.value ?? "";

  const related: ProductData[] = Array.isArray(pd.related) ? pd.related : [];

  const images = useMemo<string[]>(
    () => Array.isArray(product.image_url) ? product.image_url.filter(Boolean) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product.image_url]
  );

  const rawCats: Category[] = Array.isArray(product.categories) ? product.categories
    : Array.isArray(pd.categories) ? pd.categories : [];
  const categoryNames: string[] = rawCats
    .map(c => typeof c === "string" ? c : (c?.name ?? c?.label ?? c?.value ?? ""))
    .filter(isNonEmpty);

  const reg  = parseAmt(product.regular_price);
  const sale = parseAmt(product.sale_price);
  const displayPrice = sale > 0 && sale < reg ? sale : reg;
  const isPOA = displayPrice === 0;
  const estMonthly = displayPrice > 0 ? Math.round(displayPrice / 240) : 0;

  const state    = getAttr("Location");
  const location = product.region?.value
    ? `${product.region.value.replace(/-/g, " ")}, ${state}`
    : state;

  /* Specs bar — shortened display values */
  const stateAbbr: Record<string, string> = {
    'victoria': 'VIC', 'new south wales': 'NSW', 'queensland': 'QLD',
    'south australia': 'SA', 'western australia': 'WA', 'tasmania': 'TAS',
    'northern territory': 'NT', 'australian capital territory': 'ACT',
  };
  const shortLocation = location
    ? location.replace(/,\s*(.+)$/, (_, s) => {
        const abbr = stateAbbr[s.toLowerCase().trim()];
        return abbr ? `, ${abbr}` : `, ${s}`;
      })
    : location;
  const shortCategory = categoryNames[0]?.replace(/\s+caravans?$/i, '').trim() ?? categoryNames[0];
  const shortSleeps   = getAttr("sleeps").replace(/\s+people?$/i, '').trim();
  const shortAtm      = getAttr("ATM");

  /* helper: find first matching attribute with value + url */
  const pickFull = (...labels: string[]): { value: string; url: string } => {
    for (const l of labels) {
      const attr = attributes.find(a => String(a?.label ?? "").toLowerCase() === l.toLowerCase());
      if (attr?.value) return { value: attr.value, url: attr.url ?? "" };
    }
    return { value: "", url: "" };
  };

  /* caravan details — with link logic matching live layout */
  type DetailLink = { href: string; text: string };
  type DetailRow = { label: string; value: string; url: string; links?: DetailLink[] };

  const makeDetailUrl = (label: string, value: string, apiUrl: string): string => {
    const v = value.trim();
    const L = label.toLowerCase();
    if (L === "year" || L === "years") { const n = toInt(v); return n ? `/listings/${n}-caravans-range/` : ""; }
    if (apiUrl) return linkFromApiUrl(apiUrl, v).href;
    if (L === "type" || L === "category") return v ? `/listings/${slugify(v.replace(/\s*caravans?\s*/gi, " ").trim())}-category/` : "";
    if (L === "make") return v ? `/listings/${slugify(v)}/` : "";
    if (L === "model") { const mk = pickFull("Make"); const mkSlug = mk.url?.trim().replace(/^\/+|\/+$/g, "") || slugify(mk.value); return v ? `/listings/${mkSlug}/${slugify(v)}/` : ""; }
    if (L === "condition" || L === "conditions") return v ? `/listings/${slugify(v)}-condition/` : "";
    if (L === "sleeping capacity" || L === "sleep" || L === "sleeps") { const n = toInt(v); return n ? `/listings/under-${n}-people-sleeping-capacity/` : ""; }
    if (L === "length") { const n = toInt(v); return n ? `/listings/under-${n}-length-in-feet/` : ""; }
    if (L === "atm") { const n = toInt(v); return n ? `/listings/under-${n}-kg-atm/` : ""; }
    return "";
  };

  const makeRow = (label: string, ...keys: string[]): DetailRow => {
    const { value, url } = pickFull(...keys);
    return { label, value, url: makeDetailUrl(label, value, url) };
  };

  const typeLinks: DetailLink[] = (categoryNames.length > 0 ? categoryNames : [getAttr("Type")].filter(Boolean))
    .map(c => ({ href: `/listings/${slugify(c.replace(/\s*caravans?\s*/gi, " ").trim())}-category/`, text: c }));

  const detailRows: DetailRow[] = [
    { label: "Type", value: (categoryNames.length > 0 ? categoryNames : [getAttr("Type")]).filter(Boolean).join(", "), url: "", links: typeLinks.length ? typeLinks : undefined },
    makeRow("Make",               "Make"),
    makeRow("Model",              "Model"),
    makeRow("Year",               "Years"),
    makeRow("Condition",          "Conditions"),
    makeRow("Length",             "Length"),
    makeRow("Sleeping Capacity",  "sleeps", "Sleeping Capacity"),
    makeRow("ATM",                "ATM"),
    makeRow("Tare Mass",          "Tare Mass", "Tare"),
    makeRow("Axle Configuration", "Axle Configuration", "Axle"),
    makeRow("Ball Weight",        "Ball Weight"),
    makeRow("Payload",            "Payload"),
    makeRow("Brakes",             "Brakes"),
    makeRow("Suspension",         "Suspension"),
    makeRow("Stock Number",       "Stock Number", "Stock"),
    makeRow("VIN",                "VIN"),
    makeRow("Registration",       "Registration"),
    makeRow("Colour",             "Colour", "Color"),
    makeRow("Solar",              "Solar"),
    makeRow("Battery",            "Battery"),
    makeRow("Air Conditioner",    "Air Conditioner", "Air Con"),
    makeRow("Water (Fresh)",      "Water (Fresh)", "Fresh Water"),
    makeRow("Water (Grey)",       "Water (Grey)", "Grey Water"),
  ].filter(r => r.value);

  const locationCity  = product.region?.value?.replace(/-/g, " ") ?? "";
  const locationState = state;

  if (locationCity || locationState) {
    const regionSlug  = product.region?.slug ?? slugify(locationCity);
    const stateAttr   = attributes.find(a => String(a?.label ?? "").toLowerCase() === "location");
    const stateSlug   = stateAttr?.url?.trim() || `${slugify(locationState)}-state`;
    const links: DetailLink[] = [];
    if (locationCity && regionSlug) links.push({ href: `/listings/${stateSlug}/${regionSlug}/`, text: locationCity.replace(/\b\w/g, c => c.toUpperCase()) });
    if (locationState) links.push(stateAttr?.url ? linkFromApiUrl(stateAttr.url, locationState) : { href: `/listings/${stateSlug}/`, text: locationState });
    detailRows.push({ label: "Location", value: [locationCity, locationState].filter(Boolean).join(", "), url: "", links });
  }

  const half2     = Math.ceil(detailRows.length / 2);
  const leftRows  = detailRows.slice(0, half2);
  const rightRows = detailRows.slice(half2);

  /* related searches — built from attribute values */
  const make = getAttr("Make");
  /* strip trailing "Caravans" from make so labels don't duplicate (e.g. "Retreat Caravans") */
  const makeLabel = make.replace(/\s+caravans?$/i, "").trim() || make;

  const catKeyword = categoryNames[0]?.toLowerCase().replace(/\s*caravans?$/i, "").trim() ?? "";

const priceUpperIdx = !isPOA ? PRICE_STEPS.findIndex(s => s >= displayPrice) : -1;
  const priceHi = priceUpperIdx >= 0 ? PRICE_STEPS[priceUpperIdx] : 0;
  const priceLo = priceUpperIdx >= 1 ? PRICE_STEPS[priceUpperIdx - 1] : 0;

  const relatedSearches: { label: string; href: string }[] = [
    make ? { label: make, href: `/listings/${slugify(makeLabel)}/` } : null,
    state ? { label: `Caravans for Sale in ${state}`, href: `/listings/${slugify(state)}-state/` } : null,
    locationCity ? { label: `Caravans for Sale in ${locationCity}`, href: `/listings/${slugify(state)}-state/${slugify(locationCity)}-region/` } : null,
    shortCategory ? { label: `${shortCategory} Caravans for Sale`, href: `/listings/${slugify(shortCategory)}-category/` } : null,
    priceHi ? { label: `Caravans Under $${priceHi.toLocaleString()}`, href: `/listings/under-${priceHi}/` } : null,
    (priceHi && priceLo) ? { label: `Caravans Between $${priceLo.toLocaleString()} to $${priceHi.toLocaleString()}`, href: `/listings/between-${priceLo}-${priceHi}/` } : null,
    { label: `All Caravans for Sale`, href: `/listings/` },
  ].filter(Boolean) as { label: string; href: string }[];

  const [safeHtml, setSafeHtml] = useState("");
  useEffect(() => {
    if (product.description) {
      setSafeHtml(product.description.replace(/\\n/g, "\n").replace(/\n/g, "<br>"));
    }
  }, [product.description]);

  useEffect(() => {
    const productId = product.id ?? pd.id;
    if (!productId) return;
    fetch("/api/track-product/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: Number(productId) }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const [descOpen, setDescOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const handleGalleryOpen = useCallback((i: number) => { setModalInitialIndex(i); setModalOpen(true); }, []);
  const sd = similarData ?? {};
  const makeSimilar: MakeListing[]  = sd.similar_by_make?.products ?? sd.make_similar ?? [];
  const priceSimilar: MakeListing[] = sd.similar_by_price?.products ?? sd.price_similar ?? [];
  const similarBlogs: BlogPost[]    = sd.similar_blogs?.blogs ?? sd.related_blogs?.blogs ?? sd.blogs ?? sd.latest_blog_posts ?? [];

  if (!product.name) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "#888" }}>Loading product…</div>;
  }

  const breadcrumb = [
    { label: "Home",            href: "/" },
    { label: "Caravans for Sale", href: "/listings/" },
    ...(state ? [{ label: state, href: `/listings/${slugify(state)}-state/` }] : []),
    ...(product.region?.value ? [{ label: product.region.value.replace(/-/g, " "), href: `/listings/${slugify(state)}-state/${product.region.slug ?? slugify(product.region.value)}/` }] : []),
    ...(categoryNames[0] ? [{ label: categoryNames[0], href: `/listings/${slugify(categoryNames[0].replace(/\s*caravan\s*/gi, " ").trim())}-category/` }] : []),
  ];

  return (
    <>
    <div className="pdd-page">
      <div className="pdd-container">

        {/* Title */}
        <h1 className="pdd-title">{product.name}</h1>

        {/* Subtitle */}
        <div className="pdd-subtitle">
          <span>Have a similar caravan to sell?</span>
          <a href="/sell-my-caravan/" className="pdd-subtitle__link">List Your Caravan</a>
          <span className="pdd-subtitle__badge">$49 Until Sold</span>
        </div>


        {/* 2-col layout: content + sidebar */}
        <div className="pdd-layout">

          {/* ── LEFT: Gallery + content ── */}
          <div className="pdd-content">

            {/* Specs bar — inside left column, horizontal layout */}
            <div className="pdd-specs-bar">
              {shortCategory && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/category.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{shortCategory}</span>
                    <span className="pdd-specs-bar__lbl">Caravan Type</span>
                  </div>
                </div>
              )}
              {shortSleeps && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/bed.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{shortSleeps}</span>
                    <span className="pdd-specs-bar__lbl">Sleeps</span>
                  </div>
                </div>
              )}
              {shortAtm && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/weight.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{shortAtm}</span>
                    <span className="pdd-specs-bar__lbl">ATM</span>
                  </div>
                </div>
              )}
              {getAttr("Length") && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/length.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{getAttr("Length")}</span>
                    <span className="pdd-specs-bar__lbl">Length</span>
                  </div>
                </div>
              )}
              {product.seller_type && (
                <div className="pdd-specs-bar__item">
                  <img src="/images/seller.svg" width="20" height="20" alt="" />
                  <div className="pdd-specs-bar__text">
                    <span className="pdd-specs-bar__val">{product.seller_type === "private" ? "Private Seller" : "Dealer"}</span>
                    <span className="pdd-specs-bar__lbl">Seller Type</span>
                  </div>
                </div>
              )}
            </div>

            <Gallery images={images} onOpen={handleGalleryOpen} />

            {/* Mobile-only price block — below gallery */}
            <div className="pdd-mobile-price">
              {sale > 0 && sale < reg ? (
                <div className="pdd-mobile-price__save-row">
                  <div className="pdd-mobile-price__left">
                    <span className="pdd-mobile-price__label">Sale Price</span>
                    <span className="pdd-mobile-price__val">{fmt(displayPrice)}</span>
                    <span className="pdd-mobile-price__was">{fmt(reg)}</span>
                  </div>
                  <div className="pdd-mobile-price__right">
                    <span className="pdd-mobile-price__save-label">Save</span>
                    <span className="pdd-mobile-price__save-val">{fmt(reg - sale)}</span>
                  </div>
                </div>
              ) : (
                <div className="pdd-mobile-price__simple">
                  <span className="pdd-mobile-price__label">Sale Price</span>
                  <span className="pdd-mobile-price__val">{isPOA ? "POA" : fmt(displayPrice)}</span>
                </div>
              )}
              <button className="pdd-mobile-price__checklist" onClick={() => setChecklistOpen(true)}>
                Caravan Buyer Safety Checklist
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </button>
            </div>

            {/* Caravan Details */}
            <section className="pdd-section">
              <h2 className="pdd-section__title">Caravan Details</h2>
              <div className="pdd-details-grid">
                <table className="pdd-details-table">
                  <tbody>
                    {leftRows.map(({ label, value, url, links }) => (
                      <tr key={label}>
                        <td className="pdd-details-table__key">{label}</td>
                        <td className="pdd-details-table__val">
                          {links?.length ? (label === "Type" ? links.map((l, i) => <span key={i} style={{display:"block"}}><a href={l.href} className="pdd-details-link">{l.text}</a></span>) : links.map((l, i) => <span key={i}>{i > 0 && ", "}<a href={l.href} className="pdd-details-link">{l.text}</a></span>)) : url ? <a href={url} className="pdd-details-link">{value}</a> : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="pdd-details-table">
                  <tbody>
                    {rightRows.map(({ label, value, url, links }) => (
                      <tr key={label}>
                        <td className="pdd-details-table__key">{label}</td>
                        <td className="pdd-details-table__val">
                          {links?.length ? (label === "Type" ? links.map((l, i) => <span key={i} style={{display:"block"}}><a href={l.href} className="pdd-details-link">{l.text}</a></span>) : links.map((l, i) => <span key={i}>{i > 0 && ", "}<a href={l.href} className="pdd-details-link">{l.text}</a></span>)) : url ? <a href={url} className="pdd-details-link">{value}</a> : value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Description */}
            <section className="pdd-section">
              <h2 className="pdd-section__title">Description</h2>
              <div className={`pdd-desc-wrap${descOpen ? " pdd-desc-wrap--open" : ""}`}>
                {safeHtml ? (
                  <div className="pdd-desc" dangerouslySetInnerHTML={{ __html: safeHtml }} />
                ) : (
                  <p className="pdd-desc">No description available.</p>
                )}
                {!descOpen && <div className="pdd-desc-fade" />}
              </div>
              <button className="pdd-desc-toggle" onClick={() => setDescOpen(o => !o)}>
                {descOpen ? "Hide Content" : "View More"}
              </button>
            </section>

            <button className="pdd-btn-contact-inline" onClick={() => { setModalInitialIndex(0); setModalOpen(true); }}>
              CONTACT SELLER
            </button>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="pdd-sidebar">
            <div className="pdd-sidebar__card">
              <div className="pdd-sidebar__prices">
                {sale > 0 && sale < reg ? (
                  <div className="pdd-sidebar__price-save">
                    <div className="pdd-sidebar__price-left">
                      <span className="pdd-sidebar__sale-label">Sale Price</span>
                      <span className="pdd-sidebar__sale-val">{fmt(displayPrice)}</span>
                      <span className="pdd-sidebar__was">{fmt(reg)}</span>
                    </div>
                    <div className="pdd-sidebar__price-right">
                      <span className="pdd-sidebar__save-label">Save</span>
                      <span className="pdd-sidebar__save-val">{fmt(reg - sale)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="pdd-sidebar__sale-label">Sale Price</span>
                    <span className="pdd-sidebar__sale-val">{isPOA ? "POA" : fmt(displayPrice)}</span>
                  </>
                )}
                {/* <a href="#" className="pdd-sidebar__offer">Make An Offer</a> */}
              </div>

              <div className="pdd-sidebar__checklist-row">
                <button className="pdd-btn-checklist" onClick={() => setChecklistOpen(true)}>
                  Caravan Buyer Safety Checklist
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                </button>
              </div>

              <div className="pdd-sidebar__enquire-btn">
                <button
                  className="pdd-btn-enquire"
                  onClick={() => { setModalInitialIndex(0); setModalOpen(true); }}
                >
                  Contact Seller
                </button>
              </div>
            </div>

            <div className="pdd-sidebar__sell">
              <strong>Thinking of selling?</strong>
              <p>Get more eyes on your caravan today.</p>
              <a href="/sell-my-caravan/" className="pdd-btn-sell">Sell My Caravan</a>
            </div>
          </aside>
        </div>

        {/* ── Sell CTA ── */}
        <section className="hbg-sell-section">
          
            <div className="hbg-sell-card">
              <div className="hbg-sell-icon-row">
                <span className="hbg-sell-line" />
                <div className="hbg-sell-icon-wrap">
                  <Image src="/images/category.svg" alt="" width={24} height={24} style={{ opacity: 0.4 }} />
                </div>
                <span className="hbg-sell-line" />
              </div>
              <h2 className="hbg-sell-title">Looking for More Caravans?</h2>
              <p className="hbg-sell-body">
                This caravan is just one of thousands of listings available on Australia&apos;s caravan marketplace. Browse our complete range of{" "}
                <a href="/" className="hbg-sell-link">caravans for sale</a>{" "}
                across Australia, including new caravans, used caravans, off-road caravans, hybrid caravans and family caravans from trusted dealers and private sellers.
              </p>
            </div>
          
        </section>

        {/* ── Similar Caravans ── */}
        {makeSimilar.length > 0 && (
          <section className="pdd-section pdd-similar">
            <h2 className="pdd-section__title">Similar Caravans in the {makeLabel} Range</h2>
            <div className="pdd-similar__grid">
                {makeSimilar.filter(r => r.slug !== product.slug).slice(0, 5).map((r, i) => {
                  const rName     = r.name ?? "";
                  const imgUrl    = r.thumbnail || r.first_image || r.image_format?.[0] || r.image_url?.[0] || r.image || undefined;
                  const rPrice    = parseAmt(r.price || r.sale_price || r.regular_price);
                  const rLoc      = r.state ? resolveState(r.state) : r.location ?? "";
                  const rCat      = fmtCat(r.categories?.[0] || r.category || "");
                  const isNew     = r.condition?.toLowerCase() === "new";
                  const isDealer  = r.seller_type !== "private";
                  return (
                    <a key={i} href={r.slug ? `/product/${r.slug}/` : "#"} className="pdd-similar__card">
                      <div className="pdd-similar__img">
                        {imgUrl
                          ? <Image src={imgUrl} alt={rName} fill style={{ objectFit: "cover" }} unoptimized />
                          : <div className="pdd-similar__img-placeholder" />
                        }
                        {rCat && <span className="pdd-similar__cat-chip">{rCat}</span>}
                      </div>
                      <div className="pdd-similar__body">
                        <p className="pdd-similar__name">{rName}</p>
                        <div className="pdd-similar__meta">
                          {rLoc && (
                            <span className="pdd-similar__meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              {rLoc}
                            </span>
                          )}
                          {r.condition && (
                            <span className="pdd-similar__meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                              {isNew ? "New" : "Used"}
                            </span>
                          )}
                          {r.seller_type && (
                            <span className="pdd-similar__meta-item">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                              {isDealer ? "Dealer" : "Private"}
                            </span>
                          )}
                        </div>
                        <p className="pdd-similar__price">{rPrice ? fmt(rPrice) : "POA"}</p>
                      </div>
                    </a>
                  );
                })}
            </div>
          </section>
        )}

        {/* ── Similar Caravans Around the Same Price ── */}
        {priceSimilar.length > 0 && (
          <section className="pdd-section pdd-similar">
            <h2 className="pdd-section__title">Similar Caravans Around the Same Price</h2>
            <div className="pdd-similar__grid">
              {priceSimilar.slice(0, 5).map((r, i) => {
                const rName    = r.name ?? "";
                const imgUrl   = r.thumbnail || r.first_image || r.image_format?.[0] || r.image_url?.[0] || r.image || undefined;
                const rPrice   = parseAmt(r.price || r.sale_price || r.regular_price);
                const rLoc     = r.state ? resolveState(r.state) : r.location ?? "";
                const rCat     = fmtCat(r.categories?.[0] || r.category || "");
                const isNew    = r.condition?.toLowerCase() === "new";
                const isDealer = r.seller_type !== "private";
                return (
                  <a key={i} href={r.slug ? `/product/${r.slug}/` : "#"} className="pdd-similar__card">
                    <div className="pdd-similar__img">
                      {imgUrl
                        ? <Image src={imgUrl} alt={rName} fill style={{ objectFit: "cover" }} unoptimized />
                        : <div className="pdd-similar__img-placeholder" />
                      }
                      {rCat && <span className="pdd-similar__cat-chip">{rCat}</span>}
                    </div>
                    <div className="pdd-similar__body">
                      <p className="pdd-similar__name">{rName}</p>
                      <div className="pdd-similar__meta">
                        {rLoc && (
                          <span className="pdd-similar__meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {rLoc}
                          </span>
                        )}
                        {r.condition && (
                          <span className="pdd-similar__meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                            {isNew ? "New" : "Used"}
                          </span>
                        )}
                        {r.seller_type && (
                          <span className="pdd-similar__meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            {isDealer ? "Dealer" : "Private"}
                          </span>
                        )}
                      </div>
                      <p className="pdd-similar__price">{rPrice ? fmt(rPrice) : "POA"}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Related Blogs + Related Searches ── */}
        <div className="pdd-related">
          {similarBlogs.length > 0 && (() => {
            const displayBlogs = similarBlogs.slice(0, 3);
            return (
            <section className="pdd-related__blogs">
              <h2 className="pdd-section__title">Related Blogs</h2>
              <div className="pdd-blogs">
                {displayBlogs.map((b, i) => (
                  <a key={i} href={b.slug ? `/${b.slug}/` : (b.permalink ?? "#")} className="pdd-blog">
                    {(b.thumbnail || b.first_image || b.image) && (
                      <div className="pdd-blog__img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.thumbnail || b.first_image || b.image} alt={b.title} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div className="pdd-blog__body">
                      <p className="pdd-blog__title">{b.title}</p>
                      
                      {b.date && (
                        <span className="pdd-blog__date">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec7200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {fmtDate(b.date)}
                        </span>
                      )}
                    </div>
                    {/* <svg className="pdd-blog__arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg> */}
                  </a>
                ))}
              </div>
            </section>
            );
          })()}

          {relatedSearches.length > 0 && (
            <section className="pdd-related__searches">
              <h2 className="pdd-section__title">Related Searches</h2>
              <div className="pdd-searches">
                {relatedSearches.map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    className="pdd-search-link"
                  >
                    <span>{s.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Full-width banner ── */}
        <div className="pdd-banner">
          <div className="pdd-banner__text">
            <p className="pdd-banner__sub">DEDICATED TO REVOLUTIONISING</p>
            <p className="pdd-banner__main">YOUR CARAVAN BUYING EXPERIENCE</p>
            <div className="pdd-banner__features">
              <span>
                <span className="pdd-banner__icon-circle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="2" width="20" height="14" rx="2.5"/><rect x="3" y="5" width="5" height="4" rx="1"/><rect x="14" y="5" width="5" height="8" rx="1"/><circle cx="7" cy="18" r="3"/><line x1="20" y1="14" x2="20" y2="21"/><line x1="18" y1="21" x2="22" y2="21"/></svg>
                </span>
                Australia&apos;s largest range
              </span>
              <span>
                <span className="pdd-banner__icon-circle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
                Trusted dealers
              </span>
              <span>
                <span className="pdd-banner__icon-circle">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
                Safe &amp; secure platform
              </span>
            </div>
          </div>
          <a href="/" className="pdd-banner__cta">FIND DEALS NOW</a>
        </div>

      </div>
    </div>

    {/* Mobile fixed bottom bar */}
    <div className="pdd-mobile-bottom-bar">
      <button className="pdd-mobile-bottom-bar__cta" onClick={() => { setModalInitialIndex(0); setModalOpen(true); }}>
        Contact Seller
      </button>
      <p className="pdd-mobile-bottom-bar__terms">
        By clicking &apos;Send Enquiry&apos;, you agree to Marketplace Network{" "}
        <a href="/privacy-collection-statement" target="_blank">Collection Statement</a>,{" "}
        <a href="/privacy-policy" target="_blank">Privacy Policy</a> and{" "}
        <a href="/terms-conditions" target="_blank">Terms and Conditions</a>.
      </p>
    </div>

    {checklistOpen && (
      <div className="pdd-checklist-overlay" onClick={() => setChecklistOpen(false)}>
        <div className="pdd-checklist-modal" onClick={e => e.stopPropagation()}>
          <button className="pdd-checklist-close" onClick={() => setChecklistOpen(false)} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          {/* Header */}
          <div className="pdd-checklist-header">
            <div>
              <h2 className="pdd-checklist-title">Caravan Buyer Safety Checklist</h2>
              <p className="pdd-checklist-sub">Follow these steps to reduce the risk of scams when buying a caravan.</p>
            </div>
          </div>

          {/* Items card */}
          <div className="pdd-checklist-card">
            <p className="pdd-checklist-section">Before you buy</p>
            {[
              { n: 1, title: "Check for finance owing",    desc: "Run a PPSR search before paying." },
              { n: 2, title: "Verify the seller",          desc: "Confirm identity and speak directly with them." },
              { n: 3, title: "Inspect the caravan first",  desc: "Inspect in person or arrange an inspection." },
              { n: 4, title: "Use safe payment methods",   desc: "Avoid cryptocurrency or overseas transfers." },
              { n: 5, title: "Report suspicious listings", desc: "Report listings that appear suspicious." },
            ].map(item => (
              <div key={item.n} className="pdd-checklist-item">
                <span className="pdd-checklist-num">{item.n}</span>
                <div>
                  <p className="pdd-checklist-item-title">{item.title}</p>
                  <p className="pdd-checklist-item-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    )}

    {modalOpen && (
      <CaravanDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        images={images}
        initialIndex={modalInitialIndex}
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name ?? "",
          image: images[0] ?? "",
          price: displayPrice,
          regularPrice: product.regular_price ?? 0,
          salePrice: product.sale_price ?? 0,
          isPOA,
          location,
        }}
      />
    )}
    </>
  );
}
