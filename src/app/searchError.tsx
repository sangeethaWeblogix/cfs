// src/app/components/SearchSection.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import {
  fetchHomeSearchList, // GET /home_search (base list)
  fetchKeywordSuggestions, // GET /home_search/?keyword=<q> (typed list)
} from "@/api/homeSearch/api";
import "./not-found.css";

type Item = {
  title?: string;
  name?: string;
  heading?: string;
  make?: string;
  url?: string;
  model?: string;
  variant?: string;
  slug?: string | number;
  id?: string | number;
  label?: string;
} & Record<string, unknown>;

// Safe label extractor (avoid mixing ?? and || without parens)

export default function SearchSection() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [baseSuggestions, setBaseSuggestions] = useState<Item[]>([]); // list for first-click
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // ------------- base list (first click) ---  const [loading, setLoading] = useState<string | null>(null);----------
  const loadBaseOnce = async () => {
    if (baseSuggestions.length) {
      setSuggestions(baseSuggestions);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await fetchHomeSearchList();

      const labels: Item[] = data.map((x) => ({
        id: x.id,
        label: (x.name ?? "").toString().trim(),
        url: (x.url ?? "").toString(),
      }));
      const sortedLabels = labels.sort((a, b) => {
        const aLabel = (a.label || "").trim().toLowerCase();
        const bLabel = (b.label || "").trim().toLowerCase();

        const aIsNumber = /^[0-9]/.test(aLabel);
        const bIsNumber = /^[0-9]/.test(bLabel);

        // ✅ Letters first, numbers later
        if (!aIsNumber && bIsNumber) return -1;
        if (aIsNumber && !bIsNumber) return 1;

        // Then sort alphabetically (case-insensitive)
        return aLabel.localeCompare(bLabel);
      });

      setBaseSuggestions(sortedLabels);
      setSuggestions(sortedLabels);
    } catch {
      setBaseSuggestions([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = async () => {
    setIsSuggestionBoxOpen(true);

    // ✅ Only load base list when input is empty
    if (!query.trim()) {
      await loadBaseOnce();
    }
  };

  const closeSuggestions = () => setIsSuggestionBoxOpen(false);

  // ------------- typed suggestions (≥ 3 chars) -------------
  useEffect(() => {
    const controller = new AbortController();

    if (query.length >= 3) {
      setLoading(true);
      setError("");
      const t = setTimeout(async () => {
        try {
          const list = await fetchKeywordSuggestions(query, controller.signal);
          // Normalize into Item[]
          const uniq: Item[] = Array.from(
            new Map(
              list.map((x, idx: number) => [
                (x.keyword || "").toString().trim(),
                {
                  id: x.id ?? idx, // fallback id
                  label: (x.keyword || "").toString().trim(), // ✅ always set label
                  url: (x.url || "").toString(),
                },
              ])
            ).values()
          );

          const sortedUniq = uniq.sort((a, b) => {
            const aLabel = (a.label || "").trim().toLowerCase();
            const bLabel = (b.label || "").trim().toLowerCase();

            const aIsNumber = /^[0-9]/.test(aLabel);
            const bIsNumber = /^[0-9]/.test(bLabel);

            // ✅ Letters first, numbers later
            if (!aIsNumber && bIsNumber) return -1;
            if (aIsNumber && !bIsNumber) return 1;

            // Then A-Z order
            return aLabel.localeCompare(bLabel);
          });

          setSuggestions(sortedUniq);
        } catch (e: unknown) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setError(e instanceof Error ? e.message : "Failed");
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => {
        controller.abort();
        clearTimeout(t);
      };
    } else {
      setSuggestions(baseSuggestions);
      setLoading(false);
      return () => controller.abort();
    }
  }, [query, baseSuggestions]);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setQuery(e.target.value);
    if (!isSuggestionBoxOpen) setIsSuggestionBoxOpen(true);
  };

  //   const navigateWithKeyword = (kwRaw: string) => {
  //     const kw = kwRaw.trim();
  //     if (!kw) return;
  //     // Put value in input for UX
  //     if (searchInputRef.current) searchInputRef.current.value = kw;
  //     // Navigate: /listings/?keyword=<kw>
  //     router.push(`/listings/?keyword=${encodeURIComponent(kw)}`);
  //     // Optional: close dropdown
  //     setIsSuggestionBoxOpen(false);
  //   };
  // ------------- navigate helper (two routes) -------------
  const navigateWithKeyword = (s: Item) => {
    const human = s.label?.trim();
    if (!human) return;

    flushSync(() => setQuery(human));
    setIsSuggestionBoxOpen(false);

    if (s.url && s.url.trim().length > 0) {
      router.push(s.url, { scroll: true });
    } else {
      // Convert spaces or special chars to hyphen and add -search
      const slug = human
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-") // replace spaces/symbols with "-"
        .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens

      router.push(`/listings/${slug}-search`, { scroll: true });
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      // Enter uses typed query directly
      const kw = (e.currentTarget as HTMLInputElement).value.trim();
      if (kw) {
        navigateWithKeyword({ name: kw });
      }
    }
    if (e.key === "Escape") closeSuggestions();
  };

  const showingFromKeywordApi = query.length >= 3;

  return (
    <div>
      <div className="container">
        <div className="row align-items-center justify-content-center">
          <div className="col-lg-12">
            <div className="section-head text-center">
              {/* overlay to close */}
              <div
                className="overlay_search"
                style={{ display: isSuggestionBoxOpen ? "block" : "none" }}
                onClick={closeSuggestions}
              />

              {/* search box */}
              <div className="search-container">
                <div className="search-wrap">
                  <i className="bi bi-search search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="search-box"
                    placeholder="Search by caravans..."
                    id="searchInput"
                    autoComplete="off"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={showSuggestions}
                    onClick={showSuggestions}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-controls="suggestionList"
                    aria-expanded={isSuggestionBoxOpen}
                  />
                  <div
                    className="close-btn"
                    style={{ display: isSuggestionBoxOpen ? "block" : "none" }}
                    onClick={closeSuggestions}
                    role="button"
                    id="suggestionList"
                    aria-label="Close suggestions"
                  >
                    <i className="bi bi-x-lg" />
                  </div>
                </div>

                {/* dropdown */}
                <div
                  className="suggestions"
                  style={{ display: isSuggestionBoxOpen ? "block" : "none" }}
                  role="listbox"
                >
                  <h4>
                    {showingFromKeywordApi
                      ? "Suggested searches"
                      : "Popular searches"}
                  </h4>

                  {error && <p className="text-red-600">{error}</p>}
                  {!error && loading && <p>Loading…</p>}

                  {!error && !loading && (
                    <ul className="text-left" id="suggestionList">
                      {suggestions?.length ? (
                        suggestions.map((s, idx) => (
                          <li
                            key={`${s.label}-${idx}`}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              navigateWithKeyword(s);
                            }}
                            style={{ cursor: "pointer" }}
                            role="option"
                            aria-selected="false"
                          >
                            {s.label}
                          </li>
                        ))
                      ) : (
                        <li className="text-muted">No matches</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
