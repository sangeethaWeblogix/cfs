"use client";

import { useMemo } from "react";
import {
  buildStaticLinks,
  buildStaticLinkUrl,
  SECTION_TITLES,
} from "./StaticLinksUtils";
import type { Filters } from "./Listings";

interface StaticLinksProps {
  filters: Filters;
}

export default function StaticLinks({ filters }: StaticLinksProps) {
  const displayLinks = useMemo(
    () => buildStaticLinks(filters) || {},
    [
      filters.state,
      filters.region,
      filters.suburb,
      filters.category,
      filters.from_price,
      filters.to_price,
      filters.minKg,
      filters.maxKg,
      filters.from_length,
      filters.to_length,
      filters.from_sleep,
      filters.to_sleep,
      filters.condition,
      filters.acustom_fromyears,
      filters.acustom_toyears,
      filters.make,
      filters.model,
    ],
  );

  return (
    <div className="cfs-links-section" id="static-links">
      {Object.entries(displayLinks).map(([sectionKey, items]) => {
        if (!items || items.length === 0) return null;

        return (
          <div key={sectionKey} className="cfs-links-group">
            <h5 className="cfs-filter-label">
              {SECTION_TITLES[sectionKey] || ""}
            </h5>
            <ul className="cfs-links-list">
              {items.map((item) => (
                <li key={item.slug} className="cfs-links-item">
                  <a
                    href={buildStaticLinkUrl(sectionKey, item.slug, filters)}
                    className="cfs-links-link"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
