import type { Metadata } from "next";
import Home from "./home";
import "../globals.css";

export const metadata: Metadata = {
  title: "Off Road Caravan Types Compared | Semi, Full, Hybrid & Extreme",
  description:
    "Compare semi, full, extreme and hybrid off road caravans in Australia. Understand terrain capability, towing, weight, construction and off-grid features.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.caravansforsale.com.au/off-road-caravan-types/" },
};

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;

const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

type SnapshotData = {
  total_count: number;
  new_count: number;
  used_count: number;
  used_price_median: number;
  new_price_median: number;
};

async function fetchPopularBlogs(seed: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${API_BASE}/blog-shuffle?popular=off-road&seed=${seed}`,
      { headers: wpHeaders(), next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    return json?.data ?? json?.posts ?? json?.items ?? [];
  } catch { return []; }
}

async function fetchOffRoadSnapshot(): Promise<SnapshotData> {
  const empty = { total_count: 0, new_count: 0, used_count: 0, used_price_median: 0, new_price_median: 0 };
  try {
    const res = await fetch(
      `${API_BASE}/market_snapshot?category=off-road`,
      { headers: wpHeaders(), next: { revalidate: 0 } }
    );
    if (!res.ok) return empty;
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    if (!json?.success) return empty;
    return {
      total_count:       json.total_count      ?? 0,
      new_count:         json.new_count        ?? 0,
      used_count:        json.used_count       ?? 0,
      used_price_median: json.used_price_median ?? 0,
      new_price_median:  json.new_price_median  ?? 0,
    };
  } catch {
    return empty;
  }
}

export const revalidate = 0;

const CANONICAL = "https://www.caravansforsale.com.au/off-road-caravan-types/";

const schemaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": CANONICAL,
      "url": CANONICAL,
      "name": "Off Road Caravan Types Compared | Semi, Full, Hybrid & Extreme",
      "description": "Compare semi, full, extreme and hybrid off road caravans in Australia. Understand terrain capability, towing, weight, construction and off-grid features.",
      "inLanguage": "en-AU",
      "breadcrumb": { "@id": `${CANONICAL}#breadcrumb` },
      "isPartOf": { "@type": "WebSite", "url": "https://www.caravansforsale.com.au/" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${CANONICAL}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",              "item": "https://www.caravansforsale.com.au/" },
        { "@type": "ListItem", "position": 2, "name": "Off Road Caravans", "item": "https://www.caravansforsale.com.au/off-road-caravans/" },
        { "@type": "ListItem", "position": 3, "name": "Off Road Caravan Types", "item": CANONICAL },
      ],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "What are the main types of off road caravans?",                          "acceptedAnswer": { "@type": "Answer", "text": "The most commonly used categories in Australia are semi off road, full off road, extreme off road and hybrid off road caravans. These are commonly used market descriptions rather than one nationally standardised classification system, so specifications should always be compared between individual models." } },
        { "@type": "Question", "name": "What is the difference between semi off road and full off road caravans?","acceptedAnswer": { "@type": "Answer", "text": "Semi off road caravans are generally intended for sealed roads, gravel and maintained unsealed roads. Full off road caravans typically add more substantial suspension, chassis, ground clearance, protection and off-grid equipment for more demanding remote-road travel." } },
        { "@type": "Question", "name": "What is an extreme off road caravan?",                                   "acceptedAnswer": { "@type": "Answer", "text": "Extreme off road is generally a marketing term used for highly specified caravans designed around serious remote travel. They often include heavy-duty suspension, increased payload, extensive protection and larger water, battery and solar systems." } },
        { "@type": "Question", "name": "What is a hybrid off road caravan?",                                     "acceptedAnswer": { "@type": "Answer", "text": "A hybrid off road caravan combines features of an off-road camper trailer and a caravan. Hybrids are commonly more compact than conventional caravans while retaining hard-sided sleeping accommodation and many caravan-style amenities." } },
        { "@type": "Question", "name": "Is a hybrid caravan better than a full off road caravan?",               "acceptedAnswer": { "@type": "Answer", "text": "Neither type is automatically better. A hybrid generally offers more compact dimensions and manoeuvrability, while a full-size off road caravan usually offers greater internal living space and storage. The right choice depends on your travel plans." } },
        { "@type": "Question", "name": "Do I need a 4WD to tow an off road caravan?",                            "acceptedAnswer": { "@type": "Answer", "text": "Not every off road caravan automatically requires a 4WD, but the tow vehicle must be suitable for the caravan's loaded weight and intended terrain. Remote or demanding off-road travel will generally favour appropriately rated four-wheel-drive tow vehicles." } },
        { "@type": "Question", "name": "Does full off road mean a caravan can go anywhere?",                      "acceptedAnswer": { "@type": "Answer", "text": "No. A caravan marketed as full off road still has limits. Always check the manufacturer's intended-use statement, specifications and warranty conditions before travelling on difficult terrain." } },
        { "@type": "Question", "name": "Are off road caravans heavier than touring caravans?",                    "acceptedAnswer": { "@type": "Answer", "text": "They often can be because stronger chassis components, suspension, larger tyres, additional batteries, water tanks and protection systems add weight. However, weight varies significantly between models." } },
        { "@type": "Question", "name": "Is independent suspension essential for an off road caravan?",            "acceptedAnswer": { "@type": "Answer", "text": "Independent suspension is common on full off-road caravans because it can improve wheel movement over uneven terrain, but it is only one part of the overall design. Chassis, tyres, brakes, clearance, body construction and payload are also important." } },
        { "@type": "Question", "name": "How do I know which off road caravan is right for me?",                   "acceptedAnswer": { "@type": "Answer", "text": "Start with the roads you genuinely intend to travel, then consider your tow vehicle, caravan ATM, payload requirements, desired layout, number of travellers, off-grid duration and budget. Choose the level of off-road capability that matches those needs rather than simply buying the most heavily specified caravan available." } },
      ],
    },
  ],
};

export default async function OffRoadCaravanTypesPage() {
  const seed = Math.floor(Math.random() * 100000);
  const [snapshot, popularBlogs] = await Promise.all([
    fetchOffRoadSnapshot(),
    fetchPopularBlogs(seed),
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <Home snapshot={snapshot} popularBlogs={popularBlogs} />
    </>
  );
}
