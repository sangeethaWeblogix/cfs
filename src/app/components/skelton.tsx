"use client";
import "./skeleton.css?=7";

export default function ListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-lg-6 col-sm-6 col-md-6 mb-0" key={i}>
          <div className="skeleton-card">
            <div className="skeleton skel-listing-img" />
            <div className="skel-listing-body">
              <div className="skeleton skel-listing-title" />
              <div className="skeleton skel-listing-loc" />
              <div className="skeleton skel-listing-price" />
              <div className="skeleton-row mt-2">
                <div className="skeleton skel-listing-tag" />
                <div className="skeleton skel-listing-tag" />
                <div className="skeleton skel-listing-tag" />
              </div>
              <div className="skeleton skel-listing-cond mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidebarListingSkeleton() {
  return (
    <div className="skeleton-card">
      <div style={{ position: "relative" }}>
        <div className="skeleton skel-sidebar-img" />
        <div className="skeleton skel-sidebar-badge" />
      </div>
      <div className="skel-listing-body">
        <div className="skeleton skel-listing-title" />
        <div className="skeleton skel-listing-loc" />
        <div className="skeleton skel-listing-price" />
        <div className="skeleton-row mt-2">
          <div className="skeleton skel-listing-tag" />
          <div className="skeleton skel-listing-tag" />
        </div>
        <div className="skeleton skel-listing-cond mt-2" />
        <div className="skeleton skel-sidebar-btn mt-3" />
      </div>
    </div>
  );
}
