const TabCardSkeleton = () => (
  <div style={{
    minWidth: 160, minHeight: 72,
    background: "#f0f0f0", borderRadius: 10, padding: "12px",
    display: "flex", flexDirection: "column", gap: 8,
    animation: "skeletonPulse 1.4s ease-in-out infinite",
  }}>
    <div style={{ width: 48, height: 14, borderRadius: 4, background: "linear-gradient(90deg,#e0e0e0 25%,#f5f5f5 50%,#e0e0e0 75%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.4s infinite" }} />
    <div style={{ width: "90%", height: 12, borderRadius: 4, background: "linear-gradient(90deg,#e0e0e0 25%,#f5f5f5 50%,#e0e0e0 75%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.4s infinite" }} />
    <div style={{ width: "65%", height: 12, borderRadius: 4, background: "linear-gradient(90deg,#e0e0e0 25%,#f5f5f5 50%,#e0e0e0 75%)", backgroundSize: "200% 100%", animation: "skeletonShimmer 1.4s 0.1s infinite" }} />
  </div>
);
export default TabCardSkeleton;