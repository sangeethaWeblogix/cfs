import "./skeleton.css?=1";

export default function BlogCardSkeleton() {
  return (
    <div className="col-lg-4">
      <div className="side-posts">
        <div className="item">
          <div className="img img-cover">
            <div className="skeleton skeleton-image" style={{ borderRadius: 0 }} />
          </div>
          <div className="info mt-2">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-badge mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
