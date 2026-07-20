"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[ROOT ERROR]", error.message, error.digest ?? "");
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
        background: "#f8f9fa",
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
          Something went wrong
        </h2>
        <p style={{ fontSize: "15px", color: "#6c757d", margin: "0 0 24px", lineHeight: 1.6 }}>
          This page couldn&apos;t load. Please try again or go back to browsing caravans.
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
            Browse Caravans
          </a>
        </div>

        <p style={{ marginTop: "24px", fontSize: "13px", color: "#adb5bd" }}>
          If this keeps happening,{" "}
          <Link href="/contact" style={{ color: "#007bff", textDecoration: "none" }}>
            contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
