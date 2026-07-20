"use client";
import "./skeleton.css?=1";

export default function HeroSkeleton() {
  return (
    <div className="row">
      <div className="col-md-6 left_design order-lg-2">
        <div className="skeleton skeleton-image" style={{ borderRadius: 0, height: 300 }} />
      </div>
      <div className="col-md-6 right_design order-lg-1">
        <div className="deal_info">
          <div className="dd-title">
            <div className="skeleton skeleton-title" style={{ height: 36 }} />
            <div className="caravan_type mt-2">
              <div className="skeleton skeleton-text medium" />
            </div>
            <div className="metc2 mt-2">
              <div className="skeleton skeleton-text short" style={{ height: 32 }} />
              <div className="skeleton skeleton-text mt-1" style={{ width: "30%", height: 24 }} />
            </div>
          </div>
          <ul className="d_feature list-unstyled mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="mt-1">
                <div className="skeleton skeleton-text" style={{ width: 120, height: 20 }} />
              </li>
            ))}
          </ul>
          <div className="skeleton skeleton-button mt-2" style={{ width: 180 }} />
        </div>
      </div>
    </div>
  );
}
