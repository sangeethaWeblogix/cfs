"use client";
import "./skeleton.css?=1";

export default function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <div className="skeleton" style={{ width: "100%", height: 220, borderRadius: 0 }} />
      <div className="product_de p-2">
        <div className="info">
          <div className="skeleton skeleton-badge mt-1" />
          <div className="skeleton skeleton-title mt-2" />
        </div>
        <div className="skeleton skeleton-text short mt-2" />
      </div>
    </div>
  );
}
