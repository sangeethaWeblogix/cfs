"use client";

// ─────────────────────────────────────────────────────────────
// SearchSuggestionSkeleton.tsx
// Skeleton for smart search dropdown — shown while API loads
// Matches exact structure of the suggestions dropdown UI
// ─────────────────────────────────────────────────────────────

import React from "react";

const STYLES = `
@keyframes searchSkPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

/* heading skeleton — matches <h4> "Popular searches" */
.search-sk-heading {
  height: 14px;
  width: 120px;
  border-radius: 4px;
  background: #dde3ec;
  animation: searchSkPulse 1.6s ease-in-out infinite;
  margin-bottom: 12px;
}

/* each list item row — matches <li> */
.search-sk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}
.search-sk-item:last-child {
  border-bottom: none;
}

/* search icon circle — mimics bi-search icon before text */
.search-sk-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #e8eaed;
  animation: searchSkPulse 1.6s ease-in-out infinite;
}

/* text bar — mimics suggestion label text */
.search-sk-text {
  height: 13px;
  border-radius: 4px;
  background: #eaedf0;
  animation: searchSkPulse 1.6s ease-in-out infinite;
  flex: 1;
}
`;

// Different widths to look natural, not robotic
const WIDTHS = ["72%", "58%", "85%", "64%", "78%", "50%", "68%"];

interface SearchSuggestionSkeletonProps {
  /** Number of skeleton rows to show (default: 6) */
  count?: number;
  /** Label above the skeleton rows (default: "Popular searches") */
  label?: string;
}

const SearchSuggestionSkeleton: React.FC<SearchSuggestionSkeletonProps> = ({
  count = 6,
  label = "Popular searches",
}) => (
  <>
    <style>{STYLES}</style>

    {/* Heading — matches <h4> in real dropdown */}
    <h4 style={{ opacity: 0.5, fontSize: "13px", marginBottom: "8px" }}>
      {label}
    </h4>

    <ul
      className="text-left"
      style={{ listStyle: "none", padding: 0, margin: 0 }}
      aria-busy="true"
      aria-label="Loading suggestions…"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="search-sk-item" aria-hidden="true">
          {/* Mimics the search icon that appears before each suggestion */}
          <div
            className="search-sk-icon"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          {/* Mimics the suggestion text */}
          <div
            className="search-sk-text"
            style={{
              width: WIDTHS[i % WIDTHS.length],
              animationDelay: `${i * 60 + 30}ms`,
            }}
          />
        </li>
      ))}
    </ul>
  </>
);

export default SearchSuggestionSkeleton;
