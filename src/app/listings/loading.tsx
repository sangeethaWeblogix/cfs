import type { CSSProperties } from "react";

const SKEL: CSSProperties = {
  background: "#e8e8e8",
  borderRadius: 6,
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

function Skel({ w, h, style }: { w?: number | string; h: number; style?: CSSProperties }) {
  return <div style={{ ...SKEL, width: w ?? "100%", height: h, ...style }} />;
}

export default function ListingsLoading() {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.55}}
        .lld-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        @media (max-width: 991px) { .lld-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .lld-grid { grid-template-columns: 1fr; gap: 14px; } }
        .lld-filters { display: flex; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 480px) { .lld-filters { gap: 8px; } }
      `}</style>

      {/* Hero */}
      <div style={{ background: "#f0f0f0", padding: "28px 0 24px", minHeight: 110 }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 15px" }}>
          <Skel h={26} w="45%" style={{ marginBottom: 10, borderRadius: 4 }} />
          <Skel h={15} w="65%" style={{ borderRadius: 4 }} />
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0", padding: "14px 0" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 15px" }}>
          <div className="lld-filters">
            {[200, 120, 120, 130, 110, 100].map((w, i) => (
              <Skel key={i} h={36} w={w} style={{ borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 15px 60px" }}>
        <div className="lld-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e8e8e8", background: "#fff" }}>
              <Skel h={200} style={{ borderRadius: 0 }} />
              <div style={{ padding: "12px 14px" }}>
                <Skel h={17} style={{ marginBottom: 8, borderRadius: 4 }} />
                <Skel h={13} w="65%" style={{ marginBottom: 10, borderRadius: 4 }} />
                <Skel h={22} w="50%" style={{ borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
