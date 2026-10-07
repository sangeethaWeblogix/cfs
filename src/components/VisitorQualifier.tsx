"use client";

import { useEffect, useRef } from "react";
import { loadEngagement, updateEngagement, type EngagementState } from "@/utils/engagement";
import { matchQualifyRule } from "@/utils/qualifyRules";

/* Counts active engagement time and, once a qualification rule is met, asks
   /api/visitor-qualify/ (which confirms IP screening = eligible). If qualified,
   pushes `qualified_visitor` to the GTM dataLayer. Never redirects. */

const IDLE_LIMIT_MS = 15_000;   // no interaction for 15s → time stops counting
const RETRY_MS = 30_000;
const NOT_ELIGIBLE_RETRY_MS = 60 * 60_000;
const DISABLED_RETRY_MS = 10 * 60_000;

export default function VisitorQualifier() {
  const lastInteraction = useRef(Date.now());
  const inFlight = useRef(false);

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
        body: JSON.stringify({ listingIds: s.listingIds, filterUsed: s.filterUsed, activeSeconds: s.activeSeconds }),
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
          } else if (res?.status === "suspicious" || res?.status === "unknown") {
            retryIn(NOT_ELIGIBLE_RETRY_MS);   // re-asked later in case screening is refreshed (e.g. IP change)
          } else {
            retryIn(res?.status === "disabled" ? DISABLED_RETRY_MS : RETRY_MS);
          }
        })
        .catch(() => retryIn(RETRY_MS))
        .finally(() => { inFlight.current = false; });
    };

    const markActive = () => { lastInteraction.current = Date.now(); };
    const activity = ["pointerdown", "pointermove", "keydown", "scroll", "wheel", "touchstart"];
    activity.forEach(e => window.addEventListener(e, markActive, { passive: true }));

    // Count a second only while the page is visible AND the visitor was active recently
    const timer = setInterval(() => {
      const active = document.visibilityState === "visible" && Date.now() - lastInteraction.current < IDLE_LIMIT_MS;
      const s = active ? updateEngagement(st => { st.activeSeconds += 1; }) : loadEngagement();
      if (s.done) clearInterval(timer);
      else tryQualify(s);   // also picks up listing views / filters recorded by other components
    }, 1000);

    return () => {
      clearInterval(timer);
      activity.forEach(e => window.removeEventListener(e, markActive));
    };
  }, []);

  return null;
}
