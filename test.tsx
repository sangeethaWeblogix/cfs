
 
"use client";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import Skelton from '../skelton'
import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { toSlug } from "@/utils/seo/slug";
import ImageWithSkeleton from "../ImageWithSkeleton";

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
  categories?: string[];
  people?: string;
  make?: string;
  slug?: string;
  description?: string;
  sku?: string;

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
  orderby?: string;
  slug?: string | undefined;
}
interface Props {
  products: Product[];
  data: Product[];
  pagination: Pagination;
  onNext: () => void;
  onPrev: () => void;
  metaTitle: string; // Add metaTitle prop
  metaDescription: string; // Add metaDescription prop
  onFilterChange: (filters: Filters) => void;
  currentFilters: Filters;
  preminumProducts: Product[];
  fetauredProducts: Product[];
  exculisiveProducts: Product[];
  isMainLoading: boolean;
  isFeaturedLoading: boolean;
  isPremiumLoading: boolean;
  isNextLoading: boolean;
  pageTitle: string;
}

export default function ListingContent({
  products,
  pagination,
  onNext,
  onPrev,
  metaTitle,
  metaDescription,
  onFilterChange,
  currentFilters,
  preminumProducts,
  fetauredProducts,
  exculisiveProducts,
  isFeaturedLoading,
  isPremiumLoading,
  isMainLoading,
  isNextLoading,
  pageTitle,
}: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
const [lazyImages, setLazyImages] = useState<{ [key: string]: string[] }>({});
const [loadedAll, setLoadedAll] = useState<{ [key: string]: boolean }>({});
 
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  // console.log("data-prod", products);

  // console.log("data-product", exculisiveProducts);
  // console.log("data-premium", preminumProducts);
  // console.log("data-featu", fetauredProducts);
  // const handleChange = (e) => {
  //   setOrderBy(e.target.value);
  // };

  
const getFirstImage = (item: Product) => {
  if (!item.sku || !item.slug) return "/images/image.pngp";

  return `https://caravansforsale.imagestack.net/450x338/${item.sku}/${item.slug}main1.avif`;
};
 const loadRemaining = (item: Product) => {
  if (!item.sku || !item.slug) return;

  const base = `https://caravansforsale.imagestack.net/450x338/${item.sku}/${item.slug}`;

  const images = [
    `${base}main1.avif`,
    ...Array.from({ length: 5 }, (_, i) => `${base}sub${i + 1}.avif`)
  ];

  setLazyImages((prev) => ({
    ...prev,
    [item.id]: images,
  }));

  setLoadedAll((prev) => ({ 
    ...prev, 
    [item.id]: true 
  }));
};
 
 
// Remove all the lazy loading state and just load all images immediately
 
  const mergedProducts = useMemo(() => {
    const merged: Product[] = [];
    const exclusive = exculisiveProducts || [];
    const normal = products || [];

    let exclusiveIndex = 0;

    for (let i = 0; i < normal.length; i++) {
      merged.push(normal[i]);

      // 🔁 After every 10 products, insert one exclusive product if available
      if ((i + 1) % 10 === 0 && exclusiveIndex < exclusive.length) {
        merged.push({
          ...exclusive[exclusiveIndex],
          name: `${exclusive[exclusiveIndex].name || "Caravan"}`,
        });
        exclusiveIndex++;
      }
    }

    // If there are remaining exclusive products, push them at the end
    while (exclusiveIndex < exclusive.length) {
      merged.push({
        ...exclusive[exclusiveIndex],
        name: `${exclusive[exclusiveIndex].name || "Caravan"}`,
      });
      exclusiveIndex++;
    }

    return merged;
  }, [products, exculisiveProducts]);

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
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return (products || []).filter((p) => {
      const k = String(p?.id ?? p?.slug ?? p?.link);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [products]);
  console.log("data", uniqueProducts);

  // ✅ Helper: generate up to 5 image URLs from SKU
  const getProductImages = (sku?: string, slug?: string): string[] => {
  if (!sku || !slug) return ["/images/image.pngp"];

  const base = `https://caravansforsale.imagestack.net/600x450/${sku}/${slug}`;

  return [
    `${base}main1.avif`,
    ...Array.from({ length: 5 }, (_, i) => `${base}sub${i + 1}.avif`)
  ];
};


  // ✅ Randomly shuffle premium products on each page load
  // ✅ Premium products shuffle after mount
  const [shuffledPremiumProducts, setShuffledPremiumProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!preminumProducts || preminumProducts.length === 0) return;

    // Fisher–Yates shuffle
    const shuffled = [...preminumProducts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setShuffledPremiumProducts(shuffled);
  }, [preminumProducts]);


  return (
    <>
      <Head>
        <title>{metaTitle}</title> {/* Dynamically set title */}
        <meta name="description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="robot" content="index, follow" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Head>

      <div className="col-lg-6 ">
        <div className="top-filter mb-10">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="show_count">
                 <strong>{pageTitle}</strong>  

                
              </h1>
            </div>
            <div className="col-4 d-lg-none d-md-none">
              <button
                type="button"
                className="mobile_fltn navbar-toggler mytogglebutton"
                data-bs-toggle="offcanvas"
                data-bs-target="#mobileFilters"
                aria-controls="mobileFilters"
              >
                <i className="bi bi-search" /> &nbsp;Filter
              </button>
            </div>
            <div className="col-lg-4 col-8">
              <div className="r-side">
                <form className="woocommerce-ordering" method="get">
                  <div className="form-group shot-buy">
                    <select
                      name="orderby"
                      className="orderby form-select"
                      aria-label="Shop order"
                      onChange={(e) =>
                        onFilterChange({
                          orderby: e.target.value || "featured",
                        })
                      }
                      value={currentFilters.orderby ?? "featured"} // <— default to "featured"
                    >
                      <option value="featured">Featured</option>
                      <option value="price_asc">Price (Low to High)</option>
                      <option value="price_desc">Price (High to Low)</option>
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
        {fetauredProducts.length > 0 && (
          <div className="other_items featured_items">
            <div className="related-products">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="featured_head">Featured listings</h3>
                <div className="d-flex gap-2">
                  <button
                    ref={prevRef}
                    className="swiper-button-prev-custom btn btn-light btn-sm"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button
                    ref={nextRef}
                    className="swiper-button-next-custom btn btn-light btn-sm"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
              {isFeaturedLoading ? (
                <Skelton count={3} /> // ✅ show skeletons
              ) : (
                <Swiper
                  modules={[Navigation, Autoplay]}
                  spaceBetween={10}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 1 },
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 2 },
                  }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  navigation={{
                    prevEl: prevRef.current,
                    nextEl: nextRef.current,
                  }}
                  onInit={(swiper) => {
                    if (
                      swiper.params.navigation &&
                      typeof swiper.params.navigation !== "boolean"
                    ) {
                      swiper.params.navigation.prevEl = prevRef.current;
                      swiper.params.navigation.nextEl = nextRef.current;
                      swiper.navigation.init();
                      swiper.navigation.update();
                    }
                  }}
                  className="featured-swiper"
                >
                  {fetauredProducts.map((item, index) => {
                    const href = getHref(item);
                  const images = getProductImages(item.sku, item.slug);
                    const isPriority = index < 5;

                    return (

                      <SwiperSlide key={index}>
                        <Link href={href} prefetch={false}
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem("cameFromListings", "true");
                            }
                          }}>
                          <div className="product-card">
                            <div className="img">
                              <div className="background_thumb">

                                <ImageWithSkeleton
                                  src={images [0]}
                                  alt="Caravan"
                                  width={300}
                                  height={200}
                                 priority={isPriority}  
                                />
                              </div>
                              <div className="main_thumb">
                                <ImageWithSkeleton
                                 src={images [0]}
                                  alt="Caravan"
                                  width={300}
                                  height={200}
                                 priority={isPriority}  
                                />
                              </div>
                            </div>
                            <div className="product_de">
                              <div className="info">
                                {item.name &&
                                  <h3 className="title">{item.name}</h3>
                                }
                              </div>

                              {/* --- PRICE SECTION --- */}
                              {(item.regular_price || item.sale_price || item.price_difference) && (
                                <div className="price">
                                  <div className="metc2">
                                    {(item.regular_price || item.sale_price) && (
                                      <h5 className="slog">
                                        {/* ✅ Stable price rendering: precompute safely */}
                                        {(() => {
                                          const rawRegular = item.regular_price || "";
                                          const rawSale = item.sale_price || "";
                                          const cleanRegular = rawRegular.replace(/[^0-9.]/g, "");
                                          const regNum = Number(cleanRegular) || 0;
                                          const cleanSale = rawSale.replace(/[^0-9.]/g, "");
                                          const saleNum = Number(cleanSale) || 0;

                                          // If regular price is 0 → show POA
                                          if (regNum === 0) {
                                            return <>POA</>;
                                          }

                                          // If sale price exists → show sale and strike-through
                                          if (saleNum > 0) {
                                            return (
                                              <>
                                                <del>{rawRegular}</del> {rawSale}
                                              </>
                                            );
                                          }

                                          // Otherwise → show regular price
                                          return <>{rawRegular}</>;
                                        })()}
                                      </h5>
                                    )}

                                    {/* ✅ Show SAVE only if > $0 */}
                                    {(() => {
                                      const cleanDiff = (item.price_difference || "").replace(/[^0-9.]/g, "");
                                      const diffNum = Number(cleanDiff) || 0;
                                      return diffNum > 0 ? (
                                        <p className="card-price">
                                          <span>SAVE</span> {item.price_difference}
                                        </p>
                                      ) : null;
                                    })()}

                                    <div className="more_info">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setSelectedProduct(item);
                                          setShowInfo(true);
                                        }}
                                      >
                                        <i className="fa fa-info-circle"></i> Info
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}


                              {/* --- DETAILS LIST --- */}
                              <ul className="vehicleDetailsWithIcons simple">
                                {item.condition && (
                                  <li>
                                    <span className="attribute3">
                                      {item.condition}
                                    </span>
                                  </li>
                                )}

                                {item.categories && item.categories.length > 0 && (
                                  <li className="attribute3_list">
                                    <span className="attribute3">
                                      {item.categories.join(", ")}
                                    </span>
                                  </li>
                                )}

                                {item.length && (
                                  <li>
                                    <span className="attribute3">{item.length}</span>
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

                              {/* --- CONDITION + LOCATION --- */}
                              {(item.condition || item.location) && (
                                <div className="bottom_mid">
                                  {item.condition && (
                                    <span>
                                      <i className="bi bi-check-circle-fill"></i>{" "}
                                      Condition {item.condition}
                                    </span>
                                  )}
                                  {item.location && (
                                    <span>
                                      <i className="fa fa-map-marker-alt"></i>{" "}
                                      {item.location}
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
                                    setShowContact(true);
                                  }}
                                >
                                  Contact Seller
                                </button>
                                <button className="btn btn-primary">
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </SwiperSlide>


                    );
                  })}


                </Swiper>
              )}

            </div>
          </div>
        )}
        {/* {premium section } */}
        <div className="dealers-section product-type">
          <div className="other_items">
            <div className="related-products">
              <div className="row g-3">
                
                {shuffledPremiumProducts.map((item, index) => {
                  const href = getHref(item);
                     const isPriority = index < 5;
const imgs = lazyImages[item.id] || [getFirstImage(item)];
                   return (

                    <div className="col-lg-6 mb-0" key={index}>
                      <Link
                        href={href}
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            sessionStorage.setItem("cameFromListings", "true");
                          }
                        }}
                        prefetch={false}
                        className="lli_head"
                      >
                        <div className="product-card">
                          <div className="img">
                            <div className="background_thumb">
                              <ImageWithSkeleton
                                src={imgs [0]}
                                alt="Caravan"
                                width={300}
                                height={200}
                               priority={isPriority}  

                              />
                            </div>

                            <div className="main_thumb position-relative">

                              <span className="lab">Spotlight Van</span>
                              {isPremiumLoading ? (
                                <Skelton count={2} /> // ✅ show skeletons
                              ) : (
                                                  
                 // For Main Products Swiper - FIXED VERSION
<Swiper
  modules={[Navigation, Pagination]}
  spaceBetween={10}
  slidesPerView={1}
  navigation
  pagination={{
    clickable: true,
  }}
  onSlideChange={( ) => {
    if (!loadedAll[item.id]) loadRemaining(item); // Fixed: loadedAll instead of isLoaded
  }}
  onReachBeginning={( ) => {
    if (!loadedAll[item.id]) loadRemaining(item); // Fixed: loadedAll instead of isLoaded
  }}
  onReachEnd={() => {
    if (!loadedAll[item.id]) loadRemaining(item); // Fixed: loadedAll instead of isLoaded
  }}
  className="main_thumb_swiper"
>
  {imgs.map((img, i) => (
    <SwiperSlide key={i}>
      <div className="thumb_img">
        <ImageWithSkeleton
          src={img}
          alt={`Caravan ${i + 1}`}
          width={300}
          height={200}
          priority={isPriority && i === 0}
        />
      </div>
    </SwiperSlide>
  ))}
</Swiper>
                              )}

                              {/* Hidden "View More" button that appears after last slide */}
                              {/* <div
                                id={`view-more-btn-${item}`}
                                className="view-more-btn-wrapper"
                              >
                                <Link
                                  href="/related-links"
                                  className="view-more-btn"
                                >
                                  View More
                                </Link>
                              </div> */}
                            </div>
                          </div>
                          <div className="product_de">
                            <div className="info">
                              {item.name && (
                                <h3 className="title">{item.name}</h3>
                              )}
                            </div>

                            {/* --- PRICE SECTION --- */}
                            {(item.regular_price || item.sale_price || item.price_difference) && (
                              <div className="price">
                                <div className="metc2">
                                  {(item.regular_price || item.sale_price) && (
                                    <h5 className="slog">
                                      {/* ✅ Stable price rendering: precompute safely */}
                                      {(() => {
                                        const rawRegular = item.regular_price || "";
                                        const rawSale = item.sale_price || "";
                                        const cleanRegular = rawRegular.replace(/[^0-9.]/g, "");
                                        const regNum = Number(cleanRegular) || 0;
                                        const cleanSale = rawSale.replace(/[^0-9.]/g, "");
                                        const saleNum = Number(cleanSale) || 0;

                                        // If regular price is 0 → show POA
                                        if (regNum === 0) {
                                          return <>POA</>;
                                        }

                                        // If sale price exists → show sale and strike-through
                                        if (saleNum > 0) {
                                          return (
                                            <>
                                              <del>{rawRegular}</del> {rawSale}
                                            </>
                                          );
                                        }

                                        // Otherwise → show regular price
                                        return <>{rawRegular}</>;
                                      })()}
                                    </h5>
                                  )}

                                  {/* ✅ Show SAVE only if > $0 */}
                                  {(() => {
                                    const cleanDiff = (item.price_difference || "").replace(/[^0-9.]/g, "");
                                    const diffNum = Number(cleanDiff) || 0;
                                    return diffNum > 0 ? (
                                      <p className="card-price">
                                        <span>SAVE</span> {item.price_difference}
                                      </p>
                                    ) : null;
                                  })()}

                                  <div className="more_info">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedProduct(item);
                                        setShowInfo(true);
                                      }}
                                    >
                                      <i className="fa fa-info-circle"></i> Info
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* --- DETAILS LIST --- */}
                            <ul className="vehicleDetailsWithIcons simple">
                              {item.condition && (
                                <li>
                                  <span className="attribute3">
                                    {item.condition}
                                  </span>
                                </li>
                              )}

                              {item.categories && item.categories.length > 0 && (
                                <li className="attribute3_list">
                                  <span className="attribute3">
                                    {item.categories.join(", ")}
                                  </span>
                                </li>
                              )}

                              {item.length && (
                                <li>
                                  <span className="attribute3">
                                    {item.length}
                                  </span>
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

                            {/* --- CONDITION + LOCATION --- */}
                            {(item.condition || item.location) && (
                              <div className="bottom_mid">
                                {item.condition && (
                                  <span>
                                    <i className="bi bi-check-circle-fill"></i>{" "}
                                    Condition {item.condition}
                                  </span>
                                )}
                                {item.location && (
                                  <span>
                                    <i className="fa fa-map-marker-alt"></i>{" "}
                                    {item.location}
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
                                  setShowContact(true);
                                }}
                              >
                                Contact Seller
                              </button>
                              <button className="btn btn-primary">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="dealers-section product-type">
          <div className="other_items">
            <div className="related-products">
              {isMainLoading ? (
                <Skelton count={6} />
              ) : (
                <div className="row g-3">
                  {mergedProducts.map((item, index) => {
                    const href = getHref(item);
                    const images = getProductImages(item.sku, item.slug);
                    const isPriority = index < 5;
const imgs = lazyImages[item.id] || [getFirstImage(item)];
                     return (
                      <div className="col-lg-6 mb-0" key={index}>

                        <Link
                          href={href}
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem("cameFromListings", "true");
                            }
                          }}
                          prefetch={false}
                          className="lli_head"
                        >
                          <div

                            className="product-card">
                            <div className="img">
                              <div className="background_thumb">
                                <ImageWithSkeleton
                                  src={images [0]}
 priority={isPriority}  
                                  alt="Caravan"
                                  width={300}
                                  height={200}

                                />
                              </div>
                              <div className="main_thumb position-relative">
                                <span className="lab">Spotlight Van</span>
                        <Swiper
  modules={[Navigation, Pagination]}
  spaceBetween={10}
  slidesPerView={1}
  navigation
  pagination={{
    clickable: true,
  }}
  onSlideChange={() => {
    if (!loadedAll[item.id]) loadRemaining(item); // Fixed: loadedAll instead of isLoaded
  }}
  onReachBeginning={() => {
    if (!loadedAll[item.id]) loadRemaining(item); // Fixed: loadedAll instead of isLoaded
  }}
  onReachEnd={() => {
    if (!loadedAll[item.id]) loadRemaining(item); // Fixed: loadedAll instead of isLoaded
  }}
  className="main_thumb_swiper"
>
  {imgs.map((img, i) => (
    <SwiperSlide key={i}>
      <div className="thumb_img">
        <ImageWithSkeleton
          src={img}
          alt={`Caravan ${i + 1}`}
          width={300}
          height={200}
          priority={isPriority && i === 0}
        />
      </div>
    </SwiperSlide>
  ))}
</Swiper>
                                {/* Hidden "View More" button that appears after last slide */}
                                {/* <div
                                id={`view-more-btn-${item}`}
                                className="view-more-btn-wrapper"
                              >
                                <Link
                                  href="/related-links"
                                  className="view-more-btn"

                                >
                                  View More
                                </Link>
                              </div> */}
                              </div>
                            </div>
                            <div className="product_de">
                              <div className="info">
                                {item.name && (
                                  <h3 className="title">{item.name}</h3>
                                )}
                              </div>

                              {/* --- PRICE SECTION --- */}
                              {(item.regular_price || item.sale_price || item.price_difference) && (
                                <div className="price">
                                  <div className="metc2">
                                    {(item.regular_price || item.sale_price) && (
                                      <h5 className="slog">
                                        {/* ✅ Stable price rendering: precompute safely */}
                                        {(() => {
                                          const rawRegular = item.regular_price || "";
                                          const rawSale = item.sale_price || "";
                                          const cleanRegular = rawRegular.replace(/[^0-9.]/g, "");
                                          const regNum = Number(cleanRegular) || 0;
                                          const cleanSale = rawSale.replace(/[^0-9.]/g, "");
                                          const saleNum = Number(cleanSale) || 0;

                                          // If regular price is 0 → show POA
                                          if (regNum === 0) {
                                            return <>POA</>;
                                          }

                                          // If sale price exists → show sale and strike-through
                                          if (saleNum > 0) {
                                            return (
                                              <>
                                                <del>{rawRegular}</del> {rawSale}
                                              </>
                                            );
                                          }

                                          // Otherwise → show regular price
                                          return <>{rawRegular}</>;
                                        })()}
                                      </h5>
                                    )}

                                    {/* ✅ Show SAVE only if > $0 */}
                                    {(() => {
                                      const cleanDiff = (item.price_difference || "").replace(/[^0-9.]/g, "");
                                      const diffNum = Number(cleanDiff) || 0;
                                      return diffNum > 0 ? (
                                        <p className="card-price">
                                          <span>SAVE</span> {item.price_difference}
                                        </p>
                                      ) : null;
                                    })()}

                                    <div className="more_info">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setSelectedProduct(item);
                                          setShowInfo(true);
                                        }}
                                      >
                                        <i className="fa fa-info-circle"></i> Info
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* --- DETAILS LIST --- */}
                              <ul className="vehicleDetailsWithIcons simple">
                                {item.condition && (
                                  <li>
                                    <span className="attribute3">
                                      {item.condition}
                                    </span>
                                  </li>
                                )}

                                {item.categories && item.categories.length > 0 && (
                                  <li className="attribute3_list">
                                    <span className="attribute3">
                                      {item.categories.join(", ")}
                                    </span>
                                  </li>
                                )}

                                {item.length && (
                                  <li>
                                    <span className="attribute3">
                                      {item.length}
                                    </span>
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

                              {/* --- CONDITION + LOCATION --- */}
                              {(item.condition || item.location) && (
                                <div className="bottom_mid">
                                  {item.condition && (
                                    <span>
                                      <i className="bi bi-check-circle-fill"></i>{" "}
                                      Condition {item.condition}
                                    </span>
                                  )}
                                  {item.location && (
                                    <span>
                                      <i className="fa fa-map-marker-alt"></i>{" "}
                                      {item.location}
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
                                    setShowContact(true);
                                  }}
                                >
                                  Contact Seller
                                </button>
                                <button className="btn btn-primary">
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
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
                  disabled={pagination.current_page === pagination.total_pages || !isNextLoading
                  }
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
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
                    __html: selectedProduct.description.replace(/\\r\\n/g, "<br/>"),
                  }}
                />
              ) : (
                <p>No description available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === Contact Seller Popup === */}
      {showContact && (
        <div className="popup-overlay">
          <div className="popup-box">
            <button
              type="button"
              className="close-popup"
              onClick={() => setShowContact(false)}
            >
              ×
            </button>
            <h4>Contact Seller</h4>
            <div className="sidebar-enquiry">
              <form className="wpcf7-form" noValidate>
                <div className="form">
                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-name"
                        className="wpcf7-form-control"
                        required
                        autoComplete="off"
                        aria-invalid="false"
                        aria-describedby="err-name"
                        type="text"
                        name="enquiry2-name"
                      />
                      <label htmlFor="enquiry2-name">Name</label>
                    </p>
                  </div>

                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-email"
                        className="wpcf7-form-control"
                        required
                        autoComplete="off"
                        aria-invalid="false"
                        aria-describedby="err-email"
                        type="email"
                        name="enquiry2-email"
                      />
                      <label htmlFor="enquiry2-email">Email</label>
                    </p>
                  </div>

                  <div className="form-item">
                    <p className="phone_country">
                      <span className="phone-label">+61</span>
                      <input
                        id="enquiry2-phone"
                        inputMode="numeric"
                        className="wpcf7-form-control"
                        required
                        autoComplete="off"
                        aria-invalid="false"
                        aria-describedby="err-phone"
                        type="tel"
                        name="enquiry2-phone"
                      />
                      <label htmlFor="enquiry2-phone">Phone</label>
                    </p>
                  </div>

                  <div className="form-item">
                    <p>
                      <input
                        id="enquiry2-postcode"
                        inputMode="numeric"
                        maxLength={4}
                        className="wpcf7-form-control"
                        required
                        autoComplete="off"
                        aria-invalid="false"
                        aria-describedby="err-postcode"
                        type="text"
                        name="enquiry2-postcode"
                      />
                      <label htmlFor="enquiry2-postcode">Postcode</label>
                    </p>
                  </div>

                  <div className="form-item">
                    <p>
                      <label htmlFor="enquiry4-message">
                        Message (optional)
                      </label>

                      <textarea
                        id="enquiry4-message"
                        name="enquiry4-message"
                        className="wpcf7-form-control wpcf7-textarea"
                      ></textarea>
                    </p>
                  </div>

                  <p className="terms_text">
                    By clicking &lsquo;Send Enquiry&lsquo;, you agree to Caravan
                    Marketplace{" "}
                    <Link target="_blank" href="/privacy-collection-statement/">
                      Collection Statement
                    </Link>
                    ,{" "}
                    <Link target="_blank" href="/privacy-policy/">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link target="_blank" href="/terms-conditions/">
                      Terms and Conditions
                    </Link>
                    .
                  </p>

                  <div className="submit-btn">
                    <button type="submit" className="btn btn-primary">
                      Send Enquiry
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