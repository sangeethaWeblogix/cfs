"use client";

import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import Link from "next/link";
import Image from "next/image";
import { getLocationLabel } from "./locationUtils";

type Listing = {
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
  berths?: string | number;
};

async function fetchFeaturedListings(seed?: number): Promise<Listing[]> {
  const requestUrl = `/api/home-featured/?type=all${seed ? `&seed=${seed}` : ""}`;
  console.log("[HomeFeatured] API:", requestUrl);
  const res = await fetch(requestUrl, { cache: "no-store" });
  console.log("[HomeFeatured] visitor IP forwarded:", res.headers.get("x-debug-visitor-ip"));
  if (!res.ok) {
    console.error(`[HomeFeatured] API error: HTTP ${res.status} for ${requestUrl}`);
    return [];
  }
  const json = await res.json();
  console.log("[HomeFeatured] API response:", json);
  return json?.data?.products ?? json?.products ?? (Array.isArray(json?.data) ? json.data : []) ?? [];
}

interface Props {
  seed?: number;
}

export default function HomeFeatured({ seed }: Props) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  useEffect(() => {
    if (!seed) return;
    fetchFeaturedListings(seed)
      .then(setItems)
      .catch((err) => {
        console.error("[HomeFeatured] fetch failed:", err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [seed]);

  if (loading) {
    return (
      <section className="hf-section">
        <div className="container">
          <div className="hf-header">
            <div className="hf-title-skeleton" />
          </div>
          <div className="hf-skeleton-row">
            {[...Array(4)].map((_, i) => <div key={i} className="hf-skeleton-card" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="hf-section">
        <div className="container">
          <div style={{ minHeight: 340, background: "#f8f9fa", borderRadius: 8 }} />
        </div>
      </section>
    );
  }

  return (
    <section className="hf-section">
      <div className="container">
        <div className="hf-header">
          <h2 className="hf-title">Featured Caravans for Sale</h2>
          {/* <Link href="/listings/" className="hf-view-all">
            View all caravans <span aria-hidden>→</span>
          </Link> */}
        </div>

        <div className="hf-swiper-wrap">
          {!isBeginning && (
            <button className="hf-nav-btn hf-nav-btn--prev" onClick={() => swiperRef.current?.slidePrev()} aria-label="Previous">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          <Swiper
            onSwiper={(s) => { swiperRef.current = s; }}
            onSlideChange={(s) => { setIsBeginning(s.isBeginning); setIsEnd(s.isEnd); }}
            spaceBetween={16}
            slidesPerView={1.5}
            breakpoints={{
              640:  { slidesPerView: 2,   spaceBetween: 14 },
              768:  { slidesPerView: 2,   spaceBetween: 16 },
              1024: { slidesPerView: 3,   spaceBetween: 18 },
              1280: { slidesPerView: 4,   spaceBetween: 18 },
              1440: { slidesPerView: 4,   spaceBetween: 20 },
              1920: { slidesPerView: 4,   spaceBetween: 20 },
            }}
          >
            {items.map((item, idx) => {
              const isNew = item.condition?.toLowerCase() === "new";
              const price = item.sale_price || item.regular_price || "POA";
              const image = item.image_format?.[0] ?? null;
              const type = (item.categories?.[0] ?? "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
              const location = getLocationLabel(item);

              return (
                <SwiperSlide key={item.id ?? idx}>
                  <Link href={`/product/${item.slug}/`} prefetch={false} className="hf-card">
                    {/* Image */}
                    <div className="hf-card__img-wrap">
                      {image ? (
                        <Image src={image} alt={item.name} width={400} height={300} unoptimized className="hf-card__img" />
                      ) : (
                        <div className="hf-card__img-placeholder" />
                      )}
                      {/* Category pill at bottom of image */}
                      {type && <div className="hf-card__dealer-tag">{type}</div>}
                    </div>

                    {/* Body */}
                    <div className="hf-card__body">
                      <h3 className="hf-card__title">{item.name}</h3>
                      <div className="hf-card__meta">
                        {location && (
                          <span className="hf-card__meta-item">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {location}
                          </span>
                        )}
                        <span className="hf-card__meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                          {isNew ? "New" : "Used"}
                        </span>
                        <span className="hf-card__meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          {item.seller_type === "private" ? "Private" : "Dealer"}
                        </span>
                      </div>
                      <p className="hf-card__price">{price}</p>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
          {!isEnd && (
            <button className="hf-nav-btn hf-nav-btn--next" onClick={() => swiperRef.current?.slideNext()} aria-label="Next">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
