"use client";

import { useState } from "react";
import { ListingCard, ContactModal } from "../listings/StateListingGrid";
import type { Listing } from "../listings/listingShared";
// ListingCard/ContactModal's .lsd-* styles live in the listings page's own
// stylesheet, which isn't loaded on the blog details route otherwise —
// without this the cards render completely unstyled.
import "../listings/main.css?=1";
import "./BlogContentProducts.css?=1";

/* Renders a product grid — using the exact same ListingCard design as
 * /listings/ — in place of a <div data-mpn-products="KEY"> marker embedded
 * in blog post content. Owns its own Contact Seller modal state the same
 * way StateListingGrid does, since ListingCard expects an onContact callback. */
export default function BlogContentProducts({
  products,
  link,
}: {
  products: Listing[];
  link?: { text: string; url: string };
}) {
  const [contactItem, setContactItem] = useState<Listing | null>(null);

  if (!products?.length) return null;

  return (
    <div className="blog-content-products">
      <div className="lsd-grid lsd-grid--4col">
        {products.map((item, idx) => (
          <ListingCard
            key={item.id ?? idx}
            item={item}
            onContact={setContactItem}
          />
        ))}
      </div>

      {link?.url && (
        <a href={link.url} className="blog-content-products__link">
          {link.text || link.url}
        </a>
      )}

      {contactItem && (
        <ContactModal item={contactItem} onClose={() => setContactItem(null)} />
      )}
    </div>
  );
}
