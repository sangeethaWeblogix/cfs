import { HOME_FAQS } from "./faqData";

// FAQPage JSON-LD node for the home page, built from the very same data HomeFaq.tsx renders
// (every question/answer is in the page's HTML), so the markup always matches what is visible.
const plainText = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

export const HOME_FAQ_JSONLD = {
  "@type": "FAQPage",
  "@id": "https://www.caravansforsale.com.au/#faq",
  "url": "https://www.caravansforsale.com.au/",
  "name": "Frequently Asked Questions",
  "inLanguage": "en-AU",
  "isPartOf": { "@id": "https://www.caravansforsale.com.au/#website" },
  "mainEntity": HOME_FAQS.flatMap((cat) =>
    cat.items.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": plainText(item.a) },
    })),
  ),
};
