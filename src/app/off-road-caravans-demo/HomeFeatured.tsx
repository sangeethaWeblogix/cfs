"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Listing = {
  id: number;
  name: string;
  slug: string;
  condition: string;
  location: string;
  regular_price: string;
  sale_price: string;
  categories: string[];
  image_format: string[];
  seller_type?: string;
};

async function fetchFeaturedListings(): Promise<Listing[]> {
  const res = await fetch("/api/listings/?per_page=12", { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data?.products ?? [];
}

export default function HomeFeatured() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedListings()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="hf-section">
        <div className="container">
          <h2 className="hf-title" style={{ marginBottom: "20px" }}>Featured Off Road Caravan Listings</h2>
          <div className="hf-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="hf-skeleton-card" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="hf-section">
      <div className="container">
        <h2 className="hf-title" style={{ marginBottom: "20px" }}>Featured Off Road Caravan Listings</h2>

        <div className="hf-grid">
          {items.slice(0, 8).map((item, idx) => {
            const isNew = item.condition?.toLowerCase() === "new";
            const price = item.sale_price || item.regular_price || "POA";
            const image = item.image_format?.[0] ?? null;
            const type = item.categories?.[0] ?? "";

            return (
              <Link key={item.id ?? idx} href={`/product/${item.slug}/`} className="hf-card">
                <div className="hf-card__img-wrap">
                  {image ? (
                    <Image src={image} alt={item.name} width={400} height={300} unoptimized className="hf-card__img" />
                  ) : (
                    <div className="hf-card__img-placeholder" />
                  )}
                  {type && <div className="hf-card__dealer-tag">{type}</div>}
                </div>
                <div className="hf-card__body">
                  <h3 className="hf-card__title">{item.name}</h3>
                  <div className="hf-card__meta">
                    {item.location && (
                      <span className="hf-card__meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {item.location}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
