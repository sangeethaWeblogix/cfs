"use client";

import { useState } from "react";
import { HOME_FAQS } from "./faqData";

/* Home page FAQ: category pills + accordion. Every answer is in the HTML (inactive tabs and
   closed answers just carry `hidden`), so crawlers read all 57 questions. */
export default function HomeFaq() {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="hfaq-section" aria-labelledby="hfaq-title">
      <div className="container">
        <h2 id="hfaq-title" className="hfaq-title">Frequently Asked Questions</h2>

        <div className="hfaq-tabs" role="tablist" aria-label="FAQ categories">
          {HOME_FAQS.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              id={`hfaq-tab-${cat.id}`}
              aria-selected={i === tab}
              aria-controls={`hfaq-panel-${cat.id}`}
              className={`hfaq-tab${i === tab ? " hfaq-tab--active" : ""}`}
              onClick={() => {
                setTab(i);
                setOpen(0);
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {HOME_FAQS.map((cat, i) => (
          <div
            key={cat.id}
            role="tabpanel"
            id={`hfaq-panel-${cat.id}`}
            aria-labelledby={`hfaq-tab-${cat.id}`}
            hidden={i !== tab}
            className="hfaq-card"
          >
            <div className="hfaq-card-head">
              <h3 className="hfaq-card-title">{cat.label}</h3>
              <span className="hfaq-card-count">{cat.items.length} questions</span>
            </div>

            <ul className="hfaq-list">
              {cat.items.map((item, j) => {
                const isOpen = open === j;
                const qid = `hfaq-q-${cat.id}-${j}`;
                return (
                  <li key={qid} className={`hfaq-item${isOpen ? " hfaq-item--open" : ""}`}>
                    <button
                      type="button"
                      className="hfaq-q"
                      id={qid}
                      aria-expanded={isOpen}
                      aria-controls={`${qid}-a`}
                      onClick={() => setOpen(isOpen ? null : j)}
                    >
                      <span>{item.q}</span>
                      <svg className="hfaq-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <div
                      id={`${qid}-a`}
                      role="region"
                      aria-labelledby={qid}
                      hidden={!isOpen}
                      className="hfaq-a"
                      dangerouslySetInnerHTML={{ __html: item.a }}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
