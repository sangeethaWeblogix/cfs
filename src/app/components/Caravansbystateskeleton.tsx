"use client";

// ─────────────────────────────────────────────────────────────
// CaravansByStateSkeleton.tsx
// Skeleton that exactly mirrors the real card UI:
//   • Map image  → top-center
//   • State name → bold centered heading
//   • 2 text lines → centered description
//   • View All link → centered blue link
// ─────────────────────────────────────────────────────────────

import React from "react";

const STYLES = `
@keyframes skPulse {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
.sk-wrap {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

/* image block top-center */
.sk-img {
  width: 90px;
  height: 90px;
  border-radius: 8px;
  background: #f0f0f0;
  animation: skPulse 1.6s ease-in-out infinite;
  margin-bottom: 20px;
}

/* state title */
.sk-title {
  height: 20px;
  width: 65%;
  border-radius: 5px;
  background: #e2e6ea;
  animation: skPulse 1.6s ease-in-out infinite;
  margin-bottom: 16px;
}

/* 2 description lines */
.sk-line {
  height: 13px;
  border-radius: 4px;
  background: #eaedf0;
  animation: skPulse 1.6s ease-in-out infinite;
  margin-bottom: 8px;
}
.sk-line-1 { width: 78%; }
.sk-line-2 { width: 62%; margin-bottom: 20px; }

/* divider */
.sk-divider {
  width: 100%;
  height: 1px;
  background: #f0f0f0;
  margin-bottom: 16px;
}

/* view-all link */
.sk-link {
  height: 14px;
  width: 72%;
  border-radius: 4px;
  background: #d6e8f7;
  animation: skPulse 1.6s ease-in-out infinite;
}

/* heading */
.sk-section-heading {
  height: 30px;
  width: 380px;
  max-width: 90%;
  border-radius: 6px;
  background: #e2e6ea;
  animation: skPulse 1.6s ease-in-out infinite;
  margin-bottom: 8px;
}

/* grid — always single row, 4 columns, no wrapping */
.sk-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, 1fr);
  overflow: hidden;
}

/* arrows */
.sk-arrows {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.sk-arrow {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e2e6ea;
  animation: skPulse 1.6s ease-in-out infinite;
}
`;

const SkCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <div className="sk-wrap" aria-hidden="true">
    {/* Map image placeholder — top center */}
    <div className="sk-img" style={{ animationDelay: `${delay}ms` }} />

    {/* State name */}
    <div className="sk-title" style={{ animationDelay: `${delay + 60}ms` }} />

    {/* Description lines */}
    <div
      className="sk-line sk-line-1"
      style={{ animationDelay: `${delay + 100}ms` }}
    />
    <div
      className="sk-line sk-line-2"
      style={{ animationDelay: `${delay + 130}ms` }}
    />

    {/* Subtle divider */}
    <div className="sk-divider" />

    {/* View All link */}
    <div className="sk-link" style={{ animationDelay: `${delay + 170}ms` }} />
  </div>
);

const CaravansByStateSkeleton: React.FC<{ count?: number }> = ({
  count = 4,
}) => (
  <>
    <style>{STYLES}</style>

    <div
      className="caravans_by_state related-products services section-padding style-1 pt-0"
      aria-busy="true"
      aria-label="Loading caravans by state…"
    >
      <div className="container">
        {/* Section heading */}
        <div className="row">
          <div className="col">
            <div className="section-head mb-2 py-2">
              <div className="sk-section-heading" />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="content">
          <div className="sk-grid">
            {Array.from({ length: count }).map((_, i) => (
              <SkCard key={i} delay={i * 80} />
            ))}
          </div>

          {/* Arrow placeholders */}
          <div className="sk-arrows">
            <div className="sk-arrow" style={{ animationDelay: "0ms" }} />
            <div className="sk-arrow" style={{ animationDelay: "100ms" }} />
          </div>
        </div>
      </div>
    </div>
  </>
);

export default CaravansByStateSkeleton;
