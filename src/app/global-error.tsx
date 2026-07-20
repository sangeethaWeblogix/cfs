"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to console or error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
              padding: "48px 40px",
              textAlign: "center",
              maxWidth: "500px",
              width: "100%",
            }}
          >
            {/* Error Icon */}
            <div style={{ marginBottom: "24px" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc3545"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: "0 auto" }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#212529",
                margin: "0 0 12px 0",
              }}
            >
              Oops! Something went wrong
            </h1>

            {/* Message */}
            <p
              style={{
                fontSize: "16px",
                color: "#6c757d",
                margin: "0 0 24px 0",
                lineHeight: 1.6,
              }}
            >
              We apologize for the inconvenience. The page you&apos;re trying to
              access is temporarily unavailable.
            </p>

            {/* Suggestions Box */}
            <div
              style={{
                background: "#f8f9fa",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "32px",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#495057",
                  margin: "0 0 12px 0",
                }}
              >
                You can try:
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  color: "#6c757d",
                  fontSize: "14px",
                }}
              >
                <li style={{ marginBottom: "6px" }}>
                  Refreshing the page
                </li>
                <li style={{ marginBottom: "6px" }}>
                  Checking your internet connection
                </li>
                <li>Coming back in a few minutes</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => reset()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 28px",
                  fontSize: "16px",
                  fontWeight: 500,
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  minWidth: "160px",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#0056b3";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#007bff";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "8px" }}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Try Again
              </button>

              
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: "32px",
                paddingTop: "24px",
                borderTop: "1px solid #e9ecef",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "#6c757d",
                  margin: 0,
                }}
              >
                Need help?{" "}
                <a
                  href="/contact"
                  style={{
                    color: "#007bff",
                    textDecoration: "none",
                  }}
                >
                  Contact our support team
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
