"use client";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import Link from "next/link";
import CaravanDetailModal from "./CaravanDetailModal";
import "./product.css?=226";
 
import DOMPurify from "dompurify";
import { type HomeBlogPost } from "@/api/home/api";
import { toSlug } from "@/utils/seo/slug";
import ProductSkelton from "../../components/ProductCardSkeleton";
import { useRouter } from "next/navigation";

type Attribute = {
  label?: string;
  value?: string;
  url?: string;
  name?: string;
  title?: string;

  val?: string;
  text?: string;
};

type Category = { name?: string; label?: string; value?: string } | string;

interface ApiData {
  product_details?: ProductData;
  main_image?: string;
  images?: string[];
  categories?: Category[];
  id?: string | number;
  slug?: string;
  latest_blog_posts?: string;
  related?: string;
}

interface ProductDetailResponse {
  data?: ApiData;
}

type ProductData = {
  id?: string | number;
  slug?: string;
  name?: string;
  images?: string[];
  main_image?: string;
  location?: string;
  region?: { label?: string; value?: string; slug?: string };
  suburb?: { label?: string; value?: string; slug?: string };
  regular_price?: string | number;
  sale_price?: string | number;
  price_difference?: string | number;
  categories?: Category[];
  attribute_urls?: Attribute[];
  description?: string;
  image?: string[];
  title?: string;
  location_shortcode?: string;
  seller_type?: string;
  sku?: string;
  image_url?: string[];
};

interface BlogPost extends HomeBlogPost {
  // ensure fields you use are present
  id: number;
  title: string;
  image: string;
  slug: string;
  date?: string;
  excerpt?: string;
  link?: string;
}
function ftToMeters(value: string): string | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return `(${(num * 0.3048).toFixed(1)}m)`;
}

export default function ClientLogger({
  data,
}: {
  data: ProductDetailResponse;
}) {
  // const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const router = useRouter();
 

  // const [activeImage, setActiveImage] = useState<string>("");
  const pd: ApiData = data?.data ?? {};
  const productDetails: ProductData = pd.product_details ?? {};
  const blogPosts: BlogPost[] = Array.isArray(data?.data?.latest_blog_posts)
    ? data.data.latest_blog_posts!
    : [];
  const apiImages: string[] = Array.isArray(productDetails.image_url)
    ? productDetails.image_url.filter(Boolean)
    : [];

  const relatedProducts: ProductData[] = Array.isArray(data?.data?.related)
    ? data.data.related!
    : [];

  const loadedCount = useRef(0);

  // const handleImageLoad = () => {
  //   loadedCount.current += 1;
  //   if (loadedCount.current >= allSubs.length + 1) {
  //   }
  // };

  const [showPopup, setShowPopup] = useState(false);

  const product: ProductData = productDetails;
  const isBrowser = typeof window !== "undefined";

  function decodeEntities(s: string) {
    if (!isBrowser) {
      return s
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
    const el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  }

  function buildSafeDescription(raw?: string) {
    const base = (raw ?? "").replace(/\\n/g, "\n");
    const decoded = decodeEntities(base);

    if (!isBrowser) {
      const noHeadings = decoded
        .replace(/<\s*h[1-6][^>]*>/gi, "<strong>")
        .replace(/<\s*\/\s*h[1-6]\s*>/gi, "</strong>");
      const stripped = noHeadings
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "");
      return stripped.replace(/\n/g, "<br>");
    }

    const tmp = document.createElement("div");
    tmp.innerHTML = decoded;

    tmp.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
      const strong = document.createElement("strong");
      strong.textContent = h.textContent ?? "";
      h.replaceWith(strong);
    });

    const purified = DOMPurify.sanitize(tmp.innerHTML, {
      ALLOWED_TAGS: ["br", "p", "ul", "ol", "li", "strong", "em", "b", "i"],
      ALLOWED_ATTR: [],
    });

    return purified.replace(/\n/g, "<br>");
  }

  const [safeHtml, setSafeHtml] = useState<string>("");
  useEffect(() => {
    setSafeHtml(buildSafeDescription(productDetails.description));
  }, [productDetails.description]);

  const [navigating, setNavigating] = useState(false);

  const [activeTab, setActiveTab] = useState<"specifications" | "description">(
    "specifications",
  );
  const [showModal, setShowModal] = useState(false);

  const attributes: Attribute[] = Array.isArray(productDetails.attribute_urls)
    ? productDetails.attribute_urls
    : [];

  // ---------- helpers ----------
  const getAttr = (label: string): string =>
    attributes.find(
      (a) => String(a?.label ?? "").toLowerCase() === label.toLowerCase(),
    )?.value ?? "";

  const findAttr = (label: string): Attribute | undefined =>
    attributes.find(
      (a) => String(a?.label ?? "").toLowerCase() === label.toLowerCase(),
    );

  // build listings link from API-provided url (segment or query)
  const linkFromApiUrl = (rawUrl: string, text: string) => {
    const u = (rawUrl || "").trim().replace(/^\/+|\/+$/g, "");
    const href = /[=&]/.test(u) ? `/listings/?${u}` : `/listings/${u}/`;
    return { href, text };
  };

  const isNonEmpty = (s: unknown): s is string =>
    typeof s === "string" && s.trim().length > 0;

  const rawCats: Category[] = Array.isArray(productDetails.categories)
    ? productDetails.categories
    : Array.isArray(pd.categories)
      ? pd.categories
      : [];

  const categoryNames: string[] = rawCats
    .map((c) =>
      typeof c === "string" ? c : (c?.name ?? c?.label ?? c?.value ?? ""),
    )
    .filter(isNonEmpty);

  const makeValue = getAttr("Make");

  const slugify = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");
  const toInt = (s: string) => {
    const n = parseInt(String(s).replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };

  const getHref = (p: BlogPost) => {
    const slug = p.slug?.trim() || toSlug(p.title || "post");
    return `/${slug}/`;
  };
  const getProductHref = (p: ProductData) => {
    const slug = p.slug?.trim() || "post";
    return slug ? `/product/${slug}/` : "";
  };
  type LinkOut = { href: string; text: string };
  type SpecItem = { label: string; value: string; url?: string; links?: LinkOut[] };

  // ---------- spec fields with API urls ----------
  const specFields: SpecItem[] = [
    {
      label: "Type",
      value: categoryNames.join(", ") || getAttr("Type"),
      url: findAttr("Type")?.url,
    },
    { label: "Make", value: getAttr("Make"), url: findAttr("Make")?.url },
    { label: "Model", value: getAttr("Model"), url: findAttr("Model")?.url },
    { label: "Year", value: getAttr("Years"), url: findAttr("Years")?.url },
    {
      label: "Condition",
      value: getAttr("Conditions"),
      url: findAttr("Conditions")?.url,
    },
    {
      label: "Length",
      value: getAttr("Length") || getAttr("length"),
      url: findAttr("Length")?.url ?? findAttr("length")?.url, // ✅ API url (e.g. "under-16-length-in-feet")
    },
    { label: "Sleep", value: getAttr("sleeps"), url: findAttr("sleeps")?.url },
    { label: "ATM", value: getAttr("ATM"), url: findAttr("ATM")?.url }, // ✅ API url (e.g. "under-2000-kg-atm")
    { label: "Tare Mass", value: getAttr("Tare Mass") },
    { label: "Axle Configuration", value: getAttr("Axle Configuration") },

    { label: "Ball Weight", value: getAttr("Ball Weight") },
    {
      label: "Location",
      value: [
        productDetails.region?.value?.replace(/-/g, " "),
        getAttr("Location"),
      ].filter(Boolean).join(", "),
      links: (() => {
        const result: LinkOut[] = [];
        const regionVal = productDetails.region?.value;
        const regionSlug = productDetails.region?.slug;
        const state = getAttr("Location");
        const stateAttr = findAttr("Location");
        const stateSlug = stateAttr?.url?.trim() || `${slugify(state)}-state`;
        if (regionVal && regionSlug) {
          result.push({
            href: `/listings/${stateSlug}/${regionSlug}/`,
            text: regionVal.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          });
        }
        if (state) {
          result.push(
            stateAttr?.url
              ? linkFromApiUrl(stateAttr.url, state)
              : { href: `/listings/${stateSlug}/`, text: state },
          );
        }
        return result.length > 0 ? result : undefined;
      })(),
    },
  ];

  // prefer API url; fallback to old rules if missing
  const linksForSpec = (
    label: string,
    value: string,
    apiUrl?: string,
  ): LinkOut[] | null => {
    const v = (value || "").trim();
    if (!v) return null;

    const L = label.toLowerCase();

    // ✅ Always force clean path for Year (ignore API URL)
    if (L === "year" || L === "years") {
      const s = toInt(v);
      return s ? [{ href: `/listings/${s}-caravans-range/`, text: v }] : null;
    }

    // ✅ Only use API URL for fields that are NOT year-related
    if (apiUrl && apiUrl.trim() && !["year", "years"].includes(L)) {
      return [linkFromApiUrl(apiUrl, v)];
    }

    // ---- fallback logic ----
    if (L === "category" || L === "type") {
      return v.split(",").map((c) => ({
        href: `/listings/${slugify(c.replace(/\s*caravan\s*/gi, " ").trim())}-category/`,
        text: c.trim(),
      }));
    }

    if (L === "make") return [{ href: `/listings/${slugify(v)}/`, text: v }];

    if (L === "model") {
      const makeSlug = findAttr("Make")?.url?.trim().replace(/^\/+|\/+$/g, "") || slugify(makeValue);
      return [{ href: `/listings/${makeSlug}/${slugify(v)}/`, text: v }];
    }

    if (L === "location" || L === "state")
      return [{ href: `/listings/${slugify(v)}-state/`, text: v }];

    if (L === "sleep" || L === "sleeps") {
      const s = toInt(v);
      return s
        ? [{ href: `/listings/under-${s}-people-sleeping-capacity/`, text: v }]
        : null;
    }

    if (L === "length") {
      const s = toInt(v);
      return s
        ? [{ href: `/listings/under-${s}-length-in-feet/`, text: v }]
        : null;
    }

    if (L === "atm") {
      const s = toInt(v);
      return s ? [{ href: `/listings/under-${s}-kg-atm/`, text: v }] : null;
    }

    if (L === "condition" || L === "conditions") {
      return [{ href: `/listings/${slugify(v)}-condition/`, text: v }];
    }

    return null;
  };

  const parseAmount = (v: string | number | undefined) => {
    const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    });

  const reg = parseAmount(product.regular_price);
  const sale = parseAmount(product.sale_price);
  const hasSale = sale > 0 && reg > 0 && sale < reg;
  const save = hasSale ? reg - sale : 0;
  const isPOA = !hasSale && (reg === 0 || Number.isNaN(reg));

  // const handleBackClick = () => {
  //   // Set a flag in sessionStorage before going back
  //   if (typeof window !== "undefined") {
  //     sessionStorage.setItem("forceRefreshOnBack", "true");
  //     window.history.back();
  //   }
  // };
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  const [backReady, setBackReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ✅ Check if user came FROM listings (via referrer OR sessionStorage)
    const saved = sessionStorage.getItem("listingsReturnUrl");
    const referrer = document.referrer;

    if (saved && saved.includes("/listings")) {
      setReturnUrl(saved);
    } else if (referrer && referrer.includes("/listings")) {
      setReturnUrl(referrer);
    }

    setBackReady(true);
  }, []);
  // ✅ Improved back button handler
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // setNavigating(true);
    if (returnUrl) {
      if (window.history.length > 1) {
        window.history.back(); // ✅ real back — preserves scroll + filters
      } else {
        router.push(returnUrl);
      }
      return;
    }

    router.push(makeHref);
  };


  const makeAttrUrl = findAttr("Make")?.url?.trim().replace(/^\/+|\/+$/g, "");
  const makeHref = makeAttrUrl
    ? `/listings/${makeAttrUrl}/`
    : makeValue?.trim()
      ? `/listings/${slugify(makeValue)}/`
      : "/listings/";

  const productId: string | number | undefined =
    product.id ?? pd.id ?? product.name;

  const productSlug: string | undefined = product.slug ?? pd.slug;

  const slug = productSlug || "";
  const sku = productDetails.sku;

  // ---- gallery state ----

  // keep activeImage in sync with main image from API

 

  // function buildImageCandidates(sku?: string, slug?: string) {
  //   if (!sku || !slug) return [];

  //   const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;

  //   return [
  //     `${base}main1.avif`,
  //     ...Array.from({ length: 4 }, (_, i) => `${base}sub${i + 2}.avif`),
  //   ];
  // }
 const [activeImage, setActiveImage] = useState<string>(
  () => {
    const imgs = Array.isArray(productDetails.image_url)
      ? productDetails.image_url.filter(Boolean)
      : [];
    return imgs[0] || "";
  }
);
  // useEffect(() => {
  //   let cancelled = false;

  //   async function loadGallery() {
  //     const candidates = buildImageCandidates(sku, slug);
  //     const valid: string[] = [];

  //     for (const url of candidates) {
  //       const ok = await checkImage(url);
  //       if (ok) valid.push(url);
  //     }

  //     if (cancelled) return;

  //     // ✅ Product page thumbnails
  //     setGalleryImages(valid.slice(0, 4));
  //     setActiveImage(valid[0] || "");

  //     // ✅ Modal logic
  //     setPreloadedImages(valid.slice(0, 10));
  //     setRemainingImages(valid.slice(10));
  //   }

  //   loadGallery();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [sku, slug]);

  // function checkImage(url: string): Promise<boolean> {
  //   return new Promise((resolve) => {
  //     if (typeof window === "undefined") return resolve(false);

  //     const img = document.createElement("img");
  //     img.onload = () => resolve(true);
  //     img.onerror = () => resolve(false);
  //     img.src = url;
  //   });
  // }
 

  const postTrackEvent = async (product_id: number) => {
  try {
    await fetch("/api/track-product/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id }),
    });
  } catch {}
};
 useEffect(() => {
  if (!productDetails?.id) return;

  postTrackEvent(Number(productDetails.id));
}, [productDetails?.id]);
  // ✅ Add these states after allSubs state

  // ✅ Update the useEffect where you load gallery
  // useEffect(() => {
  //   let cancelled = false;

  //   const loadGallery = async () => {
  //     if (!sku || !slug) {
  //       const fallback = (images.length ? images : [main]).filter(Boolean);
  //       if (!cancelled) {
  //         setAllSubs(fallback);
  //         setPreloadedImages(fallback.slice(0, 10));
  //         setRemainingImages(fallback.slice(10));
  //         setActiveImage(fallback[0] || main);
  //       }
  //       return;
  //     }

  //     const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;
  //     const urls: string[] = [];

  //     // 1) MAIN
  //     const mainUrl = `${base}main1.avif`;
  //     const hasMain = await checkImage(mainUrl);
  //     if (hasMain) urls.push(mainUrl);

  //     // 2) First 5 subs (sub2 to sub5) - PRELOAD
  //     for (let i = 2; i <= 10; i++) {
  //       const url = `${base}sub${i}.avif`;
  //       const ok = await checkImage(url);
  //       if (!ok) break;
  //       urls.push(url);
  //     }

  //     // ✅ Set preloaded images immediately
  //     if (!cancelled) {
  //       setPreloadedImages(urls);
  //        setActiveImage(urls[0] || main);
  //     }

  //     // 3) Remaining subs (sub6 to sub70) - LAZY LOAD
  //     const remainingUrls: string[] = [];
  //     for (let i = 11; i <= 80; i++) {
  //       const url = `${base}sub${i}.avif`;
  //       const ok = await checkImage(url);
  //       if (!ok) break;
  //       remainingUrls.push(url);
  //     }

  //     if (!cancelled) {
  //       setRemainingImages(remainingUrls);
  //       setAllSubs([...urls, ...remainingUrls]);
  //     }
  //   };

  //   loadGallery();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [sku, slug, images, main]);

  // const [activeImage, setActiveImage] = useState(main);

 

  // ✅ Set active image when productSubImage loads
  useEffect(() => {
    if (apiImages.length > 0) {
      setActiveImage(apiImages[0]);
    }
  }, [apiImages]);

  return (
    <>
      <section className={`product caravan_dtt sku-${sku}`}>
        <div className="container">
          <div className="content">
            <div className="row justify-content-center">
              {/* Left Column */}
              <div className="col-xl-8 col-lg-8 col-md-12">
                {backReady &&
                  (returnUrl ? (
                    <button
                      type="button"
                      onClick={handleBackClick}
                      className="back_to_search back_to_search_btn"
                      style={{ background: "none", border: "none", padding: 0 }}
                    >
                      <i className="bi bi-chevron-left"></i>
                      Back to Search
                    </button>
                  ) : (
                    <a
                      href={makeHref}
                      className="back_to_search back_to_search_btn"
                    >
                      <i className="bi bi-chevron-left"></i> Back to Similar
                      Caravans
                    </a>
                  ))}

                <div className="product-info left-info">
                  <h1 className="title">{product.name}</h1>

                  <div className="contactSeller__container d-lg-none">
                    <div className="price_section">
                      <div className="price-container">
                        <div className="price-left">
                          <div className="current-price">
                            <bdi>
                              {isPOA || !reg || Number(reg) === 0
                                ? "POA"
                                : hasSale && sale
                                  ? fmt(Number(sale))
                                  : fmt(Number(reg))}
                            </bdi>
                          </div>

                          {hasSale && reg && (
                            <div className="original-price">
                              <s>{fmt(Number(reg))}</s>
                            </div>
                          )}
                        </div>

                        {hasSale && save && Number(save) > 0 && (
                          <div className="price-right">
                            <span className="save-label">Save</span>
                            <span className="save-value">
                              {fmt(Number(save))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                <div className="attributes d-flex align-items-center gap-2 flex-wrap">
  
  {product.location_shortcode && (
    <span className="location_text">
      Location - {product.location_shortcode}
    </span>
  )}

  {product.seller_type && (
    <span className="seller_badge">
      
          {product.seller_type?.replace(/^\w/, c => c.toUpperCase())}           

     </span>
  )}

</div>

                </div>

                <div className="caravan_slider_visible">
                  <button
                    className="hover_link Click-here"
                    onClick={() => setShowModal(true)}
                  />

                  {/* Thumbnails */}
                  <div className="slider_thumb_vertical image_container">
                    <div className="image_mop">
                      {apiImages.slice(0, 4).map((image, i) => (
                        <div className="image_item" key={`${image}-${i}`}>
                          <div className="background_thumb">
                            <Image
                              src={image}
                              width={128}
                              height={96}
                              alt="Thumbnail"
                              unoptimized
                            />
                          </div>

                          <div
                            className="img"
                            onClick={() => setActiveImage(image)}
                          >
                            <Image
                              src={image}
                              width={128}
                              height={96}
                              alt={`Thumb ${i + 1}`}
                              priority={i < 4}
                              unoptimized
                            />
                          </div>
                        </div>
                      ))}
                      <div>
                        <span className="caravan__image_count">
                          {apiImages.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Large Image */}
                  <div className="lager_img_view image_container">
                    <div className="background_thumb">
                       {activeImage && (
                      <Image
                        src={activeImage}
                        width={800}
                        height={600}
                        alt="Large"
                        className="img-fluid"
                        unoptimized
                      />
                       )}
                    </div>
                    <Link href="#">
                      {activeImage && (
                      <Image
                        src={activeImage}
                        width={800}
                        height={600}
                        alt="Large"
                        className="img-fluid"
                        unoptimized
                      />
                      )}
                    </Link>
                  </div>
                </div>

                {/* Tabs */}
                <section className="product-details">
                  <ul className="nav nav-pills">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === "specifications" ? "active" : ""
                          }`}
                        onClick={() => setActiveTab("specifications")}
                      >
                        Specifications
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === "description" ? "active" : ""
                          }`}
                        onClick={() => setActiveTab("description")}
                      >
                        Description
                      </button>
                    </li>
                  </ul>

                  <div className="tab-content mt-3">
                    {activeTab === "specifications" && (
                      <div className="tab-pane fade show active">
                        <div className="content-info text-center pb-0">
                          <div className="additional-info">
                            <ul>
                              {specFields
                                .filter((f) => f.value)
                                .map((f) => {
                                  const links =
                                    f.links ??
                                    linksForSpec(
                                      f.label,
                                      String(f.value),
                                      f.url,
                                    );
                                  const isLength = f.label.toLowerCase() === "length";
                                  const metersLabel = isLength ? ftToMeters(String(f.value)) : null;
                                  return (
                                    <li key={f.label}>
                                      <strong>{f.label}:</strong>{" "}
                                      <span>
                                        {links
                                          ? links.map((lnk, idx) => (
                                            <span key={lnk.href}>
                                              <a
                                                href={lnk.href}

                                              >
                                                {lnk.text}
                                              </a>
                                              {idx < links.length - 1
                                                ? ", "
                                                : ""}
                                            </span>
                                          ))
                                          : String(f.value)}
                                        {metersLabel && <> {metersLabel}</>}
                                      </span>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === "description" && (
                      <div
                        className="tab-pane fade show active product-description"
                        dangerouslySetInnerHTML={{ __html: safeHtml }}
                      />
                    )}
                  </div>
                </section>
                {/* Community Section */}
                
                {/* Mobile Bottom Bar */}
                <div className="fixed-bottom-bar d-lg-none">
                  <button
                    className="btn enbttn_qqr btn-primary w-100 mb-2"
                    onClick={() => setShowModal(true)}
                  >
                    Contact Seller
                  </button>
                  <button
                          className="cravan_buyer"
                          onClick={() => setShowPopup(true)}
                        >
                          Caravan Buyer Safety Checklist <i className="bi bi-info-circle-fill"></i>
                        </button>
                  <p className="terms_text small">
                    By clicking 'Send Enquiry', you agree to Marketplace Network
                    <a href="/privacy-collection-statement">
                      {" "}
                      Collection Statement
                    </a>
                    , <a href="/privacy-policy">Privacy Policy</a>, and{" "}
                    <a href="/terms-conditions">Terms and Conditions</a>.
                  </p>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="col-xl-4 col-lg-4 d-none d-lg-block">
                <div
                  className="product-info-sidebar sticky-top"
                  style={{ top: "80px" }}
                >
                  <div className="contactSeller__container">
                    <div
                      className="price_section"
                      style={{
                        boxShadow: "0px 4px 15px #0000000d",
                        display: "block",
                        border: "1px solid #ddd",
                        padding: "10px 0px",
                        borderRadius: "6px",
                      }}
                    >
                      <div className="divide-2">
                        <div className="price_section border-0">
                          <div className="price-shape">
                            <span className="current">
                              <div>
                                <div className="price-card">
                                  <div className="price-card__left">
                                    {isPOA ? (
                                      <div className="price-card__sale">
                                        POA
                                      </div>
                                    ) : hasSale ? (
                                      <>
                                        <div className="price-card__sale">
                                          {fmt(Number(sale))}{" "}
                                        </div>
                                        <div className="price-card__regular">
                                          <s>{fmt(reg)}</s>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="price-card__sale">
                                        {fmt(reg)}
                                      </div>
                                    )}
                                  </div>

                                  {hasSale && save && (
                                    <>
                                      <div className="price-card__divider" />
                                      <div className="price-card__save">
                                        <div className="price-card__saveLabel">
                                          Save
                                        </div>
                                        <div className="price-card__saveValue">
                                          {save ? fmt(Number(save)) : ""}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="contact_dealer mt-2">
                        <button
                          className="btn btn-primary "
                          onClick={() => setShowModal(true)}
                        >
                          Contact Seller{" "}
                        </button>
                        <button
                          className="cravan_buyer"
                          onClick={() => setShowPopup(true)}
                        >
                          Caravan Buyer Safety Checklist <i className="bi bi-info-circle-fill"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popup */}
              {showPopup && (
                <div className="popup-overlay">
                  <div className="popup-box">

                    <button
                      className="popup-close"
                      onClick={() => setShowPopup(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="100"
                        height="100"
                        viewBox="0 0 64 64"
                      >
                        <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
                      </svg>
                    </button>

                    <h2 className="title">Caravan Buyer Safety Checklist</h2>
                    <p className="subtitle">
                      Follow these steps to reduce the risk of scams when buying a caravan.
                    </p>

                    <div className="safety-wrapper">
                      <div className="safety-left">

                        <h3>Before you buy</h3>

                        <ul className="checklist">

                          <li>
                            <span className="num">1</span>
                            <div>
                              <h4>Check for finance owing</h4>
                              <p>Run a PPSR search before paying.</p>
                            </div>
                            {/* <a href="#" className="btn-secondary">Run PPSR Check</a> */}
                          </li>

                          <li>
                            <span className="num">2</span>
                            <div>
                              <h4>Verify the seller</h4>
                              <p>Confirm identity and speak directly with them.</p>
                            </div>
                          </li>

                          <li>
                            <span className="num">3</span>
                            <div>
                              <h4>Inspect the caravan first</h4>
                              <p>Inspect in person or arrange an inspection.</p>
                            </div>
                          </li>

                          <li>
                            <span className="num">4</span>
                            <div>
                              <h4>Use safe payment methods</h4>
                              <p>Avoid cryptocurrency or overseas transfers.</p>
                            </div>
                          </li>

                          <li>
                            <span className="num">5</span>
                            <div>
                              <h4>Report suspicious listings</h4>
                              <p>Report listings that appear suspicious.</p>
                            </div>
                            {/* <a href="#" className="btn-light">Report Listing</a> */}
                          </li>

                        </ul>

                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Modal */}
              {showModal && (
                <CaravanDetailModal
                  isOpen={showModal}
                  onClose={() => setShowModal(false)}
                  images={apiImages}
                  product={{
                    id: productId,
                    slug: productSlug,
                    name: product.name ?? "",
                    image: activeImage,
                    price: hasSale ? sale : reg,
                    regularPrice: product.regular_price ?? 0,
                    salePrice: product.sale_price ?? 0,
                    isPOA,
                    location: product.location ?? undefined,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>
      {/* ✅ Related Products Section */}
      {/* {relatedProducts.length > 0 && (
        <div
          className="related-products section-padding"
          style={{ position: "relative", zIndex: 0, background: "#ffffffff" }}
        >
          <div className="container">
            <div className="re-title">
              <div className="tpof_tab">
                <h3>Browse Similar Caravans</h3>
              </div>
            </div>
            <div className="similar-products-three position-relative">
               <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={20}
                slidesPerView={4}
                loop={false}
                breakpoints={{
                  320: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
                }}
              >
                {relatedProducts.length === 0
                  ? Array.from({ length: 4 }).map((_, idx) => (
                      <SwiperSlide key={`related-skeleton-${idx}`}>
                        <ProductSkelton />
                      </SwiperSlide>
                    ))
                  : relatedProducts.map((post) => {
                      const href = getProductHref(post);
                      const sku = post.sku;
                      const slug = post.slug;
                      const base = `https://caravansforsale.imagestack.net/800x600/${sku}/${slug}`;

                      const main = `${base}main1.avif`;
                      return (
                        <SwiperSlide key={post.id}>
                          <Link href={href}>
                            <div className="product-card">
                              <div className="img">
                                <Image
                                  src={main}
                                  alt="product"
                                  width={400}
                                  height={250}
                                  unoptimized
                                />
                              </div>
                              <div className="product_de">
                                <div className="info">
                                  <h6 className="category">
                                    <i className="fa-solid fa-location-dot"></i>{" "}
                                    <span>{post.location}</span>
                                  </h6>
                                  <h3 className="title">{post.title}</h3>
                                </div>
                                <div className="price">
                                  {parseAmount(post.regular_price) === 0 ? (
                                    <span>POA</span>
                                  ) : parseAmount(post.sale_price) > 0 &&
                                    parseAmount(post.sale_price) <
                                      parseAmount(post.regular_price) ? (
                                    <>
                                      <del>
                                        {fmt(parseAmount(post.regular_price))}
                                      </del>{" "}
                                      <ins>
                                        {fmt(parseAmount(post.sale_price))}
                                      </ins>
                                    </>
                                  ) : (
                                    <span>
                                      {fmt(parseAmount(post.regular_price))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </SwiperSlide>
                      );
                    })}
              </Swiper>
            </div>
          </div>
        </div>
      )} */}

      {/* ✅ Latest News */}
      <div
        className="related-products latest_blog section-padding"
        style={{ position: "relative", zIndex: 0, background: "#f1f1f1" }}
      >
        <div className="container">
          <div className="news-title">
            <div className="tpof_tab">
              
              <h3>Latest News, Reviews & Advice</h3>
            </div>
          </div>
          <div className="similar-products-three position-relative">
            {/* ✅ Swiper React Component */}
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={20}
              slidesPerView={4}
              loop={false}
              breakpoints={{
                320: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 4 },
              }}
            >
              {blogPosts.length === 0
                ? Array.from({ length: 4 }).map((_, idx) => (
                  <SwiperSlide key={`blog-skeleton-${idx}`}>
                    <ProductSkelton />
                  </SwiperSlide>
                ))
                : blogPosts.map((post) => {
                  const href = getHref(post);
                  return (
                    <SwiperSlide key={post.id}>
                      <a href={href}>
                        <div className="product-card">
                          <div className="img">
                            <Image
                              src={post.image}
                              alt={post.title}
                              width={400}
                              height={250}
                              unoptimized
                            />
                          </div>
                          <div className="product_de">
                            <div className="info">
                              <h5 className="title">{post.title}</h5>
                              <p>{post.excerpt}</p>
                            </div>
                          </div>
                        </div>
                      </a>
                    </SwiperSlide>
                  );
                })}
              {!blogPosts.length && (
                <div className="col-12 py-3 text-muted">No posts found.</div>
              )}
            </Swiper>
          </div>
        </div>

        {navigating && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(2px)",
              zIndex: 9999,
            }}
            aria-live="polite"
          >
            <div className="text-center">
              <Image
                className="loader_image"
                src="/images/loader.gif" // place inside public/images
                alt="Loading..."
                width={80}
                height={80}
                unoptimized
              />{" "}
              <div className="mt-2 fw-semibold">Loading…</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}