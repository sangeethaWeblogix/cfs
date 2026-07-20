"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function NavigationHistory() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (!pathname) return;

    try {
      const existing = sessionStorage.getItem("nav_history");
      const history: string[] = existing ? JSON.parse(existing) : [];
      if (history[history.length - 1] !== pathname) {
        history.push(pathname);
        sessionStorage.setItem("nav_history", JSON.stringify(history));
      }
    } catch {}

    // Push GTM pageview on every client-side navigation (skip initial load — GTM handles that via gtm.js)
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: "pageview",
        page_path: pathname,
        page_location: window.location.href,
      });
    } catch {}
  }, [pathname]);

  return null;
}
