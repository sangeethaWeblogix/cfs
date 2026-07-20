import type { CSSProperties } from "react";
import { headers } from "next/headers";

const SKEL: CSSProperties = {
  background: "#e8e8e8",
  borderRadius: 6,
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

function Skel({ w, h, style }: { w?: number | string; h: number; style?: CSSProperties }) {
  return <div style={{ ...SKEL, width: w ?? "100%", height: h, ...style }} />;
}

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b(\d+)ft(\d+)\b/gi, "$1'$2");
}

export default async function ProductLoading() {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const slug = pathname.replace(/^\/product\//, "").replace(/\/$/, "");
  const title = slugToTitle(slug);

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.55}}
        @media (max-width: 767px) {
          .pld-layout { grid-template-columns: 1fr !important; }
          .pld-sidebar { display: none !important; }
        }
      `}</style>

      <main style={{ margin: "0 auto" }}>
        <div style={{ background: "#fff", minHeight: "100vh", paddingBottom: 60 }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 15px" }}>

            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#000", margin: "28px 0 8px", lineHeight: 1.3 }}>
              {title}
            </h1>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
              <Skel h={14} w={180} style={{ borderRadius: 4 }} />
              <Skel h={22} w={90} style={{ borderRadius: 10 }} />
            </div>

            <div className="pld-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

              <div>
                <Skel h={460} style={{ borderRadius: 10, marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skel key={i} h={60} w={80} style={{ borderRadius: 4, flexShrink: 0 }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skel key={i} h={32} w={120} style={{ borderRadius: 6 }} />
                  ))}
                </div>
                <Skel h={16} style={{ marginBottom: 8 }} />
                <Skel h={16} style={{ marginBottom: 8 }} />
                <Skel h={16} w="80%" style={{ marginBottom: 8 }} />
              </div>

              <div className="pld-sidebar" style={{ borderRadius: 8, border: "1px solid #e4e4e4", padding: 16 }}>
                <Skel h={36} w="55%" style={{ borderRadius: 6 }} />
                <div style={{ marginTop: 8 }}><Skel h={14} w="40%" /></div>
                <div style={{ marginTop: 12 }}><Skel h={44} style={{ borderRadius: 6 }} /></div>
                <div style={{ marginTop: 8 }}><Skel h={44} style={{ borderRadius: 6 }} /></div>
                <div style={{ marginTop: 16 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <Skel h={14} w="40%" style={{ borderRadius: 4 }} />
                      <Skel h={14} w="35%" style={{ borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}
