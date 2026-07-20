import Dealer from "./dealer";
import "./dealer.css";

const schemaGraph = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://www.caravansforsale.com.au/dealer-advertising/#webpage",
    "url": "https://www.caravansforsale.com.au/dealer-advertising/",
    "name": "Caravan Dealer Advertising | Unlimited Listings $299/Month | CaravansForSale",
    "description": "Advertise your caravan dealership on CaravansForSale.com.au. Unlimited listings, zero lead fees, $299/month (inc. GST). Cancel anytime.",
    "isPartOf": { "@id": "https://www.caravansforsale.com.au/#website" },
    "breadcrumb": { "@id": "https://www.caravansforsale.com.au/dealer-advertising/#breadcrumb" },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": "https://www.caravansforsale.com.au/dealer-advertising/#breadcrumb",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.caravansforsale.com.au/" },
      { "@type": "ListItem", "position": 2, "name": "Dealer Advertising", "item": "https://www.caravansforsale.com.au/dealer-advertising/" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Caravan Dealer Advertising",
    "provider": {
      "@type": "Organization",
      "name": "Caravans For Sale",
      "url": "https://www.caravansforsale.com.au/",
    },
    "description": "Unlimited caravan listings on CaravansForSale.com.au for $299/month (inc. GST). Zero lead fees, no lock-in contracts, automatic inventory sync.",
    "url": "https://www.caravansforsale.com.au/dealer-advertising/",
    "areaServed": { "@type": "Country", "name": "Australia" },
    "offers": {
      "@type": "Offer",
      "price": "299",
      "priceCurrency": "AUD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "299",
        "priceCurrency": "AUD",
        "unitText": "MONTH",
      },
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does the dealer subscription cost, and what's included?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The dealer subscription is $299 per month (including GST). This flat monthly fee allows your dealership to list unlimited caravans on CaravansForSale.com.au. There are no per-listing charges, and we never charge per lead or take success commissions – no matter how many inquiries or sales you get, $299/month covers it all.",
        },
      },
      {
        "@type": "Question",
        "name": "How are my caravan listings added and kept up-to-date automatically?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We sync directly with your dealership's website. Your listings are pulled automatically and refreshed weekly to match your current inventory.",
        },
      },
      {
        "@type": "Question",
        "name": "What kind of audience will my caravans reach?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "CaravansForSale.com.au is a caravan-only marketplace with a focused, nationwide audience of serious buyers.",
        },
      },
      {
        "@type": "Question",
        "name": "Do I have to commit to a long-term contract?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. The subscription is month-to-month with no lock-in contracts. You can cancel anytime.",
        },
      },
      {
        "@type": "Question",
        "name": "How do I get started, and what support can I expect?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Getting started is fast and easy. Our team assists with onboarding, website feed integration, and ongoing dealer support.",
        },
      },
    ],
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaGraph, null, 2).replace(/</g, "\\u003c"),
        }}
      />
      <Dealer />
    </>
  );
}
