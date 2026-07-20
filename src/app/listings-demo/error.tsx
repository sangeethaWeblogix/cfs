"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ListingsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[FRONTEND ERROR] Listings page JS crash:", error.message, error.digest ?? "");
    fetch("/api/report-error/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        errorSource: "FRONTEND",
        errorType: "JS crash: " + error.message,
        message: error.message,
        digest: error.digest,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <section className="lst-err-wrap">
      <div className="lst-err-card">
        <div className="lst-err-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#f37920" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h1 className="lst-err-title">Unable to Load Listings</h1>

        <p className="lst-err-msg">
          We&apos;re having trouble connecting to our servers right now.<br />
          Please try again in a moment.
        </p>

        <button onClick={() => reset()} className="lst-err-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Try Again
        </button>

        <p className="lst-err-help">
          Problem persists?{" "}
          <Link href="/contact">Contact support</Link>
        </p>
      </div>

      <style jsx>{`
        .lst-err-wrap {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f8f8;
          padding: 40px 16px;
        }
        .lst-err-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          padding: 48px 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
        }
        .lst-err-icon {
          margin-bottom: 20px;
        }
        .lst-err-title {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 12px;
        }
        .lst-err-msg {
          font-size: 15px;
          color: #666;
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .lst-err-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f37920;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 28px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .lst-err-btn:hover {
          background: #d96510;
          transform: translateY(-1px);
        }
        .lst-err-help {
          margin-top: 20px;
          font-size: 13px;
          color: #999;
        }
        .lst-err-help a {
          color: #f37920;
          text-decoration: none;
        }
        .lst-err-help a:hover {
          text-decoration: underline;
        }
      `}</style>
    </section>
  );
}
