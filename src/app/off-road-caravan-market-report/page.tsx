import type { Metadata } from "next";
import Home from "./home";
import "../globals.css";

export const metadata: Metadata = {
  title: "Australian Off Road Caravan Market Report 2026 | Prices & Data",
  description:
    "Explore 2026 Australian off road caravan market data, including new and used asking prices, listings by state, popular sizes, ATM, sleeps and brands.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.caravansforsale.com.au/off-road-caravan-market-report/" },
};

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;

const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

async function safeJson(url: string): Promise<any> {
  try {
    const res = await fetch(url, { headers: wpHeaders(), next: { revalidate: 0 } });
    if (!res.ok) return null;
    const raw = await res.text();
    const start = raw.indexOf("{");
    return JSON.parse(start <= 0 ? raw : raw.substring(start));
  } catch { return null; }
}

export type SnapshotData = {
  total_count: number;
  new_count: number;
  used_count: number;
  unknown_count: number;
  new_price_median: number;
  used_price_median: number;
  median_price: number;
  price_p25: number;
  price_p75: number;
  new_price_p25: number;
  new_price_p75: number;
  new_price_min: number;
  new_price_max: number;
  used_price_p25: number;
  used_price_p75: number;
  used_price_min: number;
  used_price_max: number;
  common_length: string;
  median_atm: number;
  common_sleeps: number;
  median_atm_new: number;
  median_atm_used: number;
  median_length_new: number;
  median_length_used: number;
  atm_coverage_pct: number;
  length_coverage_pct: number;
  snapshot_date: string;
};

export type StateRow     = { state: string; count: number; share: number; median_price: number };
export type LengthRow    = { range: string; count: number; share: number; median_price: number };
export type AtmRow       = { range: string; count: number; share: number; median_price: number };
export type SleepsRow    = { berths: string; count: number; share: number; median_price: number };
export type BrandRow     = { brand: string; count: number; share: number; median_price: number; median_atm: number };
export type TrendPoint   = { label: string; total: number; new_count: number; used_count: number };

export type MarketReportData = {
  snapshot:   SnapshotData;
  states:     StateRow[];
  lengths:    LengthRow[];
  atms:       AtmRow[];
  sleeps:     SleepsRow[];
  brands:     BrandRow[];
  trend:      TrendPoint[];
};

/* ── Label maps for nested-object distributions ── */
const LENGTH_LABELS: Record<string, string> = {
  under_16:           "Under 16ft",
  "16_to_18":         "16ft to under 18ft",
  "18_to_20":         "18ft to under 20ft",
  "20_to_22":         "20ft to under 22ft",
  "22_plus":          "22ft and over",
  unknown_or_invalid: "Unknown / Invalid",
};
const ATM_LABELS: Record<string, string> = {
  under_1500:         "Under 1,500kg",
  "1500_1999":        "1,500–1,999kg",
  "2000_2499":        "2,000–2,499kg",
  "2500_2999":        "2,500–2,999kg",
  "3000_plus":        "3,000kg and over",
  unknown_or_invalid: "Unknown / Invalid",
};
const SLEEP_LABELS: Record<string, string> = {
  "2":      "2 berth",
  "3":      "3 berth",
  "4":      "4 berth",
  "5":      "5 berth",
  "6_plus": "6+ berth",
  unknown:  "Unknown",
};
const STATE_LABELS: Record<string, string> = {
  victoria:                       "Victoria",
  queensland:                     "Queensland",
  "new-south-wales":              "New South Wales",
  "western-australia":            "Western Australia",
  "south-australia":              "South Australia",
  tasmania:                       "Tasmania",
  "australian-capital-territory": "ACT",
  "northern-territory":           "Northern Territory",
};
const COMMON_LENGTH_LABELS: Record<string, string> = {
  under_16:   "Under 16ft",
  "16_to_18": "16ft–18ft",
  "18_to_20": "18ft–20ft",
  "20_to_22": "20ft–22ft",
  "22_plus":  "22ft and over",
};

function toTitleCase(slug: string): string {
  return slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function parseDist<T>(
  dist: Record<string, any> | undefined,
  labelMap: Record<string, string>,
  transform: (key: string, val: any, label: string) => T,
): T[] {
  if (!dist || typeof dist !== "object") return [];
  return Object.entries(dist)
    .filter(([, v]) => v && typeof v === "object")
    .map(([key, val]) => transform(key, val, labelMap[key] ?? toTitleCase(key)));
}

async function fetchAllData(): Promise<MarketReportData> {
  const EMPTY: MarketReportData = {
    snapshot: {
      total_count: 0, new_count: 0, used_count: 0, unknown_count: 0,
      new_price_median: 0, used_price_median: 0, median_price: 0,
      price_p25: 0, price_p75: 0,
      new_price_p25: 0, new_price_p75: 0, new_price_min: 0, new_price_max: 0,
      used_price_p25: 0, used_price_p75: 0, used_price_min: 0, used_price_max: 0,
      common_length: "", median_atm: 0, common_sleeps: 0,
      median_atm_new: 0, median_atm_used: 0,
      median_length_new: 0, median_length_used: 0,
      atm_coverage_pct: 0, length_coverage_pct: 0, snapshot_date: "",
    },
    states: [], lengths: [], atms: [], sleeps: [], brands: [], trend: [],
  };

  const j = await safeJson(`${API_BASE}/market_snapshot?category=off-road`);
  if (!j?.success) return EMPTY;

  const snapshot: SnapshotData = {
    total_count:         j.total_count         ?? 0,
    new_count:           j.new_count           ?? 0,
    used_count:          j.used_count          ?? 0,
    unknown_count:       j.unknown_count        ?? 0,
    new_price_median:    j.new_price_median     ?? 0,
    used_price_median:   j.used_price_median    ?? 0,
    median_price:        j.price_median         ?? j.median_price ?? 0,
    price_p25:           j.price_p25            ?? 0,
    price_p75:           j.price_p75            ?? 0,
    new_price_p25:       j.new_price_p25        ?? 0,
    new_price_p75:       j.new_price_p75        ?? 0,
    new_price_min:       j.new_price_min        ?? 0,
    new_price_max:       j.new_price_max        ?? 0,
    used_price_p25:      j.used_price_p25       ?? 0,
    used_price_p75:      j.used_price_p75       ?? 0,
    used_price_min:      j.used_price_min       ?? 0,
    used_price_max:      j.used_price_max       ?? 0,
    common_length:       COMMON_LENGTH_LABELS[j.most_common_length ?? ""] ?? j.common_length ?? "",
    median_atm:          j.median_atm_all       ?? j.median_atm ?? 0,
    common_sleeps:       j.most_common_sleeps   ?? j.common_sleeps ?? 0,
    median_atm_new:      j.median_atm_new        ?? 0,
    median_atm_used:     j.median_atm_used       ?? 0,
    median_length_new:   j.median_length_new     ?? 0,
    median_length_used:  j.median_length_used    ?? 0,
    atm_coverage_pct:    j.atm_coverage_pct      ?? 0,
    length_coverage_pct: j.length_coverage_pct   ?? 0,
    snapshot_date:       j.snapshot_date         ?? "",
  };

  const lengths: LengthRow[] = parseDist(j.length_distribution, LENGTH_LABELS,
    (_, val, label) => ({
      range:        label,
      count:        val.count        ?? 0,
      share:        val.share_pct    ?? 0,
      median_price: val.median_price ?? 0,
    }),
  );

  const atms: AtmRow[] = parseDist(j.atm_distribution, ATM_LABELS,
    (_, val, label) => ({
      range:        label,
      count:        val.count        ?? 0,
      share:        val.share_pct    ?? 0,
      median_price: val.median_price ?? 0,
    }),
  );

  const sleeps: SleepsRow[] = parseDist(j.sleeps_distribution, SLEEP_LABELS,
    (_, val, label) => ({
      berths:       label,
      count:        val.count        ?? 0,
      share:        val.share_pct    ?? 0,
      median_price: val.median_price ?? 0,
    }),
  );

  const states: StateRow[] = parseDist(j.state_distribution, STATE_LABELS,
    (_, val, label) => ({
      state:        label,
      count:        val.count        ?? 0,
      share:        val.share_pct    ?? 0,
      median_price: val.median_price ?? 0,
    }),
  ).sort((a, b) => b.count - a.count);

  const brands: BrandRow[] = parseDist(j.brand_distribution, {},
    (key, val) => ({
      brand:        toTitleCase(key),
      count:        val.count        ?? 0,
      share:        val.share_pct    ?? 0,
      median_price: val.median_price ?? 0,
      median_atm:   val.median_atm   ?? 0,
    }),
  ).sort((a, b) => b.count - a.count);

  return { snapshot, states, lengths, atms, sleeps, brands, trend: [] };
}

export const revalidate = 0;

const CANONICAL = "https://www.caravansforsale.com.au/off-road-caravan-market-report/";

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": CANONICAL,
      "url": CANONICAL,
      "headline": "Australian Off Road Caravan Market Report 2026",
      "description": "Analysis of active off road caravan advertisements on CaravansForSale.com.au covering prices, supply, sizes, weights, brands and location data across Australia.",
      "inLanguage": "en-AU",
      "publisher": { "@type": "Organization", "name": "CaravansForSale.com.au", "url": "https://www.caravansforsale.com.au/" },
      "breadcrumb": { "@id": `${CANONICAL}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${CANONICAL}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",              "item": "https://www.caravansforsale.com.au/" },
        { "@type": "ListItem", "position": 2, "name": "Off Road Caravans", "item": "https://www.caravansforsale.com.au/off-road-caravans/" },
        { "@type": "ListItem", "position": 3, "name": "Market Report",     "item": CANONICAL },
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How much does an off road caravan cost in Australia?",         "acceptedAnswer": { "@type": "Answer", "text": "The current median advertised asking price for off road caravans on CaravansForSale.com.au varies by condition. New caravans typically carry a higher median than used caravans. Check the live market data on this page for current figures." } },
        { "@type": "Question", "name": "Which state has the most off road caravans for sale?",         "acceptedAnswer": { "@type": "Answer", "text": "Victoria typically has the largest number of off road caravans advertised on CaravansForSale.com.au, followed by New South Wales and Queensland." } },
        { "@type": "Question", "name": "What is the most common off road caravan size?",               "acceptedAnswer": { "@type": "Answer", "text": "The 18–20ft range is consistently one of the most common size categories advertised across Australian off road caravan listings." } },
        { "@type": "Question", "name": "Are the prices in this report actual sale prices?",             "acceptedAnswer": { "@type": "Answer", "text": "No. All prices shown are advertised asking prices from active marketplace listings. The final amount paid may differ from the advertised price." } },
        { "@type": "Question", "name": "What is ATM and why does it matter for off road caravans?",    "acceptedAnswer": { "@type": "Answer", "text": "ATM means Aggregate Trailer Mass — the maximum allowable laden weight of the caravan as specified by the manufacturer. It is a key figure when determining whether a tow vehicle is rated to tow a specific caravan." } },
      ],
    },
  ],
};

export default async function OffRoadMarketReportPage() {
  const data = await fetchAllData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <Home data={data} />
    </>
  );
}
