"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[PRODUCT ERROR]", error.message, error.digest ?? "");
    fetch("/api/report-error/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        errorSource: "FRONTEND",
        errorType: "JS crash: " + error.message,
        message: error.message,
        pageUrl: window.location.href,
        digest: error.digest,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          padding: "40px 32px",
          textAlign: "center",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc3545"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#212529", margin: "0 0 10px" }}>
          Unable to load this caravan
        </h2>
        <p style={{ fontSize: "15px", color: "#6c757d", margin: "0 0 24px", lineHeight: 1.6 }}>
          We couldn&apos;t load this listing. It may have been removed or there was a temporary error.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "11px 24px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <a
            href="/listings/"
            style={{
              padding: "11px 24px",
              background: "white",
              color: "#007bff",
              border: "1px solid #007bff",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Browse All Caravans
          </a>
        </div>
      </div>
    </div>
  );
}
