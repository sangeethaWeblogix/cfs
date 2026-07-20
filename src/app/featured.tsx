"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { fetchFeaturedHomeCat, type FeaturedItem } from "@/api/featured/api";
import { toSlug } from "@/utils/seo/slug";
//import "../app/listings/listings.css";
import HeroSkeleton from "./components/heroSkelton";
import CardSkeleton from "./components/cardsSkeleton";

type Cat = {
  name: string;
  alt: string; // id-safe key, also used in endpoints
  listLink: string; // “See All” link
};

const categories: Cat[] = [
  {
    name: "OFF ROAD",
    alt: "off-road",
    listLink: "/listings/off-road-category/",
  },
  { name: "HYBRID", alt: "hybrid", listLink: "/listings/hybrid-category/" },
  { name: "POP TOP", alt: "pop-top", listLink: "/listings/pop-top-category/" },
  { name: "LUXURY", alt: "luxury", listLink: "/listings/luxury-category/" },
  { name: "FAMILY", alt: "family", listLink: "/listings/family-category/" },
  { name: "TOURING", alt: "touring", listLink: "/listings/touring-category/" },
];

const money = (v?: string | number) =>
  typeof v === "number"
    ? v.toLocaleString("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
      })
    : String(v ?? "");

export default function DealsOnlyCFS() {
  const [active, setActive] = useState(categories[0].alt);
  const [data, setData] = useState<Record<string, FeaturedItem[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const productHref = (p?: FeaturedItem) => {
    if (!p) return "#";
    const slug = p.slug ?? toSlug(p.slug ?? "product");
    return `/product/${slug}/`;
  };
  // fetch a category once
  const loadCat = async (alt: string) => {
    if (data[alt] || loading[alt]) return;
    setLoading((s) => ({ ...s, [alt]: true }));
    try {
      const items = await fetchFeaturedHomeCat(alt);
      setData((s) => ({ ...s, [alt]: items }));
    } catch (e) {
      console.error("[featured] load error:", alt, e);
      setData((s) => ({ ...s, [alt]: [] }));
    } finally {
      setLoading((s) => ({ ...s, [alt]: false }));
    }
  };
  useEffect(() => {
    loadCat(active); // load first tab on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = data[active] ?? [];
  const hero = items[0];
  const rest = items.slice(1);

  return (
    <div className="container">
      <div className="inside_col">
        <div className="header_posistion">
          <h2>
            Find Exclusive{" "}
            <Image
              className="deal_icon hidden-xs"
              src="/images/deal_icons.svg"
              alt="deal icon"
              width={30}
              height={30}
            />{" "}
            Deals Only @ CFS
          </h2>
        </div>

        {/* Tabs */}
        <ul className="nav nav-pills" role="tablist">
          {categories.map((cat) => (
            <li className="nav-item" role="presentation" key={cat.alt}>
              <button
                className={`nav-link ${active === cat.alt ? "active" : ""}`}
                type="button"
                role="tab"
                aria-selected={active === cat.alt}
                onClick={() => {
                  setActive(cat.alt);
                  if (!data[cat.alt]) {
                    setLoading((s) => ({ ...s, [cat.alt]: true })); // start skeleton
                    loadCat(cat.alt);
                  }
                }}
              >
                <span>{cat.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Tab content */}
        <div className="tab-content" id="pills-tabContent">
          <div className="tab-pane fade show active">
            {/* HERO */}
            <div className="content-info text-center pb-0">
              <div className="product_data">
                {loading[active] ? (
                  <HeroSkeleton />
                ) : items.length ? (
                  <div className="row">
                    {/* image right on lg like your layout */}
                    <div className="col-md-6 left_design order-lg-2">
                      <div className="img_b">
                        {hero?.image && (
                          <Image
                            src={hero.image}
                            alt={hero.title ?? "caravan"}
                            width={900}
                            height={300}
                            className="attachment-full size-full wp-post-image"
                            unoptimized
                            style={{ objectFit: "contain" }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="col-md-6 right_design order-lg-1">
                      <div className="deal_info">
                        <div className="dd-title">
                          <div className="metc1">
                            <h3 className="title">{hero?.title ?? "—"}</h3>
                          </div>
                          <div className="caravan_type">
                            <span>
                              {categories.find((c) => c.alt === active)?.name}
                            </span>
                            {hero?.location && (
                              <span>Location - {hero.location}</span>
                            )}
                          </div>
                          <div className="metc2">
                            <h5 className="slog">
                              {hero?.sale_price ? (
                                <>
                                  {money(hero.sale_price)}{" "}
                                  <s>{money(hero.regular_price)}</s>
                                </>
                              ) : hero?.regular_price ? (
                                money(hero.regular_price)
                              ) : (
                                "POA"
                              )}
                            </h5>
                            {(() => {
                              const cleaned = (hero?.price_difference || "")
                                .toString()
                                .replace(/[^0-9.]/g, "");
                              const numericValue = parseFloat(cleaned);
                              return numericValue > 0 ? (
                                <p className="card-price">
                                  <span>SAVE</span>
                                  {money(numericValue)}
                                </p>
                              ) : null;
                            })()}
                          </div>
                        </div>

                        <div className="d_feature">
                          <ul>
                            {hero?.condition && <li>{hero.condition}</li>}
                            {hero?.sleeps && <li>{hero.sleeps} </li>}
                            {hero?.length && <li>{hero.length}</li>}
                          </ul>
                        </div>

                        <div className="sub_bttn">
                          <Link
                            className="btn"
                            href={productHref(hero)}
                            prefetch={false}
                          >
                            VIEW THIS DEAL
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-muted"></div>
                )}
              </div>
            </div>

            {/* LIST / CAROUSEL */}
            {loading[active] ? (
              <div className="other_items">
                <div className="related-products">
                  <h3>
                    Featured {categories.find((c) => c.alt === active)?.name}{" "}
                    Caravans For Sale
                  </h3>
                  <CardSkeleton count={3} />
                </div>
              </div>
            ) : (
              !!rest.length && (
                <div className="other_items">
                  <div className="related-products">
                    <div className="d-flex align-items-center justify-content-between">
                      <h3>
                        Featured{" "}
                        {categories.find((c) => c.alt === active)?.name}{" "}
                        Caravans For Sale
                      </h3>

                      <Link
                        className="floating_links hidden-xs"
                        href={
                          categories.find((c) => c.alt === active)?.listLink ??
                          "#"
                        }
                      >
                        See All <i className="bi bi-chevron-right" />
                      </Link>
                    </div>
                    <div className="featured-deals position-relative">
                      <Swiper
                        modules={[Navigation, Autoplay]}
                        navigation={{
                          nextEl: `.swiper-button-next-${active}`,
                          prevEl: `.swiper-button-prev-${active}`,
                        }}
                        autoplay={{
                          delay: 3000,
                          disableOnInteraction: false,
                        }}
                        spaceBetween={20}
                        slidesPerView={1}
                        breakpoints={{
                          640: { slidesPerView: 1, spaceBetween: 20 },
                          768: { slidesPerView: 2, spaceBetween: 20 },
                          1024: { slidesPerView: 3, spaceBetween: 20 },
                        }}
                        className="swiper-container"
                      >
                        {rest.map((it, i) => (
                          <SwiperSlide key={it.id ?? i}>
                            <Link href={productHref(it)} prefetch={false}>
                              <div className="product-card">
                                <div className="img">
                                  {it.image && (
                                    <Image
                                      src={it.image}
                                      alt={it.title ?? "caravan"}
                                      width={300}
                                      height={200}
                                      unoptimized
                                    />
                                  )}
                                </div>

                                <div className="product_de">
                                  <div className="info">
                                    <h6 className="category">
                                      <i className="fa-solid fa-location-dot" />
                                      <span>{it.location ?? ""}</span>
                                    </h6>
                                    <h3 className="title">{it.title ?? "—"}</h3>
                                  </div>

                                  <div className="price">
                                    <div className="metc2">
                                      <h5 className="slog">
                                        {parseFloat(
                                          String(
                                            it.regular_price ?? ""
                                          ).replace(/[^0-9.]/g, "")
                                        ) === 0
                                          ? "POA"
                                          : money(
                                              it.sale_price ?? it.regular_price
                                            )}
                                        {it.sale_price && it.regular_price && (
                                          <>
                                            {" "}
                                            <s>{money(it.regular_price)}</s>
                                          </>
                                        )}
                                      </h5>
                                      {(() => {
                                        const cleaned = (
                                          it?.price_difference || ""
                                        )
                                          .toString()
                                          .replace(/[^0-9.]/g, "");
                                        const numericValue =
                                          parseFloat(cleaned);
                                        return numericValue > 0 ? (
                                          <p className="card-price">
                                            <span>SAVE</span>
                                            {money(numericValue)}
                                          </p>
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>
                                  <ul className="vehicleDetailsWithIcons simple">
                                    {it.condition && (
                                      <li>
                                        <span className="attribute3">
                                          {it.condition}
                                        </span>
                                      </li>
                                    )}
                                    {it?.sleeps && (
                                      <li>
                                        <span className="attribute3">
                                          {it.sleeps}
                                        </span>
                                      </li>
                                    )}
                                    {it?.length && (
                                      <li>
                                        <span className="attribute3">
                                          {it.length}
                                        </span>
                                      </li>
                                    )}
                                  </ul>
                                  <span className="btn">VIEW THIS DEAL</span>
                                </div>
                              </div>
                            </Link>
                          </SwiperSlide>
                        ))}
                      </Swiper>

                      <div
                        className={`swiper-button-next swiper-button-next-${active}`}
                      />
                      <div
                        className={`swiper-button-prev swiper-button-prev-${active}`}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
