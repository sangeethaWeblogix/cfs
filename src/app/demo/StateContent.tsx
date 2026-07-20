"use client";

import { useState } from "react";
import { sanitizeRichText } from "@/utils/sanitizeRichText";

type Faq = { q: string; a: string };

interface Props {
  footerDescription?: string;
  faq?: string;
}

function parseFaq(raw?: string): Faq[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((f): f is Faq => !!f?.q && !!f?.a);
  } catch {
    return [];
  }
}

function FaqItem({ q, a }: Faq) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lsd-faq__item${open ? " lsd-faq__item--open" : ""}`}>
      <button className="lsd-faq__q" onClick={() => setOpen(!open)}>
        {q}
        <svg className="lsd-faq__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {open ? <line x1="5" y1="12" x2="19" y2="12"/> : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
        </svg>
      </button>
      {open && <div className="lsd-faq__a" dangerouslySetInnerHTML={{ __html: a }} />}
    </div>
  );
}

export default function StateContent({ footerDescription, faq }: Props) {
  const showLeft  = !!footerDescription?.trim();
  const faqItems  = parseFaq(faq);
  const showRight = faqItems.length > 0;

  if (!showLeft && !showRight) return null;

  return (
    <section className="lsd-content">
      <div className="container">
        <div className="lsd-content__grid">

          {showLeft && (
            <div
              className="lsd-content__left lsd-content__body"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(footerDescription) }}
            />
          )}

          {showRight && (
            <div className="lsd-content__right">
              <h2 className="lsd-content__title">Frequently Asked Questions</h2>
              <div className="lsd-faq">
                {faqItems.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
