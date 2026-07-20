"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/*
Scroll to top instantly whenever the URL (pathname or query) changes
 */

export default function ScrollToTopGlobal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    history.scrollRestoration = "manual";
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, searchParams.toString()]);

  return null;
}
