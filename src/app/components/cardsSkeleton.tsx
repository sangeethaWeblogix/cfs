"use client";
import "./skeleton.css?=1";

export default function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="row">
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-12 col-md-6 col-lg-4 mb-4" key={i}>
          <div className="skeleton-card">
            <div className="skeleton skeleton-image" style={{ borderRadius: 0 }} />
            <div className="product_de p-2">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text mt-1" />
              <div className="skeleton skeleton-text short mt-1" />
              <div className="skeleton skeleton-button mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
