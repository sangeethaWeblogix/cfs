import "./skeleton.css?=1";

export default function BlogCardSkeleton() {
  return (
    <div className="card border-0 bg-transparent rounded-0 border-bottom brd-gray pb-30 mb-30">
      <div className="row">
        <div className="col-lg-5 col-sm-6">
          <div className="skeleton skeleton-image" style={{ borderRadius: 0 }} />
        </div>
        <div className="col-lg-7 col-sm-6">
          <div className="card-body p-0">
            <div className="skeleton skeleton-badge" />
            <div className="skeleton skeleton-title mt-2" />
            <div className="skeleton skeleton-text mt-1" />
            <div className="skeleton skeleton-text medium mt-1" />
            <div className="skeleton mt-2" style={{ width: 100, height: 36, borderRadius: 18 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
