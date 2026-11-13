// Home page FAQ (src: "Frequently Asked Questions - CFS.docx"). Answers are trusted static HTML
// authored here (internal links are site-relative), rendered by HomeFaq.tsx.
export type FaqItem = { q: string; a: string };
export type FaqCategory = { id: string; label: string; items: FaqItem[] };

export const HOME_FAQS: FaqCategory[] = [
  {
    "id": "new-used-and-prices",
    "label": "New, Used & Prices",
    "items": [
      {
        "q": "Where can I buy new caravans in Australia?",
        "a": "Browse <a href=\"/listings/new-condition/\" class=\"hfaq-link\">new caravans for sale</a> on CaravansForSale.com.au. Compare available models from Australian dealerships by make, price, layout, type and location."
      },
      {
        "q": "Where can I buy used caravans in Australia?",
        "a": "Browse <a href=\"/listings/used-condition/\" class=\"hfaq-link\">used caravans for sale</a> from dealerships and private sellers across Australia. Compare second-hand models by price, age, condition, features and location."
      },
      {
        "q": "How much does a new caravan cost in Australia?",
        "a": "New caravan prices vary considerably by size, brand and features. Many full-sized models cost $100,000 or more, while premium and luxury caravans can exceed $150,000."
      },
      {
        "q": "How much does a used caravan cost?",
        "a": "Used caravan prices vary from under $30,000 for some older models to over $100,000 for newer premium caravans. Age, condition, brand, layout and accessories influence asking prices."
      },
      {
        "q": "Where can I find caravans under $30,000?",
        "a": "Browse <a href=\"/listings/under-30000/\" class=\"hfaq-link\">caravans for sale under $30,000</a> on CaravansForSale.com.au. Compare affordable used caravans, pop-tops and other available models within your budget."
      },
      {
        "q": "Where can I find caravans under $50,000?",
        "a": "Explore <a href=\"/listings/under-50000/\" class=\"hfaq-link\">caravans for sale under $50,000</a> and compare available models by age, type, condition, sleeping capacity and location."
      },
      {
        "q": "What affects the price of a caravan?",
        "a": "Caravan prices depend on brand, age, condition, size, construction and features. Off-road capability, solar systems, lithium batteries, ensuites and premium layouts can also influence asking prices."
      }
    ]
  },
  {
    "id": "caravan-brands",
    "label": "Caravan Brands",
    "items": [
      {
        "q": "What are the most popular caravan brands in Australia?",
        "a": "Well-known caravan brands include Jayco, Lotus, JB, Crusader, MDC, New Age, Avan, Coromal and Supreme. Compare available models, prices and specifications to find a suitable caravan."
      },
      {
        "q": "Where can I find Jayco caravans for sale?",
        "a": "Browse <a href=\"/listings/jayco/\" class=\"hfaq-link\">Jayco caravans for sale</a> on CaravansForSale.com.au. Compare available new and used Jayco models, including touring, family, pop-top and off-road configurations."
      },
      {
        "q": "Where can I find Lotus caravans for sale?",
        "a": "Explore <a href=\"/listings/lotus/\" class=\"hfaq-link\">Lotus caravans for sale</a> and compare available models, including luxury, touring and off-road caravans from dealers and private sellers."
      },
      {
        "q": "Where can I find JB Caravans for sale?",
        "a": "Browse <a href=\"/listings/jb/\" class=\"hfaq-link\">JB Caravans for sale</a> across Australia. Compare available touring, family and off-road models by price, condition and specifications."
      },
      {
        "q": "Where can I find MDC caravans for sale?",
        "a": "Find <a href=\"/listings/mdc/\" class=\"hfaq-link\">MDC caravans for sale</a> on CaravansForSale.com.au. Compare hybrid, touring and off-road models with different layouts, lengths and features."
      },
      {
        "q": "Where can I find Crusader caravans for sale?",
        "a": "Browse <a href=\"/listings/crusader/\" class=\"hfaq-link\">Crusader caravans for sale</a> and compare available touring, luxury, family and off-road models from Australian dealers and private sellers."
      }
    ]
  },
  {
    "id": "caravan-types",
    "label": "Caravan Types",
    "items": [
      {
        "q": "What are the best off-road caravans for sale?",
        "a": "The best off-road caravan depends on your destinations, budget and towing vehicle. Compare suspension, chassis construction, ground clearance and ATM. Explore our <a href=\"/off-road-caravans/\" class=\"hfaq-link\">Off Road Caravan Guide</a> for models, prices and comparisons."
      },
      {
        "q": "Where can I find hybrid caravans for sale?",
        "a": "Browse <a href=\"/listings/hybrid-category/\" class=\"hfaq-link\">hybrid caravans for sale</a> on CaravansForSale.com.au. Compare compact models combining caravan-style accommodation with practical features for touring and off-road adventures."
      },
      {
        "q": "Where can I find pop-top caravans for sale?",
        "a": "Explore <a href=\"/listings/pop-top-category/\" class=\"hfaq-link\">pop-top caravans for sale</a>. Their lower travelling height can make storage easier, while the raised roof provides additional headroom when camping."
      },
      {
        "q": "Where can I find family caravans for sale?",
        "a": "Browse <a href=\"/listings/family-category/\" class=\"hfaq-link\">family caravans for sale</a> featuring bunk beds, multiple sleeping areas and practical layouts for family holidays and extended touring."
      },
      {
        "q": "What are the best touring caravans?",
        "a": "The best touring caravan offers comfortable living space, suitable towing weight and practical features for road travel. Compare <a href=\"/listings/touring-category/\" class=\"hfaq-link\">touring caravans for sale</a> by size, layout and budget."
      },
      {
        "q": "What are the best luxury caravans in Australia?",
        "a": "Luxury caravans often include premium interiors, spacious ensuites, larger kitchens and advanced electrical systems. Browse <a href=\"/listings/luxury-category/\" class=\"hfaq-link\">luxury caravans for sale</a> to compare available models and features."
      },
      {
        "q": "What are the best small and lightweight caravans?",
        "a": "Compact caravans and some pop-top models can suit couples and buyers with lower towing limits. Browse <a href=\"/listings/under-1500-kg-atm/\" class=\"hfaq-link\">caravans under 1,500kg ATM</a> to compare lightweight options."
      },
      {
        "q": "What is the difference between hybrid and traditional caravans?",
        "a": "Hybrid caravans often feature compact bodies, expandable roofs or outdoor kitchens, while traditional caravans generally offer more permanent indoor living space. Both are available in touring and off-road configurations."
      }
    ]
  },
  {
    "id": "size-weight-and-towing",
    "label": "Size, Weight & Towing",
    "items": [
      {
        "q": "What size caravan is best for couples?",
        "a": "Couples often choose compact 2-berth caravans with comfortable sleeping arrangements and practical storage. Browse <a href=\"/listings/2-people-sleeping-capacity/\" class=\"hfaq-link\">2-berth caravans for sale</a> and compare size, layout and towing requirements."
      },
      {
        "q": "What size caravan is suitable for families?",
        "a": "Families often prefer caravans with four or more sleeping spaces, bunk beds and adequate storage. Consider your family size, towing capacity and preferred layout before buying."
      },
      {
        "q": "Where can I find 16ft and 18ft caravans for sale?",
        "a": "Browse caravans in the <a href=\"/listings/between-16-18-length-in-feet/\" class=\"hfaq-link\">16ft–18ft</a> and <a href=\"/listings/between-18-20-length-in-feet/\" class=\"hfaq-link\">18ft–20ft</a> ranges. Compare available layouts, weights and sleeping capacities to find a suitable model."
      },
      {
        "q": "What is the difference between tare weight and ATM?",
        "a": "Tare weight is the caravan's weight in its specified unloaded condition. ATM (Aggregate Trailer Mass) is its maximum permitted loaded weight, including luggage, water, equipment and towball load."
      },
      {
        "q": "How many people can sleep in a caravan?",
        "a": "Caravans commonly accommodate two to six or more people, depending on their layout. Use the sleeping-capacity filters on CaravansForSale.com.au to find suitable models."
      },
      {
        "q": "How do I choose a caravan based on my towing capacity?",
        "a": "Check your vehicle's maximum braked towing capacity, towball download, GVM and GCM limits. Ensure the caravan's actual loaded weight, ATM rating and coupling load are compatible with your vehicle and equipment."
      },
      {
        "q": "What is the difference between single-axle and tandem-axle caravans?",
        "a": "Single-axle caravans are often smaller and lighter, while tandem-axle models typically support larger, heavier caravans. Compare weight ratings, towing requirements, manoeuvrability and maintenance costs."
      }
    ]
  },
  {
    "id": "features-and-ownership",
    "label": "Features & Ownership",
    "items": [
      {
        "q": "What features should I look for in a caravan?",
        "a": "Consider comfortable beds, kitchen facilities, storage, an ensuite, air conditioning and suitable water capacity. Solar panels, lithium batteries and off-grid features may also suit extended touring."
      },
      {
        "q": "What are the benefits of off-grid caravans?",
        "a": "Off-grid caravans can support travel away from powered caravan parks using solar power, batteries and onboard water storage. Actual independence depends on the system's capacity and usage."
      },
      {
        "q": "Are solar panels and lithium batteries worth having in a caravan?",
        "a": "Solar panels help recharge caravan batteries, while lithium batteries can offer useful energy storage with less weight than comparable lead-acid systems. Suitability depends on your power needs and budget."
      },
      {
        "q": "What should I inspect before buying a used caravan?",
        "a": "Check for water ingress, damaged seals, soft flooring, corrosion, tyre wear and chassis damage. Inspect appliances, plumbing, brakes and electrical systems, and consider an independent caravan inspection."
      },
      {
        "q": "How often should a caravan be serviced?",
        "a": "Follow the manufacturer's recommended service schedule. Regular servicing should include brakes, bearings, tyres, suspension, seals and safety systems, especially before extended trips."
      },
      {
        "q": "What insurance do I need for a caravan?",
        "a": "Consider comprehensive caravan insurance covering accidental damage, theft and other insured events. Compare policies for contents, accessories, storage, towing and agreed or market value."
      },
      {
        "q": "What are the ongoing costs of owning a caravan?",
        "a": "Ongoing expenses may include registration, insurance, servicing, tyres, storage, repairs and depreciation. Caravan park fees, gas, batteries and towing fuel costs should also be considered."
      }
    ]
  },
  {
    "id": "caravans-for-sale-by-location",
    "label": "Caravans for Sale by Location",
    "items": [
      {
        "q": "Where can I find caravans for sale in Melbourne?",
        "a": "Browse <a href=\"/listings/victoria-state/melbourne-region/\" class=\"hfaq-link\">caravans for sale in Melbourne</a> on CaravansForSale.com.au. Compare new and used caravans from dealerships and private sellers across Melbourne and surrounding areas."
      },
      {
        "q": "Where can I find caravans for sale in Sydney?",
        "a": "Explore <a href=\"/listings/new-south-wales-state/sydney-region/\" class=\"hfaq-link\">caravans for sale in Sydney</a> and compare available models by price, make, type, condition and specifications."
      },
      {
        "q": "Where can I find caravans for sale in Brisbane?",
        "a": "Browse <a href=\"/listings/queensland-state/brisbane-region/\" class=\"hfaq-link\">caravans for sale in Brisbane</a> and compare new and used models advertised by dealers and private sellers."
      },
      {
        "q": "Where can I find caravans for sale in Adelaide?",
        "a": "Find <a href=\"/listings/south-australia-state/adelaide-region/\" class=\"hfaq-link\">caravans for sale in Adelaide</a> on CaravansForSale.com.au, including available touring, family, off-road and luxury caravans."
      },
      {
        "q": "Where can I find caravans for sale in Perth?",
        "a": "Browse <a href=\"/listings/western-australia-state/perth-region/\" class=\"hfaq-link\">caravans for sale in Perth</a> to compare available models, prices, layouts and features."
      },
      {
        "q": "How can I find caravans for sale near me?",
        "a": "Use the location filters on CaravansForSale.com.au to browse caravans by state, city or region. Narrow your search by price, type, condition and other specifications."
      }
    ]
  },
  {
    "id": "selling-a-caravan",
    "label": "Selling a Caravan",
    "items": [
      {
        "q": "Where can I advertise my caravan for sale?",
        "a": "Advertise your caravan on <a href=\"/sell-my-caravan/\" class=\"hfaq-link\">CaravansForSale.com.au</a> for a one-time fee of $49 including GST. Your listing stays online until sold, with no sales commission."
      },
      {
        "q": "How do I sell my caravan online in Australia?",
        "a": "Create a listing on CaravansForSale.com.au, enter your caravan's details, set an asking price and upload photographs. Interested buyers can contact you directly to arrange inspections and negotiate."
      },
      {
        "q": "How much does it cost to advertise a caravan for sale?",
        "a": "Private sellers pay $49 including GST for a listing on CaravansForSale.com.au. The one-time fee keeps your advertisement live until sold, with no monthly subscription or commission."
      },
      {
        "q": "Can private owners list caravans for sale?",
        "a": "Yes. Private owners can advertise new or used caravans directly on CaravansForSale.com.au and receive enquiries from interested buyers across Australia."
      },
      {
        "q": "Can caravan dealers advertise their stock?",
        "a": "Yes. Australian caravan dealerships can advertise their stock through CaravansForSale.com.au. Dealer subscriptions support multiple listings, with automated stock updates available for participating dealers."
      },
      {
        "q": "How do I attract more buyers to my caravan listing?",
        "a": "Set a competitive price and include clear photos, accurate specifications and a detailed description. Highlight the caravan's condition, make, model, year, ATM, sleeping capacity, service history and accessories."
      },
      {
        "q": "How do I determine the selling price of my caravan?",
        "a": "Compare similar caravans by make, model, year, condition, size and features. Review current asking prices on CaravansForSale.com.au and allow for differences in equipment and maintenance history."
      }
    ]
  },
  {
    "id": "general-and-buying",
    "label": "General & Buying",
    "items": [
      {
        "q": "Where can I find caravans for sale in Australia?",
        "a": "Browse <a href=\"/listings/\" class=\"hfaq-link\">new and used caravans for sale</a> on CaravansForSale.com.au. Compare available caravans from dealerships and private sellers across Australia by price, make, type, location and specifications."
      },
      {
        "q": "What types of caravans are available in Australia?",
        "a": "Popular caravan types include off-road, hybrid, pop-top, touring, family and luxury caravans. Each offers different layouts, sizes, features and towing requirements to suit various travel styles."
      },
      {
        "q": "How do I choose the right caravan?",
        "a": "Consider your budget, number of travellers, towing vehicle and preferred destinations. Compare caravan types, sleeping capacity, length, ATM and features to find one that suits your lifestyle."
      },
      {
        "q": "What should I look for when buying a caravan?",
        "a": "Check the caravan's layout, construction, towing weight, payload and overall condition. For used caravans, inspect for water damage, review maintenance records and check registration and ownership details."
      },
      {
        "q": "Should I buy a new or used caravan?",
        "a": "New caravans offer current designs and applicable manufacturer warranties, while used caravans generally cost less. Compare available models, condition, features and prices before deciding."
      },
      {
        "q": "Are caravans available from private sellers and dealers?",
        "a": "Yes. CaravansForSale.com.au features new and used caravans advertised by dealerships and private sellers, allowing buyers to compare options and contact advertisers directly."
      },
      {
        "q": "How can I compare different caravans?",
        "a": "Compare caravans by make, model, year, price, type, length, ATM, sleeping capacity and features. Use the search filters on CaravansForSale.com.au to narrow your options."
      },
      {
        "q": "What documents should I check before buying a caravan?",
        "a": "Check registration details, the VIN or chassis number, service history, ownership information and any available warranty documents. Conduct a PPSR search before purchasing a used caravan."
      },
      {
        "q": "What is the difference between a caravan and a camper trailer?",
        "a": "Caravans generally provide more permanent living facilities, while camper trailers are often smaller with folding or expandable accommodation. Compare caravan listings with <a href=\"https://www.campingtrailersforsale.com.au/\" class=\"hfaq-link\" target=\"_blank\" rel=\"noopener noreferrer\">camper trailers for sale</a> to explore both options."
      }
    ]
  }
];
