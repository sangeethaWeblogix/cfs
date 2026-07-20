import type { FilterBreadcrumb } from "./urlUtils";
import { sanitizeRichText } from "@/utils/sanitizeRichText";

const TRUST_ITEMS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec7200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: "2,652 caravans listed in Victoria",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec7200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    label: "New & used caravans",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec7200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    label: "Dealer & private seller listings",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec7200" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    label: "Browse by Melbourne, Geelong & more",
  },
];

interface Props {
  title?: string;
  description?: string;
  loading?: boolean;
  /** Up to 3 active-filter crumbs, in priority order — rendered after
   * Home > Caravans for Sale. See buildFilterBreadcrumbs in urlUtils.ts. */
  breadcrumbs?: FilterBreadcrumb[];
}

// Only rendered at all for indexed pages (see home.tsx) — non-indexed pages
// skip this component entirely rather than showing a stripped-down version.
export default function StateHero({ title, description, loading, breadcrumbs }: Props) {
  return (
    <section className="lsd-hero">
      {/* Background image — right side */}
      <img
        src="/images/banner_top_dk_new.webp"
        alt="Caravans for Sale in Victoria"
        className="lsd-hero__bg"
      />
      {/* Gradient overlay to blend left side */}
      <div className="lsd-hero__gradient" />

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <nav className="lsd-breadcrumb" aria-label="breadcrumb">
          <a href="/">Home</a>
          <svg width="12" height="20" viewBox="0 0 24 24" fill="none" stroke="#3e3e3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}} aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          <a href="/listings/">Caravans for Sale</a>
          {breadcrumbs?.map((crumb) => (
            <span key={crumb.href}>
              <svg width="12" height="20" viewBox="0 0 24 24" fill="none" stroke="#3e3e3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}} aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              <a href={crumb.href}>{crumb.label}</a>
            </span>
          ))}
        </nav>

        {/* Text content */}
        <div className="lsd-hero__content">
          {loading ? (
            <>
              <div className="lsd-skeleton lsd-hero__title-skeleton" />
              <div className="lsd-skeleton lsd-hero__desc-skeleton" />
              <div className="lsd-skeleton lsd-hero__desc-skeleton lsd-hero__desc-skeleton--short" />
            </>
          ) : (
            <>
              <h1 className="lsd-hero__title">
                {title || "Caravans for Sale"}
              </h1>

              <div
                className="lsd-hero__desc"
                dangerouslySetInnerHTML={{
                  __html: description
                    ? sanitizeRichText(description)
                    : "<p>Browse new and used caravans for sale from dealers and private sellers. " +
                      "Find off road caravans, family caravans, luxury caravans, pop tops, hybrids and " +
                      "touring caravans, and filter local inventory by price, condition, layout, berths, and travel dimensions.</p>",
                }}
              />
            </>
          )}
        </div>

        {/* Trust badges — single horizontal row */}
        {/* <div className="lsd-hero__trust">
          {TRUST_ITEMS.map((t) => (
            <div key={t.label} className="lsd-hero__trust-item">
              <span className="lsd-hero__trust-icon">{t.icon}</span>
              <span className="lsd-hero__trust-label">{t.label}</span>
            </div>
          ))}
        </div> */}
      </div>
    </section>
  );
}
