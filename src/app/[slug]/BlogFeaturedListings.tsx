"use client";

import Image from "next/image";
import { getLocationLabel } from "../home-demo/locationUtils";

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
};

export default function BlogFeaturedListings({ products, category }: { products: Listing[]; category?: string }) {
  if (!products?.length) return null;

  const heading = category ? `Featured ${category} Caravans for Sale` : "Featured Caravans for Sale";

  return (
    <section className="bfl-section">
      <div className="container">
        <h2 className="bfl-title">{heading}</h2>

        <div className="bfl-grid">
          {products.slice(0, 10).map((item, idx) => {
            const isNew = item.condition?.toLowerCase() === "new";
            const price = item.sale_price || item.regular_price || "POA";
            const image = item.image_format?.[0] ?? null;
            const type = (item.categories?.[0] ?? "").replace(/-/g, " ");
            const location = getLocationLabel(item);

            return (
              <a
                key={item.id ?? idx}
                href={`/product/${item.slug}/`}
                className="bfl-card"
              >
                <div className="bfl-card__img">
                  {image ? (
                    <Image
                      src={image}
                      alt={item.name}
                      fill
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  ) : (
                    <div className="bfl-card__img-placeholder" />
                  )}
                  {type && <span className="bfl-card__chip">{type}</span>}
                </div>
                <div className="bfl-card__body">
                  <p className="bfl-card__name">{item.name}</p>
                  <div className="bfl-card__meta">
                    {location && (
                      <span className="bfl-card__meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {location}
                      </span>
                    )}
                    <span className="bfl-card__meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      {isNew ? "New" : "Used"}
                    </span>
                    <span className="bfl-card__meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      {item.seller_type === "private" ? "Private" : "Dealer"}
                    </span>
                  </div>
                  <p className="bfl-card__price">{price}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
