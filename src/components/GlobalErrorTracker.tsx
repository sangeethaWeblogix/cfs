"use client";

import { useEffect } from "react";

// Known third-party noise — don't alert on these
const IGNORE_PATTERNS = [
  "parentNode",           // GTM script race condition
  "contentWindow",        // GTM iframe access (third-party)
  "ResizeObserver",       // Browser internal
  "Non-Error promise",    // Browser extension noise
  "hydrat",               // Next.js hydration (expected in dev)
  "Loading chunk",        // Next.js lazy chunk (retry handles it)
  "Failed to load chunk", // Same — alternate phrasing Next.js uses
  "ChunkLoadError",       // Same
  "Load failed",          // iOS Safari network error (same as "Failed to fetch")
  "Failed to fetch",      // Network offline / ad blocker / third-party
  "Access is denied",     // sessionStorage blocked (private mode / Safari ITP)
  "Minified React error", // React hydration mismatch — usually browser extensions modifying DOM
  "addListener",          // Deprecated MediaQueryList.addListener in third-party ad/GTM scripts
  "Unexpected end of form", // Browser/network form parse error — not our code
];

function shouldIgnore(message: string): boolean {
  const m = message.toLowerCase();
  return IGNORE_PATTERNS.some((p) => m.includes(p.toLowerCase()));
}

function report(errorType: string, message: string) {
  if (shouldIgnore(message)) return;
  fetch("/api/report-error/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      errorSource: "FRONTEND",
      errorType,
      message: message.substring(0, 500),
      pageUrl: window.location.href,
    }),
  }).catch(() => {});
}

export default function GlobalErrorTracker() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      report("JS Error: " + e.message, e.message + (e.filename ? ` (${e.filename}:${e.lineno})` : ""));
    };

    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message ?? String(e.reason ?? "Unhandled rejection");
      report("Unhandled Promise: " + msg, msg);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    // Intercept RSC navigation requests — if the old deployment has been removed
    // (Vercel returns 410 GONE), the browser would silently blank out sections.
    // Detect this and do a hard reload so the new deployment's HTML is served.
    const originalFetch = window.fetch;
    let reloading = false;
    window.fetch = async function (...args: Parameters<typeof fetch>) {
      const res = await originalFetch.apply(this, args);
      if (res.status === 410 && !reloading) {
        const reqUrl =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof Request
            ? args[0].url
            : "";
        if (reqUrl.includes("_rsc=")) {
          reloading = true;
          window.location.reload();
        }
      }
      return res;
    };

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
