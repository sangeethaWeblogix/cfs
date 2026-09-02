"use client";
import { useEffect } from "react";

const FALLBACK_SRC = "/images/download.svg";

/**
 * GlobalImageFallback
 *
 * Attaches a single capture-phase error listener to the document that fires
 * whenever ANY <img> on the page fails to load (404, network error, removed
 * from R2, etc.
 * ). Replaces the broken src with the local fallback placeholder.
 *
 * Registered once in layout.tsx — covers every page, every component,
 * including Next.js <Image>, raw <img> tags, and dynamically injected images.
 *
 * Also runs a one-time sweep on mount to catch images that already 404'd
 * before the listener was ready — important when Cloudflare serves cached HTML
 * and the browser starts loading images before React hydrates.
 */

function applyFallback(img: HTMLImageElement) {
  if (img.dataset.fallbackApplied) return;
  if (img.src.endsWith(FALLBACK_SRC)) return;
  img.dataset.fallbackApplied = "1";
  img.removeAttribute("srcset");
  img.src = FALLBACK_SRC;
}

export default function GlobalImageFallback() {
  useEffect(() => {
    function handleImageError(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      applyFallback(target);
    }

    // useCapture: true — image errors do NOT bubble, but they ARE reachable
    // at the document level during the capture phase.
    document.addEventListener("error", handleImageError, true);

    // One-time sweep: catch any images that already finished loading (and failed)
    // before this listener was attached. This closes the race window that exists
    // when Cloudflare serves cached HTML — the browser can parse and fire image
    // requests before React hydration completes and useEffect runs.
    document.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      // complete = true + naturalWidth = 0 means the image loaded but has no pixels → 404
      if (img.complete && img.naturalWidth === 0) {
        applyFallback(img);
      }
    });

    return () => {
      document.removeEventListener("error", handleImageError, true);
    };
  }, []);

  return null;
}
