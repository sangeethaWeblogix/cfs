"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getCachedStatus, getEntrySource, publishVisitorStatus, STATUS_CACHE_MS, type VisitorStatusCode } from "@/utils/visitorStatus";

/* On every page view, pushes { visitor_status, entry_source, entry_medium } to the GTM dataLayer.
   Status comes from /api/visitor-status/ (cached for the session, re-checked every 10 min).
   Never changes the URL. Upgrades to "ps" are pushed by <VisitorQualifier />. */

const PENDING_RETRY_MS = 2_000;
const PENDING_MAX_TRIES = 4;

const isScreenedPage = (p: string) => p === "/" || p.startsWith("/listings") || p.startsWith("/product/");

export default function VisitorStatus() {
  const pathname = usePathname();

  useEffect(() => {
    const src = getEntrySource();
    const cached = getCachedStatus();
    // Cached status is reused, except "unscreened" is re-checked on pages that start a screening
    if (cached && Date.now() - cached.at < STATUS_CACHE_MS && !(cached.status === "unscreened" && isScreenedPage(pathname))) {
      publishVisitorStatus(cached.status, src);
      return;
    }

    let cancelled = false;
    let tries = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const ask = () => {
      fetch("/api/visitor-status/", { credentials: "same-origin", cache: "no-store" })
        .then(r => r.json())
        .then((res: { status?: VisitorStatusCode | "pending" }) => {
          if (cancelled) return;
          // Screening started on this page view and is still running (MaxMind, max ~1.5s)
          if (res?.status === "pending" && ++tries < PENDING_MAX_TRIES) {
            retry = setTimeout(ask, PENDING_RETRY_MS);
            return;
          }
          const status = res?.status && res.status !== "pending" ? res.status : "unscreened";
          publishVisitorStatus(status, src);
        })
        .catch(() => { if (!cancelled) publishVisitorStatus(cached?.status ?? "unscreened", src); });
    };
    ask();

    return () => { cancelled = true; clearTimeout(retry); };
  }, [pathname]);

  return null;
}
