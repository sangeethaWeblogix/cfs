"use client";

import { useState } from "react";

type LocationLink = { label: string; href: string };

/** "Popular Locations" footer column — shows the first few cities, with a
 * "View All Locations" toggle that reveals the rest in place. */
export default function FooterPopularLocations({
  locations,
  initialCount,
}: {
  locations: LocationLink[];
  initialCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? locations : locations.slice(0, initialCount);

  return (
    <ul>
      {visible.map((l) => (
        <li key={l.label}><a href={l.href}>{l.label}</a></li>
      ))}
      {!expanded && locations.length > initialCount && (
        <li>
          <button
            type="button"
            className="cfs-footer__view-all"
            onClick={() => setExpanded(true)}
          >
            View All Locations
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </li>
      )}
    </ul>
  );
}
