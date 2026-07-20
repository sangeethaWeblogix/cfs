import { Metadata } from "next";

const BASE_URL = "https://www.caravansforsale.com.au";

export interface StateData {
  slug: string;
  label: string;
  capital: string;
  abbr: string;
  mapImg: string;
}

export const STATES_DATA: Record<string, StateData> = {
  victoria: {
    slug: "victoria",
    label: "Victoria",
    capital: "Melbourne",
    abbr: "VIC",
    mapImg: "/images/vic_map.svg",
  },
  "new-south-wales": {
    slug: "new-south-wales",
    label: "New South Wales",
    capital: "Sydney",
    abbr: "NSW",
    mapImg: "/images/nsw_map.svg",
  },
  queensland: {
    slug: "queensland",
    label: "Queensland",
    capital: "Brisbane",
    abbr: "QLD",
    mapImg: "/images/qld_map.svg",
  },
  "south-australia": {
    slug: "south-australia",
    label: "South Australia",
    capital: "Adelaide",
    abbr: "SA",
    mapImg: "/images/sa_map.svg",
  },
  tasmania: {
    slug: "tasmania",
    label: "Tasmania",
    capital: "Hobart",
    abbr: "TAS",
    mapImg: "/images/tas_map.svg",
  },
  "western-australia": {
    slug: "western-australia",
    label: "Western Australia",
    capital: "Perth",
    abbr: "WA",
    mapImg: "/images/wa_map.svg",
  },
};

export const ALL_STATE_SLUGS = Object.keys(STATES_DATA);

export function getStateBySlug(slug: string): StateData | undefined {
  return STATES_DATA[slug];
}

export function buildStateMetadata(state: StateData): Metadata {
  return {
    title: `Sell My Caravan in ${state.label} | List Until Sold for $49`,
    description: `Sell your caravan in ${state.label} for just $49. List until sold, pay no commission and connect directly with caravan buyers across ${state.capital} and regional ${state.label}.`,
    robots: "index, follow",
    alternates: {
      canonical: `${BASE_URL}/sell-my-caravan/${state.slug}/`,
    },
  };
}

export function buildStateJsonLd(state: StateData) {
  const pageUrl = `${BASE_URL}/sell-my-caravan/${state.slug}/`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `Sell My Caravan in ${state.label} | List Until Sold for $49`,
        description: `Sell your caravan in ${state.label} with CaravansForSale.com.au. List for a one-time $49 fee, keep 100% of the sale price, and stay live until sold.`,
        inLanguage: "en-AU",
        isPartOf: { "@id": `${BASE_URL}/#website` },
      },
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: "Private Caravan Listing Service",
        url: pageUrl,
        description:
          "List your caravan for sale on CaravansForSale.com.au for a one-time $49 fee. No commissions, no subscriptions, live until sold.",
        provider: {
          "@type": "Organization",
          name: "Caravans For Sale",
          url: BASE_URL,
        },
        areaServed: {
          "@type": "State",
          name: state.label,
        },
        offers: {
          "@type": "Offer",
          price: "49",
          priceCurrency: "AUD",
          description: "One-time listing fee, live until sold, no commissions",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faqpage`,
        mainEntity: [
          {
            "@type": "Question",
            name: `How do I sell my caravan in ${state.label}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `You can sell your caravan in ${state.label} by creating a private seller listing on CaravansForSale.com.au. Add your caravan details, upload clear photos, set your asking price and publish your ad so buyers across ${state.capital} and regional ${state.label} can contact you directly.`,
            },
          },
          {
            "@type": "Question",
            name: `How much does it cost to sell my caravan in ${state.label}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "It costs $49 inc. GST to list your caravan on CaravansForSale.com.au. This is a one-time listing fee with no monthly subscription, no hidden charges and no commission when your caravan sells.",
            },
          },
          {
            "@type": "Question",
            name: "How long does my caravan listing stay live?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Your caravan listing stays live until sold. You do not need to keep paying monthly fees to keep your ad active. Once your caravan is sold, you can remove the listing from the website.",
            },
          },
          {
            "@type": "Question",
            name: "Can I edit my caravan listing after publishing?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. After your listing is published, you can update your caravan details, change the asking price, add or replace photos and improve your description if needed.",
            },
          },
          {
            "@type": "Question",
            name: "How do buyers contact me?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Interested buyers can contact you directly through your caravan listing. This allows you to answer questions, arrange inspections, negotiate the price and manage the sale privately.",
            },
          },
          {
            "@type": "Question",
            name: "Do I pay commission when my caravan sells?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. CaravansForSale.com.au does not charge commission when your caravan sells. You pay the one-time listing fee and keep 100% of the agreed sale price.",
            },
          },
          {
            "@type": "Question",
            name: `How should I price my caravan in ${state.label}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Check similar caravans for sale in ${state.label} before setting your price. Compare by make, model, year, condition, length, ATM, tare weight, sleeping capacity, features and location. A realistic asking price can help attract more genuine buyers.`,
            },
          },
          {
            "@type": "Question",
            name: "Is it safe to sell my caravan privately online?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes, but you should take normal precautions. Speak with buyers directly, meet in a safe location, confirm payment has cleared before handover and complete any required transfer paperwork for ${state.label}.`,
            },
          },
          {
            "@type": "Question",
            name: "Can I remove my listing after my caravan is sold?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Once your caravan has sold, you can remove your listing so buyers know it is no longer available.",
            },
          },
        ],
      },
    ],
  };
}
