import type { CSSProperties } from "react";

const SKEL: CSSProperties = {
  background: "linear-gradient(90deg, #ebebeb 25%, #f5f5f5 50%, #ebebeb 75%)",
  backgroundSize: "600px 100%",
  borderRadius: 6,
  animation: "shimmer 1.4s ease-in-out infinite",
};

function Skel({ w, h, style }: { w?: number | string; h: number; style?: CSSProperties }) {
  return <div style={{ ...SKEL, width: w ?? "100%", height: h, ...style }} />;
}

function CardSkel() {
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ebebeb", background: "#fff" }}>
      <Skel h={210} style={{ borderRadius: 0 }} />
      <div style={{ padding: "12px 14px 14px" }}>
        <Skel h={16} w="80%" />
        <div style={{ marginTop: 8 }}><Skel h={13} w="50%" /></div>
        <div style={{ marginTop: 10 }}><Skel h={20} w="34%" /></div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Skel h={22} w={60} style={{ borderRadius: 4 }} />
          <Skel h={22} w={60} style={{ borderRadius: 4 }} />
          <Skel h={22} w={60} style={{ borderRadius: 4 }} />
        </div>
        <div style={{ marginTop: 8 }}><Skel h={13} w="55%" /></div>
      </div>
    </div>
  );
}

const FILTER_TAGS = ["Caravan Type", "Location", "Condition", "Make", "Price", "ATM"];

export default function ListingsLoading() {
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}`}</style>

      {/* Filter bar skeleton */}
      <div style={{
        padding: "12px",
        background: "#fff",
        boxShadow: "rgba(0,0,0,0.2) 0px 1px 3px",
        minHeight: 62,
      }}>
        <div className="container">
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0,
              background: "#fff", border: "1px solid #ddd", borderRadius: 60,
              padding: "6px 14px", fontWeight: 500, fontSize: 15,
              display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit",
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span> Filters
            </div>
            <div style={{ paddingLeft: 122, display: "flex", gap: 10, alignItems: "center", overflow: "hidden" }}>
              {FILTER_TAGS.map((label) => (
                <div key={label} style={{
                  whiteSpace: "nowrap", background: "#fff", border: "1px solid #ddd",
                  borderRadius: 20, padding: "6px 14px", fontSize: 15, fontFamily: "inherit",
                }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Listings skeleton */}
      <section className="services product_listing new_listing bg-gray-100 section-padding pb-3 style-1">
        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="top-filter mb-10">
                <div className="row align-items-center">
                  <div className="col-lg-8 col-md-8 col-12">
                    <Skel h={24} w="70%" style={{ borderRadius: 4 }} />
                  </div>
                  <div className="col-lg-4 col-md-4 col-12 d-flex justify-content-end">
                    <Skel h={36} w={160} style={{ borderRadius: 6 }} />
                  </div>
                </div>
              </div>
              <div className="row g-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="col-lg-6 col-sm-6 col-md-6">
                    <CardSkel />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar desktop only */}
            <div className="col-lg-3 d-none d-lg-block">
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ebebeb", background: "#fff" }}>
                <div style={{ position: "relative" }}>
                  <Skel h={230} style={{ borderRadius: 0 }} />
                  <div style={{ ...SKEL, position: "absolute", top: 0, left: 0, right: 0, height: 28, borderRadius: 0 }} />
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <Skel h={18} w="78%" />
                  <div style={{ marginTop: 8 }}><Skel h={13} w="52%" /></div>
                  <div style={{ marginTop: 12 }}><Skel h={22} w="36%" /></div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Skel h={24} w={66} style={{ borderRadius: 4 }} />
                    <Skel h={24} w={66} style={{ borderRadius: 4 }} />
                  </div>
                  <div style={{ marginTop: 8 }}><Skel h={13} w="58%" /></div>
                  <div style={{ marginTop: 12 }}><Skel h={38} style={{ borderRadius: 6 }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
