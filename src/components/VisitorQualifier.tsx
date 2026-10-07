"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ENGAGEMENT_EVENT } from "@/utils/engagement";
import { matchQualifyRule, type QualifySignals } from "@/utils/qualifyRules";

/* Tracks active engagement, filter/search actions and distinct caravan listings.
   When a qualification rule is met it asks /api/visitor-qualify/ (which also checks
   IP screening) and, if qualified, pushes `qualified_visitor` to the GTM dataLayer.
   Never redirects — the visitor stays on their page. */

const STORAGE_KEY = "cfs_vq";
const IDLE_LIMIT_MS = 15_000;            // no interaction for 15s → time stops counting
const SESSION_GAP_MS = 30 * 60_000;      // 30 min away → engagement counters reset

interface State extends QualifySignals {
  lastSeen: number;
  done?: "qualified" | "not_eligible";
  retryAt?: number;
}

const fresh = (): State => ({ listingIds: [], filterUsed: false, activeSeconds: 0, lastSeen: Date.now() });

function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as State | null;
    if (!s) return fresh();
    if (!s.done && Date.now() - s.lastSeen > SESSION_GAP_MS) return fresh();
    return s;
  } catch {
    return fresh();
  }
}

/* Read-modify-write so several open tabs share one state */
function update(fn: (s: State) => void): State {
  const s = load();
  fn(s);
  s.lastSeen = Date.now();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  return s;
}

function listingIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/product\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function VisitorQualifier() {
  const pathname = usePathname();
  const lastInteraction = useRef(Date.now());
  const inFlight = useRef(false);

  const tryQualify = (s: State) => {
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
          update(st => { st.done = "qualified"; });
          if (!res.already) {
            const w = window as any;
            w.dataLayer = w.dataLayer || [];
            w.dataLayer.push({ event: "qualified_visitor", qualify_rule: res.rule });
          }
        } else if (res?.status === "suspicious" || res?.status === "unknown") {
          update(st => { st.done = "not_eligible"; });
        } else {
          // rules_not_met / disabled / no_visitor → try again later
          const wait = res?.status === "disabled" ? 10 * 60_000 : 30_000;
          update(st => { st.retryAt = Date.now() + wait; });
        }
      })
      .catch(() => update(st => { st.retryAt = Date.now() + 30_000; }))
      .finally(() => { inFlight.current = false; });
  };

  /* Caravan detail page views (distinct listing IDs) */
  useEffect(() => {
    const id = pathname ? listingIdFromPath(pathname) : null;
    if (!id) return;
    const s = update(st => { if (!st.listingIds.includes(id)) st.listingIds.push(id); });
    tryQualify(s);
  }, [pathname]);

  /* Active engagement timer + filter/search actions */
  useEffect(() => {
    if (load().done) return;

    const markActive = () => { lastInteraction.current = Date.now(); };
    const activity = ["pointerdown", "pointermove", "keydown", "scroll", "wheel", "touchstart"];
    activity.forEach(e => window.addEventListener(e, markActive, { passive: true }));

    const onEngage = () => {
      markActive();
      tryQualify(update(st => { st.filterUsed = true; }));
    };
    window.addEventListener(ENGAGEMENT_EVENT, onEngage);

    const timer = setInterval(() => {
      const active = document.visibilityState === "visible" && Date.now() - lastInteraction.current < IDLE_LIMIT_MS;
      if (!active) return;
      const s = update(st => { st.activeSeconds += 1; });
      if (s.done) clearInterval(timer);
      else tryQualify(s);
    }, 1000);

    return () => {
      clearInterval(timer);
      activity.forEach(e => window.removeEventListener(e, markActive));
      window.removeEventListener(ENGAGEMENT_EVENT, onEngage);
    };
  }, []);

  return null;
}
