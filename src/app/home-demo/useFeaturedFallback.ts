"use client";

import { useEffect, useState } from "react";
import type { FeaturedListing } from "@/api/homeApi/featured/api";

// The home page HTML is CDN-cached for 24h, so when the server-side WP call fails
// (fetchHomeFeatured → []) the empty carousel is served to every visitor until the
// cache expires. When the server rendered nothing, refetch through the same-origin
// proxy in the browser so the section still fills in.
export function useFeaturedFallback(
  items: FeaturedListing[],
  type: "all" | "new" | "used",
): FeaturedListing[] {
  const [live, setLive] = useState<FeaturedListing[]>([]);

  useEffect(() => {
    if (items.length) return;
    let cancelled = false;
    const seed = Math.floor(Math.random() * 10) + 1;

    (async () => {
      for (let attempt = 0; attempt < 2 && !cancelled; attempt++) {
        try {
          const res = await fetch(`/api/home-featured/?type=${type}&seed=${seed}`, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json?.products) && json.products.length) {
              if (!cancelled) setLive(json.products);
              return;
            }
          }
        } catch {
          // fall through to retry
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items.length, type]);

  return items.length ? items : live;
}
