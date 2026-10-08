"use client";

import { useEffect, useRef } from "react";
import { loadEngagement, updateEngagement, type EngagementState } from "@/utils/engagement";
import { matchQualifyRule } from "@/utils/qualifyRules";
import { getEntrySource, publishVisitorStatus } from "@/utils/visitorStatus";

/* Counts active engagement time and, once a qualification rule is met, asks
   /api/visitor-qualify/ (which confirms IP screening = eligible). If qualified,
   pushes `qualified_visitor` to the GTM dataLayer and updates visitor_status to "ps".
   Never redirects or changes the URL. */

const IDLE_LIMIT_MS = 15_000;   // no interaction for 15s → time stops counting
const RETRY_MS = 30_000;
const NOT_ELIGIBLE_RETRY_MS = 60 * 60_000;
const DISABLED_RETRY_MS = 10 * 60_000;
const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);

export default function VisitorQualifier() {
  const lastInteraction = useRef(Date.now());
  const inFlight = useRef(false);
  const pendingClick = useRef(false);    // flushed to storage on the next 1s tick
  const pendingScroll = useRef(false);

  useEffect(() => {
    if (loadEngagement().done) return;

    const retryIn = (ms: number) => updateEngagement(st => { st.retryAt = Date.now() + ms; }, false);

    const tryQualify = (s: EngagementState) => {
      if (s.done || inFlight.current || (s.retryAt && Date.now() < s.retryAt)) return;
      if (!matchQualifyRule(s)) return;

      inFlight.current = true;
      fetch("/api/visitor-qualify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          listingIds: s.listingIds, filterUsed: s.filterUsed, scrolled: s.scrolled, clicked: s.clicked, activeSeconds: s.activeSeconds,
          entry: getEntrySource(),
        }),
      })
        .then(r => r.json())
        .then(res => {
          if (res?.qualified) {
            updateEngagement(st => { st.done = "qualified"; }, false);
            if (!res.already) {
              const w = window as any;
              w.dataLayer = w.dataLayer || [];
              w.dataLayer.push({ event: "qualified_visitor", qualify_rule: res.rule });
            }
            publishVisitorStatus("ps");   // uk → ps on this page, no reload / URL change
          } else if (res?.status === "suspicious" || res?.status === "unknown") {
            if (res.status === "suspicious") publishVisitorStatus("as");
            retryIn(NOT_ELIGIBLE_RETRY_MS);   // re-asked later in case screening is refreshed (e.g. IP change)
          } else {
            retryIn(res?.status === "disabled" ? DISABLED_RETRY_MS : RETRY_MS);
          }
        })
        .catch(() => retryIn(RETRY_MS))
        .finally(() => { inFlight.current = false; });
    };

    // Any of these keeps the timer running; only real clicks / scrolls count as qualifying actions
    const markActive = () => { lastInteraction.current = Date.now(); };
    const markClick = () => { markActive(); pendingClick.current = true; };
    const markScroll = () => { markActive(); pendingScroll.current = true; };
    const markKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
      if (SCROLL_KEYS.has(e.key) && !typing) markScroll(); else markActive();
    };

    // "scroll" itself isn't a qualifying action: it also fires for programmatic scrolls (e.g. route changes)
    const activity = ["pointerdown", "pointermove", "scroll", "touchstart"];
    activity.forEach(e => window.addEventListener(e, markActive, { passive: true }));
    window.addEventListener("click", markClick, { passive: true });
    window.addEventListener("wheel", markScroll, { passive: true });
    window.addEventListener("touchmove", markScroll, { passive: true });
    window.addEventListener("keydown", markKey, { passive: true });

    // Count a second only while the page is visible AND the visitor was active recently
    const timer = setInterval(() => {
      const active = document.visibilityState === "visible" && Date.now() - lastInteraction.current < IDLE_LIMIT_MS;
      const click = pendingClick.current, scroll = pendingScroll.current;
      pendingClick.current = pendingScroll.current = false;
      const s = active || click || scroll
        ? updateEngagement(st => {
            if (active) st.activeSeconds += 1;
            if (click) st.clicked = true;
            if (scroll) st.scrolled = true;
          })
        : loadEngagement();
      if (s.done) clearInterval(timer);
      else tryQualify(s);   // also picks up listing views / filters recorded by other components
    }, 1000);

    return () => {
      clearInterval(timer);
      activity.forEach(e => window.removeEventListener(e, markActive));
      window.removeEventListener("click", markClick);
      window.removeEventListener("wheel", markScroll);
      window.removeEventListener("touchmove", markScroll);
      window.removeEventListener("keydown", markKey);
    };
  }, []);

  return null;
}
