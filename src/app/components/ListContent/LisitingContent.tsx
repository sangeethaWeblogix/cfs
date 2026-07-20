"use client";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import Skelton from "../skelton";
import { useEffect, useMemo, useRef, useState } from "react";
import { haversineKm } from "@/utils/distanceCalc";
import { toSlug } from "@/utils/seo/slug";
import ImageWithSkeleton from "../ImageWithSkeleton";
import { useEnquiryForm } from "./enquiryform";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useBanners } from "@/components/BannerHandler";
import { useBannerTracking } from "@/hooks/useBannerTracking";

interface Product {
  id: number;
  name: string;
  length: string;
  kg: string;
  regular_price: string;
  sale_price?: string;
  price_difference?: string;
  image: string;
  link: string;
  condition: string;
  location?: string;
  region?: string;
  suburb?: string;
  pincode?: string;
  categories?: string[];
  people?: string;
  make?: string;
  slug?: string;
  description?: string;
  sku?: string;
  gallery?: string[];
  // Include additional properties that might come from API
  list_page_title?: string;
  weight?: string;
  price?: string;
  image_format?: string[];
  thumbnail?: string;
  url?: string;
  sleeps?: string;
  manufacturer?: string;
  is_exclusive?: boolean;
  is_premium?: boolean;
  image_url?: string[];
  seller_type?: string;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total_products: number; // ✅ match your API key
  total_pages: number;
}
export interface Filters {
  category?: string;
  make?: string;
  location?: string | null;
  from_price?: string | number; // ✅ add this
  to_price?: string | number;
  condition?: string;
  sleeps?: string;
  states?: string;
  minKg?: string | number;
  maxKg?: string | number;
  from_year?: number | string;
  to_year?: number | string;
  from_length?: string | number;
  to_length?: string | number;
  model?: string;
  state?: string;
  region?: string;
  suburb?: string;
  pincode?: string;
  radius_kms?: string | number;
  orderby?: string;
  slug?: string | undefined;
}
interface Props {
  products: Product[];
  data: Product[];
  pagination: Pagination;
  onNext: () => void;
  onPrev: () => void;
  onFilterChange: (filters: Filters) => void;
  currentFilters: Filters;
  preminumProducts: Product[];
  fetauredProducts: Product[];
  exculisiveProducts: Product[];
  isMainLoading: boolean;
  isFeaturedLoading: boolean;
  isPremiumLoading: boolean;
  // isNextLoading: boolean;
  pageTitle: string;
  initialDistances?: Record<string, number>;
}

function useProductDistances(
  searchPincode: string | undefined,
  products: Product[],
  initialDistances?: Record<string, number>
): Map<string, number | null> {
  const [coordsCache, setCoordsCache] = useState<Record<string, [number, number] | null>>({});
  const [fetchedDistances, setFetchedDistances] = useState<Record<string, number> | null>(null);

  const pincodeKey = useMemo(
    () =>
      [...new Set(products.map((p) => p.pincode).filter(Boolean))].sort().join(","),
    [products]
  );

  useEffect(() => {
    if (!searchPincode) return;
    const productPincodes = products.map((p) => p.pincode).filter((p): p is string => !!p && /^\d{4}$/.test(p));
    const uniquePincodes = [...new Set([searchPincode, ...productPincodes])];
    if (uniquePincodes.length === 0) return;

    fetch(`/api/coords/?p=${uniquePincodes.join(",")}`)
      .then((r) => r.json())
      .then((data: Record<string, [number, number] | null>) => {
        setCoordsCache(data);
        const fromCoords = data[searchPincode];
        if (!fromCoords) return;
        const computed: Record<string, number> = {};
        for (const pincode of productPincodes) {
          const toCoords = data[pincode];
          if (toCoords) computed[pincode] = haversineKm(fromCoords[0], fromCoords[1], toCoords[0], toCoords[1]);
        }
        setFetchedDistances(computed);
      })
      .catch(() => {});
  }, [searchPincode, pincodeKey]);

  return useMemo(() => {
    const map = new Map<string, number | null>();
    if (!searchPincode) return map;
    const source = fetchedDistances ?? initialDistances;
    if (!source) return map;
    for (const product of products) {
      if (!product.pincode) continue;
      const dist = source[product.pincode];
      map.set(product.pincode, dist != null ? dist : null);
    }
    return map;
  }, [searchPincode, fetchedDistances, initialDistances, pincodeKey]);
}

function formatLengthWithMeters(length: string): string {
  if (!length) return length;
  const num = parseFloat(length);
  if (isNaN(num)) return length;
  const meters = (num * 0.3048).toFixed(1);
  const ftLabel = /ft/i.test(length) ? length.trim() : `${num}ft`;
  return `${ftLabel} (${meters}m)`;
}

export default function ListingContent({
  products,
  pagination,
  onNext,
  onPrev,
  onFilterChange,
  currentFilters,
  preminumProducts,
  fetauredProducts,
  exculisiveProducts,
  isFeaturedLoading,
  isPremiumLoading,
  isMainLoading,
  // isNextLoading,
  pageTitle,
  initialDistances,
}: Props) {
  const [swiperActivated, setSwiperActivated] = useState<
    Record<number, boolean>
  >({});

  const [showInfo, setShowInfo] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lazyImages, setLazyImages] = useState<{ [key: string]: string[] }>({});
  const [loadedAll, setLoadedAll] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();
  const [isOrderbyLoading, setIsOrderbyLoading] = useState(false);
  const [mergedProducts, setMergedProducts] = useState<Product[]>([]);
  const [navigating, setNavigating] = useState(false);
  const [swiperKey, setSwiperKey] = useState(0);

  const pathname = usePathname();

  const allProducts = useMemo(
    () => [...products, ...preminumProducts, ...fetauredProducts, ...exculisiveProducts],
    [products, preminumProducts, fetauredProducts, exculisiveProducts]
  );
  const distanceMap = useProductDistances(
    currentFilters.suburb ? (currentFilters.pincode as string | undefined) : undefined,
    allProducts,
    initialDistances
  );


  useEffect(() => {
    try {
      sessionStorage.setItem(
        "listingsReturnUrl",
        window.location.pathname + window.location.search,
      );
    } catch { }
  }, []);

  useEffect(() => {
    // 🔥 Route finished changing → stop loader
    setNavigating(false);
  }, [pathname]);

  const goToProduct = (href: string) => {
    try {
      sessionStorage.setItem("cameFromListings", "true");
      sessionStorage.setItem(
        "listingsReturnUrl",
        window.location.pathname + window.location.search,
      );
    } catch { }

    window.location.href = href;
  };

  useEffect(() => {
    const cameBack = sessionStorage.getItem("cameFromListings");

    if (cameBack) {
      // 🔁 force swiper remount
      setSwiperKey((k) => k + 1);

      // optional: reset activation map
      setSwiperActivated({});
      setLazyImages({});
      setLoadedAll({});

      sessionStorage.removeItem("cameFromListings");
    }
  }, []);

  // Reset swiper state when products change (filter apply) — prevents stale images
  useEffect(() => {
    setSwiperKey((k) => k + 1);
    setSwiperActivated({});
    setLazyImages({});
    setLoadedAll({});
  }, [products]);

  const handleViewDetails = (
    e: React.MouseEvent,
    productId: number,
    href: string,
  ) => {
    e.preventDefault(); // stop <Link> default
    e.stopPropagation(); // stop bubbling to parent

    // 🔁 tracking + session flag
    handleProductClick(productId);

    // 🔁 navigate
    goToProduct(href);
  };

  // console.log("data-prod", products);

  // console.log("data-product", exculisiveProducts);
  // console.log("data-premium", preminumProducts);
  // console.log("data-featu", fetauredProducts);
  // const handleChange = (e) => {
  //   setOrderBy(e.target.value);
  // };
  const allowShuffleRef = useRef(false);
  const didShuffleRef = useRef(false);

  const enquiryProduct = selectedProduct
    ? {
      id: selectedProduct.id,
      slug: selectedProduct.slug,
      name: selectedProduct.name,
    }
    : {
      id: 0,
      slug: "",
      name: "",
    };

  const { form, errors, touched, submitting, setField, onBlur, onSubmit } =
    useEnquiryForm(enquiryProduct);

  const MAX_SWIPER_IMAGES = 5;

  const getFirstImage = (item: Product): string | undefined => {
    return item.image_format?.[0] || item.image_url?.[0] || item.image || undefined;
  };

  const getInitialSlides = (item: Product): string[] => {
    if (Array.isArray(item.image_format) && item.image_format.length > 0)
      return item.image_format.slice(0, 2).filter(Boolean).map((img) => `${img}`);
    if (Array.isArray(item.image_url) && item.image_url.length > 0)
      return item.image_url.slice(0, 2).filter(Boolean).map((img) => `${img}`);
    if (item.image) return [item.image];
    return [];
  };

  const getRemainingImages = (item: Product): string[] => {
    if (Array.isArray(item.image_format) && item.image_format.length > 0)
      return item.image_format.slice(0, MAX_SWIPER_IMAGES).map((img) => `${img}`);
    if (Array.isArray(item.image_url) && item.image_url.length > 0)
      return item.image_url.slice(0, MAX_SWIPER_IMAGES).map((img) => `${img}`);
    if (item.image) return [item.image];
    return [];
  };

  const loadRemaining = (item: Product) => {
    if (loadedAll[item.id]) return;

    const images = getRemainingImages(item);

    setLazyImages((prev) => ({
      ...prev,
      [item.id]: images,
    }));

    setLoadedAll((prev) => ({
      ...prev,
      [item.id]: true,
    }));
  };

  // Remove all the lazy loading state and just load all images immediately
  // const getIP = async () => {
  //   try {
  //     const res = await fetch("https://api.ipify.org?format=json");
  //     const data = await res.json();
  //     return data.ip || "";
  //   } catch {
  //     return "";
  //   }
  // };
  // const postTrackClick = async (product_id: number) => {
  //   try {
  //     await fetch("/api/track-click", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ product_id }),
  //     });
  //   } catch {}
  // };
  const handleProductClick = (id: number) => {
    // postTrackClick(id);
    // Allow product page to show "Back to Search"
    sessionStorage.setItem("cameFromListings", "true");
  };

  const isRefreshRef = useRef(false);

  useEffect(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    if (nav?.type === "reload") {
      isRefreshRef.current = true;
    }
  }, []);

  // const postTrackEvent = async (product_id: number) => {
  //   try {
  //     await fetch("/api/track", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ product_id }),
  //     });
  //   } catch {}
  // };

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };


  
  // const hasShuffledRef = useRef(false);

  const buildMergedProducts = (normal: Product[]) => {
    const premium = preminumProducts || [];
    const merged: Product[] = [];

    // ✅ No exclusive insertion here anymore
    normal.forEach((item) => {
      merged.push(item);
    });

    // Premium fixed index (unchanged)
    if (merged.length >= 3 && premium.length > 0) {
      merged.splice(2, 0, { ...premium[0], is_premium: true });
      if (premium.length > 1) {
        merged.splice(3, 0, { ...premium[1], is_premium: true });
      }
    }

    return merged;
  };
  // useEffect(() => {
  //   mergedProducts.forEach((item) => {
  //     if (!loadedAll[item.id]) {
  //       loadRemaining(item);
  //     }
  //   });
  // }, [mergedProducts]);
  useEffect(() => {
    const TAB_KEY = "listings_tab_opened";

    if (!sessionStorage.getItem(TAB_KEY)) {
      allowShuffleRef.current = true; // ✅ new tab
      sessionStorage.setItem(TAB_KEY, "true");
    } else {
      allowShuffleRef.current = false; // ❌ same tab
    }
  }, []);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const premiumIds = new Set(
      (preminumProducts || []).map((p) => String(p.id)),
    );

    let normal = products.filter((p) => !premiumIds.has(String(p.id)));

    const orderbyFromUrl = currentFilters.orderby;

    const shouldShuffle =
      allowShuffleRef.current &&
      !didShuffleRef.current && // only shuffle once per session
      normal.length >= 23 &&
      !orderbyFromUrl;

    if (shouldShuffle) {
      normal = shuffleArray([...normal]);
      didShuffleRef.current = true;
    }

    setMergedProducts(buildMergedProducts(normal));
  }, [products, preminumProducts, exculisiveProducts, currentFilters.orderby]);

  // useEffect(() => {
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       entries.forEach((entry) => {
  //         if (entry.isIntersecting) {
  //           const id = Number(entry.target.getAttribute("data-product-id"));
  //           if (id) postTrackEvent(id);
  //           observer.unobserve(entry.target);
  //         }
  //       });
  //     },
  //     { threshold: 0.3 },
  //   );
  //   document.querySelectorAll(".product-card[data-product-id]").forEach((el) => observer.observe(el));
  //   return () => observer.disconnect();
  // }, [mergedProducts]);

  // ✅ Disable background scroll when popup is open
  useEffect(() => {
    if (showInfo || showContact) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showInfo, showContact]);

  // Example placeholder function for product links

  // const imageUrl = "public/favicon.ico";
  const getHref = (p: Product) => {
    const slug = p.slug?.trim() || toSlug(p.name);
    return slug ? `/product/${slug}/` : ""; // trailing slash optional
  };

  const orderby = currentFilters.orderby ?? "featured";
  useEffect(() => {
    if (products && products.length > 0) {
      setIsOrderbyLoading(false);
    }
  }, [products]);

  function splitCountAndTitle(pageTitle: string) {
    const match = pageTitle.match(/^(\d+)\s+(.*)$/);

    if (!match) {
      return { count: null, text: pageTitle };
    }

    return {
      count: match[1], // "3279"
      text: match[2], // "Off Road Caravans for sale in Australia"
    };
  }

  const { count, text } = splitCountAndTitle(pageTitle);

  const AUS_ABBR: Record<string, string> = {
    VICTORIA: "VIC",
    "NEW SOUTH WALES": "NSW",
    QUEENSLAND: "QLD",
    "SOUTH AUSTRALIA": "SA",
    "WESTERN AUSTRALIA": "WA",
    TASMANIA: "TAS",
    "NORTHERN TERRITORY": "NT",
    "AUSTRALIAN CAPITAL TERRITORY": "ACT",
  };

  const getLocationLabel = (item: Product): string | undefined => {
    const stateAbbr = AUS_ABBR[(currentFilters.state ?? "").toUpperCase()] ?? (currentFilters.state ?? "").toUpperCase();
    if (currentFilters.region) {
      const regionName = (currentFilters.region as string).replace(/\b\w/g, (c) => c.toUpperCase());
      return `${regionName} Region, ${stateAbbr}`;
    }
    return item.location;
  };

  const activateSwiper = (item: Product) => {
    if (swiperActivated[item.id]) return;

    setSwiperActivated((prev) => ({
      ...prev,
      [item.id]: true,
    }));

    loadRemaining(item);
  };

  const { matchedBanners, isMobile } = useBanners();
  const { bannerRefs, trackClick } = useBannerTracking(matchedBanners);
   const rightBanners = matchedBanners.filter(
  (b) => b.position === "right" && b.placement === "listings"
);
const [currentBanner, setCurrentBanner] = useState<typeof rightBanners[0] | null>(null);
 useEffect(() => {
  const shuffled = shuffleArray(rightBanners);
  setCurrentBanner(shuffled[0] ?? null);
}, [rightBanners]);
  return (
    <>

      <div className="col-lg-9">
        <div className="top-filter mb-10">
          <div className="row align-items-center">
            <div className="col-lg-8 col-md-8 col-12 show_count_wrapper mb-2 mb-md-0">
              <h1 className="show_count d-inline fw-bolder">
                {count && <>{count} </>}
                {text}
              </h1>
            </div>

            <div className="col-lg-4 col-md-4 col-12">
              <div className="r-side">
                <form className="woocommerce-ordering" method="get">
                  <div className="form-group shot-buy">
                    <select
                      name="orderby"
                      className="orderby form-select"
                      aria-label="Shop order"
                      value={orderby}
                      onChange={(e) => {
                        const value = e.target.value;
                        setIsOrderbyLoading(true);
                        onFilterChange({
                          ...currentFilters,
                          orderby: value === "featured" ? undefined : value,
                        });
                      }}
                    >
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price (Low to High)</option>
                      <option value="price-desc">Price (High to Low)</option>
                      <option value="year-desc">Year Made (High to Low)</option>
                      <option value="year-asc">Year Made (Low to High)</option>
                    </select>

                    {/* <input type="hidden" name="paged" value={filters.orderby} /> */}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="dealers-section product-type">
          <div className="other_items">
            <div className="related-products">
              {isMainLoading || mergedProducts.length === 0 || isOrderbyLoading ? (
                <div className="skeleton-appear"><Skelton count={6} /></div>
              ) : (
                <div className="row g-3 cards-loaded">
                  {mergedProducts.map((item, index) => {
                    const href = getHref(item);
                    const isPriority = index === 0;
                    // const resizedBase = getResizedBase(item);
                    // const imgs = lazyImages[item.id] ?? [];
                    const firstImage = getFirstImage(item);
                    const isActive = swiperActivated[item.id];
                    const initialSlides = getInitialSlides(item);
                    const slides = isActive
                      ? (lazyImages[item.id] ?? [])
                      : initialSlides;

                    return (
                      <div
                        className="col-lg-6 col-sm-6 col-md-6 mb-0"
                        key={index}
                      >
                        <a
                          href={href}
                          className="lli_head"
                          onClick={(e) => {
                            e.preventDefault();
                            goToProduct(href);
                          }}
                        >
                          <div
                            className={`product-card sku-${item.sku}`}
                            data-product-id={item.id}
                          >
                            <div className="img">
                              <div className="background_thumb">
                                <ImageWithSkeleton
                                  src={firstImage}
                                  priority={isPriority}
                                  alt="Caravan"
                                  width={800}
                                  height={600}
                                />
                              </div>
                              <div
                                className="main_thumb position-relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {item.is_exclusive && (
                                  <span className="lab">Spotlight Van</span>
                                )}

                                <Swiper
                                  key={`${swiperKey}-${item.id}`}
                                  modules={[Navigation, Pagination]}
                                  slidesPerView={1}
                                  navigation
                                  pagination={{ clickable: true }}
                                  watchOverflow={false} // 🔥 IMPORTANT
                                  allowTouchMove={true}
                                  onMouseEnter={() => {
                                    if (!swiperActivated[item.id]) {
                                      activateSwiper(item);
                                    }
                                  }}
                                  onTouchStart={() => {
                                    if (!swiperActivated[item.id]) {
                                      activateSwiper(item);
                                    }
                                  }}
                                  onSlideChange={() => {
                                    if (!swiperActivated[item.id]) {
                                      activateSwiper(item);
                                    }
                                  }}
                                  onNavigationNext={() => {
                                    if (!swiperActivated[item.id]) {
                                      activateSwiper(item);
                                    }
                                  }}
                                  onNavigationPrev={() => {
                                    if (!swiperActivated[item.id]) {
                                      activateSwiper(item);
                                    }
                                  }}
                                  className="main_thumb_swiper"
                                >
                                  {slides.map((img, i) => (
                                    <SwiperSlide key={i}>
                                      <div className="thumb_img">
                                        <ImageWithSkeleton
                                          src={img}
                                          alt={`Caravan ${i + 1}`}
                                          width={800}
                                          height={600}
                                          eager
                                          objectFit="contain"
                                          priority={i === 0 && isPriority}
                                          sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 400px"
                                        />
                                      </div>
                                    </SwiperSlide>
                                  ))}
                                </Swiper>
                              </div>
                            </div>

                            <div className="product_de">
                              <div className="info">
                                {item.name && (
                                  <h3
                                    className="title cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();

                                      goToProduct(href);
                                    }}
                                  >
                                    {item.name}
                                  </h3>
                                )}
                                {getLocationLabel(item) && (
                                  <p className="listing_location">
                                    <i className="fa-solid fa-location-dot"></i>{" "}
                                    {getLocationLabel(item)}
                                  </p>
                                )}
                                <div style={{ display: "none" }} data-suburb={item.suburb}>
                                  suburb: {item.suburb}
                                </div>
                              </div>

                              {/* --- PRICE SECTION --- */}
                              <div className="price">
                                <div className="metc2">
                                  <h5 className="slog">
                                    {(() => {
                                      const rawRegular =
                                        item.regular_price || "";
                                      const rawSale = item.sale_price || "";
                                      const cleanRegular =
                                        rawRegular.replace(/[^0-9.]/g, "");
                                      const regNum =
                                        Number(cleanRegular) || 0;
                                      const cleanSale = rawSale.replace(
                                        /[^0-9.]/g,
                                        "",
                                      );
                                      const saleNum =
                                        Number(cleanSale) || 0;

                                      if (regNum === 0) {
                                        return <>POA</>;
                                      }

                                      if (saleNum > 0) {
                                        return (
                                          <>
                                            <del>{rawRegular}</del>{" "}
                                            {rawSale}
                                          </>
                                        );
                                      }

                                      return <>{rawRegular}</>;
                                    })()}
                                  </h5>

                                    {/* ✅ Show SAVE only if > $0 */}
                                    {(() => {
                                      const cleanDiff = (
                                        item.price_difference || ""
                                      ).replace(/[^0-9.]/g, "");
                                      const diffNum = Number(cleanDiff) || 0;
                                      return diffNum > 0 ? (
                                        <p className="card-price">
                                          <span>SAVE</span>{" "}
                                          {item.price_difference}
                                        </p>
                                      ) : null;
                                    })()}
                                    {item.is_premium && (
                                      <div className="more_info">
                                        <div className="informat">
                                          <span className="premium_van">
                                            <i className="fa-solid fa-star"></i>{" "}
                                            Premium
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* --- DETAILS LIST --- */}
                              <ul className="vehicleDetailsWithIcons simple">
                                {/* {item.condition && (
                                    <li>
                                      <span className="attribute3">
                                        {item.condition}
                                      </span>
                                    </li>
                                  )} */}

                                {item.categories &&
                                  item.categories.length > 0 && (
                                    <li className="attribute3_list">
                                      <span className="attribute3">
                                        {item.categories[0]}
                                      </span>
                                    </li>
                                  )}

                                {item.length && (
                                  <li>
                                    <span className="attribute3">
                                      {formatLengthWithMeters(item.length)}
                                    </span>
                                  </li>
                                )}

                                {item.kg && (
                                  <li>
                                    <span className="attribute3">
                                      {item.kg}
                                    </span>
                                  </li>
                                )}

                                {item.make && (
                                  <li>
                                    <span className="attribute3">
                                      {item.make}
                                    </span>
                                  </li>
                                )}
                              </ul>

                              {/* --- CONDITION + SELLER --- */}
                              {(item.condition || item.seller_type) && (
                                <div className="bottom_mid">
                                  {item.condition && (
                                    <span>
                                      <i className="bi bi-check-circle-fill"></i>{" "}
                                      Condition {item.condition}
                                    </span>
                                  )}
                                  {item.seller_type && (
                                    <span>
                                      <i className="fa-solid fa-circle-info"></i>{" "}
                                      {item.seller_type?.replace(/^\w/, (c) =>
                                        c.toUpperCase(),
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* --- BUTTONS --- */}
                              <div className="bottom_button">
                                <button
                                  className="btn"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedProduct(item);
                                    setShowContact(true);
                                  }}
                                >
                                  Contact Seller
                                </button>

                                <button
                                  className="btn btn-primary"
                                  onClick={(e) =>
                                    handleViewDetails(e, item.id, href)
                                  }
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              
            </div>
            
          </div>
        </div>
        <div className="pagination-wrapper mt-4">
          <nav className="woocommerce-pagination custom-pagination mt-4">
            <ul className="pagination-icons">
              <li className="">
                <span>
                  <button
                    onClick={onPrev}
                    disabled={pagination.current_page === 1}
                    className="prev-icon"
                  >
                    Back
                  </button>
                </span>
              </li>
              <li className="page-count">
                {" "}
                page {pagination.current_page} of {pagination.total_pages}
              </li>
              <li className="">
                <button
                  className="next-icon"
                  onClick={onNext}
                  disabled={pagination.current_page === pagination.total_pages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      {/* {exculisiveProducts.length === 0 || isOrderbyLoading ? (
        <Skelton count={1} />
      ) : ( */}
      <div className="col-lg-3">
        <div className="sticky_spot hidden-xs hidden-sm">
          <div className="related-products">
            <div className="other_items">
              {exculisiveProducts.map((item, index) => {
                const href = getHref(item);
                const isPriority = index === 0;
                // const resizedBase = getResizedBase(item);
                // const imgs = lazyImages[item.id] ?? [];
                const firstImage = getFirstImage(item);
                const isActive = swiperActivated[item.id];
                const slides = isActive
                  ? (lazyImages[item.id] ?? [])
                  : firstImage
                    ? [firstImage, firstImage]
                    : [];

                return (
                  <a
                    key={index}
                    href={href}
                    className="lli_head"
                    onClick={(e) => {
                      e.preventDefault();
                      goToProduct(href);
                    }}
                  >
                    {" "}
                    <div className="product-card">
                      <div className="img">
                        <span className="lab">Spotlight Van</span>
                        <Image
                          src={firstImage || "/images/placeholder.png"}
                          alt="Caravan"
                          width={400}
                          height={300}
                          className="w-100 h-100 object-fit-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="product_de">
                        <div className="info">
                          {item.name && (
                            <h3
                              className="title cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                goToProduct(href);
                              }}
                            >
                              {item.name}
                            </h3>
                          )}
                          {getLocationLabel(item) && (
                            <p className="listing_location">
                              <i className="fa-solid fa-location-dot"></i>{" "}
                              {getLocationLabel(item)}
                            </p>
                          )}
                          <div style={{ display: "none" }} data-suburb={item.suburb}>
                            suburb: {item.suburb}
                          </div>
                        </div>

                        <div className="price">
                          <div className="metc2">
                            <h5 className="slog">
                              {(() => {
                                const rawRegular = item.regular_price || "";
                                const rawSale = item.sale_price || "";
                                const cleanRegular = rawRegular.replace(
                                  /[^0-9.]/g,
                                  "",
                                );
                                const regNum = Number(cleanRegular) || 0;
                                const cleanSale = rawSale.replace(
                                  /[^0-9.]/g,
                                  "",
                                );
                                const saleNum = Number(cleanSale) || 0;

                                if (regNum === 0) {
                                  return <>POA</>;
                                }

                                if (saleNum > 0) {
                                  return (
                                    <>
                                      <del>{rawRegular}</del> {rawSale}
                                    </>
                                  );
                                }

                                return <>{rawRegular}</>;
                              })()}
                            </h5>

                              {/* ✅ Show SAVE only if > $0 */}
                              {(() => {
                                const cleanDiff = (
                                  item.price_difference || ""
                                ).replace(/[^0-9.]/g, "");
                                const diffNum = Number(cleanDiff) || 0;
                                return diffNum > 0 ? (
                                  <p className="card-price">
                                    <span>SAVE</span> {item.price_difference}
                                  </p>
                                ) : null;
                              })()}

                              {item.is_premium && (
                                <div className="more_info">
                                  <div className="informat">
                                    <span className="premium_van">
                                      <i className="fa-solid fa-star"></i> Premium
                                    </span>
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                        <ul className="vehicleDetailsWithIcons simple">
                          {item.categories && item.categories.length > 0 && (
                            <li className="attribute3_list">
                              <span className="attribute3">
                                {item.categories[0]}
                              </span>
                            </li>
                          )}
                          {item.length && (
                            <li>
                              <span className="attribute3">{formatLengthWithMeters(item.length)}</span>
                            </li>
                          )}

                          {item.kg && (
                            <li>
                              <span className="attribute3">{item.kg}</span>
                            </li>
                          )}

                          {item.make && (
                            <li>
                              <span className="attribute3">{item.make}</span>
                            </li>
                          )}
                        </ul>

                        {(item.condition || item.seller_type) && (
                          <div className="bottom_mid">
                            {item.condition && (
                              <span>
                                <i className="bi bi-check-circle-fill"></i>{" "}
                                Condition {item.condition}
                              </span>
                            )}
                            {item.seller_type && (
                              <span>
                                <i className="fa-solid fa-circle-info"></i>{" "}
                                {item.seller_type?.replace(/^\w/, (c) =>
                                  c.toUpperCase(),
                                )}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="bottom_button">
                          <button
                            className="btn btn-primary"
                            onClick={(e) => handleViewDetails(e, item.id, href)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

          </div>
        </div>
        <div className="display_ad listing_sticky">
          {false &&
  currentBanner != null && (
              <a
                key={currentBanner!.id}
                      ref={(el) => { bannerRefs.current[0] = el; }}

                data-banner-id={currentBanner!.id}
                href={currentBanner!.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="banner_ad_now mb-0"
                onClick={() => trackClick(currentBanner!.id)}
              >
                <div className={isMobile ? "banner-mobile" : "banner-desktop"}>
                  <Image
                    src={currentBanner!.image_url}
                    alt={currentBanner!.name}
                    width={isMobile ? 600 : 1200}
                    height={isMobile ? 300 : 200}
                    priority
                  />
                </div>
              </a>
            )}
        </div>
      </div>
      {/* )} */}
      {showInfo && selectedProduct && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button className="close-popup" onClick={() => setShowInfo(false)}>
              ×
            </button>
            <h4>Description</h4>

            <div className="popup-content">
              {selectedProduct.description ? (
                <div
                  className="description-text"
                  dangerouslySetInnerHTML={{
                    __html: selectedProduct.description.replace(
                      /\\r\\n/g,
                      "<br/>",
                    ),
                  }}
                />
              ) : (
                <p>No description available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === Contact Dealer Popup === */}
      {showContact && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button
              type="button"
              className="close-popup"
              onClick={() => {
                setShowContact(false);
                setSelectedProduct(null); // reset selected product
              }}
            >
              ×
            </button>

            <h4>Contact Seller</h4>

            <div className="sidebar-enquiry">
              <form className="wpcf7-form" noValidate onSubmit={onSubmit}>
                <div className="form">
                  {/* Name */}
                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-name"
                        className="wpcf7-form-control"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        onBlur={() => onBlur("name")}
                        required
                        autoComplete="off"
                      />
                      <label htmlFor="enquiry2-name">Name</label>
                    </p>
                    {touched.name && errors.name && (
                      <div className="cfs-error">{errors.name}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-email"
                        className="wpcf7-form-control"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        onBlur={() => onBlur("email")}
                        required
                        autoComplete="off"
                      />
                      <label htmlFor="enquiry2-email">Email</label>
                    </p>
                    {touched.email && errors.email && (
                      <div className="cfs-error">{errors.email}</div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="form-item">
                    <p className="phone_country">
                      <span className="phone-label">+61</span>
                      <input
                        id="enquiry2-phone"
                        className="wpcf7-form-control"
                        inputMode="numeric"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        onBlur={() => onBlur("phone")}
                        required
                        autoComplete="off"
                      />
                      <label htmlFor="enquiry2-phone">Phone</label>
                    </p>
                    {touched.phone && errors.phone && (
                      <div className="cfs-error">{errors.phone}</div>
                    )}
                  </div>

                  {/* Postcode */}
                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-postcode"
                        className="wpcf7-form-control"
                        inputMode="numeric"
                        maxLength={4}
                        value={form.postcode}
                        onChange={(e) => setField("postcode", e.target.value)}
                        onBlur={() => onBlur("postcode")}
                        required
                        autoComplete="off"
                      />
                      <label htmlFor="enquiry2-postcode">Postcode</label>
                    </p>
                    {touched.postcode && errors.postcode && (
                      <div className="cfs-error">{errors.postcode}</div>
                    )}
                  </div>

                  {/* Message */}
                  <div className="form-item">
                    <p>
                      <label htmlFor="enquiry4-message">
                        Message (optional)
                      </label>
                      <textarea
                        id="enquiry4-message"
                        className="wpcf7-form-control wpcf7-textarea"
                        value={form.message}
                        onChange={(e) => setField("message", e.target.value)}
                      ></textarea>
                    </p>
                  </div>

                  <p className="terms_text">
                    By clicking &lsquo;Send Enquiry&lsquo;, you agree to
                    Marketplace Network{" "}
                    <a href="/privacy-collection-statement" target="_blank">
                      Collection Statement
                    </a>
                    ,{" "}
                    <a href="/privacy-policy" target="_blank">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="/terms-conditions" target="_blank">
                      Terms and Conditions
                    </a>
                    .
                  </p>

                  <div className="submit-btn">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send Enquiry"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
