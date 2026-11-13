// Home page JSON-LD supplied by the SEO team: the WebPage node (description, hasPart, and the
// navigation / category / state / brand ItemLists). The WebSite and Organization nodes it came
// with share their @ids with the ones in app/layout.tsx, so those fields are merged there
// instead of repeating the nodes. SearchAction is deliberately left out — the site has no
// home page search. The WebPage name is the site's own meta title, not the SEO draft's.
const SITE = "https://www.caravansforsale.com.au";

const itemList = (id: string, name: string, entries: [string, string][]) => ({
  "@type": "ItemList",
  "@id": `${SITE}/#${id}`,
  "name": name,
  "itemListElement": entries.map(([label, path], i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "item": { "@type": "WebPage", "name": label, "url": `${SITE}${path}` },
  })),
});

const collectionPage = (name: string, path: string) => ({
  "@type": "CollectionPage",
  "name": name,
  "url": `${SITE}${path}`,
});

// Same string as the home page <title> (title.default in app/page.tsx) — keep the two in step.
const HOME_META_TITLE = "Caravans For Sale – New & Used Caravan Marketplace in Australia";

export const HOME_WEBPAGE_JSONLD = {
  "@type": "WebPage",
  "@id": `${SITE}/#webpage`,
  "url": `${SITE}/`,
  "name": HOME_META_TITLE,
  "isPartOf": { "@id": `${SITE}/#website` },
  "about": { "@id": `${SITE}/#organization` },
  "description":
    "Find your ideal caravan from thousands of new and used listings across Australia's top brands, dealers, and private sellers.",
  "hasPart": [
    collectionPage("Caravan Listings By Type", "/listings/"),
    collectionPage("New Caravans For Sale", "/listings/new-condition/"),
    collectionPage("Used Caravans For Sale", "/listings/used-condition/"),
  ],
  "mainEntity": [
    itemList("navigation", "Main Navigation Menu", [
      ["Sell My Caravan", "/sell-my-caravan/"],
      ["Dealer Advertising", "/dealer-advertising/"],
      ["Blog", "/blog/"],
      ["About Us", "/about-us/"],
      ["Contact Us", "/contact/"],
    ]),
    itemList("categories", "Browse Caravans By Category", [
      ["Off Road Caravans", "/listings/off-road-category/"],
      ["Hybrid Caravans", "/listings/hybrid-category/"],
      ["Pop Top Caravans", "/listings/pop-top-category/"],
      ["Luxury Caravans", "/listings/luxury-category/"],
      ["Family Caravans", "/listings/family-category/"],
      ["Touring Caravans", "/listings/touring-category/"],
    ]),
    itemList("states", "Caravans For Sale By State", [
      ["Victoria", "/listings/victoria-state/"],
      ["New South Wales", "/listings/new-south-wales-state/"],
      ["Queensland", "/listings/queensland-state/"],
      ["Western Australia", "/listings/western-australia-state/"],
      ["South Australia", "/listings/south-australia-state/"],
      ["Tasmania", "/listings/tasmania-state/"],
    ]),
    itemList("popular-brands", "Popular Caravan Brands", [
      ["Jayco", "/listings/jayco/"],
      ["Snowy River", "/listings/snowy-river/"],
      ["New Age", "/listings/new-age/"],
      ["Evernew", "/listings/evernew/"],
      ["Crusader", "/listings/crusader/"],
    ]),
  ],
};
