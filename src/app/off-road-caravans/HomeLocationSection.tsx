"use client";

import Image from "next/image";

const MAJOR_CITIES = [
  { name: "Adelaide",   href: "/listings/off-road-category/south-australia-state/adelaide-region/",    imgSrc: "/images/Adelaide.png"   },
  { name: "Brisbane",   href: "/listings/off-road-category/queensland-state/brisbane-region/",         imgSrc: "/images/Brisbane.png"   },
  { name: "Gold Coast", href: "/listings/off-road-category/queensland-state/gold-coast-region/",       imgSrc: "/images/Gold-Coast.png" },
  { name: "Melbourne",  href: "/listings/off-road-category/victoria-state/melbourne-region/",          imgSrc: "/images/Melbourne.png"  },
  { name: "Perth",      href: "/listings/off-road-category/western-australia-state/perth-region/",     imgSrc: "/images/Perth.png"      },
  { name: "Sydney",     href: "/listings/off-road-category/new-south-wales-state/sydney-region/",      imgSrc: "/images/Sydney.png"     },
];

const MINOR_CITIES = [
  { name: "Cairns",         href: "/listings/off-road-category/queensland-state/cairns-region/" },
  { name: "Canberra",       href: "/listings/off-road-category/australian-capital-territory-state/australian-capital-territory-region/" },
  { name: "Darwin",         href: "/listings/off-road-category/northern-territory-state/darwin-region/" },
  { name: "Geelong",        href: "/listings/off-road-category/victoria-state/geelong-region/" },
  { name: "Hobart",         href: "/listings/off-road-category/tasmania-state/hobart-region/" },
  { name: "Newcastle",      href: "/listings/off-road-category/new-south-wales-state/newcastle-region/" },
  { name: "Sunshine Coast", href: "/listings/off-road-category/queensland-state/sunshine-coast-region/" },
  { name: "Townsville",     href: "/listings/off-road-category/queensland-state/townsville-region/" },
  { name: "Wollongong",     href: "/listings/off-road-category/new-south-wales-state/illawarra-region/" },
  { name: "Ballarat",       href: "/listings/off-road-category/victoria-state/ballarat-region/" },
];

const FILTERS = [
  {
    icon: <Image src="/images/Budget.png" alt="Budget" width={24} height={24} unoptimized />,
    label: "By Your Budget",
    items: [
      { text: "Under $30,000",       href: "/listings/off-road-category/under-30000/" },
      { text: "$30,000 – $40,000",   href: "/listings/off-road-category/between-30000-40000/" },
      { text: "$40,000 – $50,000",   href: "/listings/off-road-category/between-40000-50000/" },
      { text: "$50,000 – $70,000",   href: "/listings/off-road-category/between-50000-70000/" },
      { text: "$70,000 – $80,000",   href: "/listings/off-road-category/between-70000-80000/" },
      { text: "$80,000 – $100,000",  href: "/listings/off-road-category/between-80000-100000/" },
      { text: "Over $100,000",       href: "/listings/off-road-category/over-100000/" },
    ],
  },
  {
    icon: <Image src="/images/ATM.png" alt="Weight ATM" width={24} height={24} unoptimized />,
    label: "By Weight (ATM)",
    items: [
      { text: "Under 1500kg", href: "/listings/off-road-category/under-1500-kg-atm/" },
      { text: "Under 2000kg", href: "/listings/off-road-category/under-2000-kg-atm/" },
      { text: "Under 2500kg", href: "/listings/off-road-category/under-2500-kg-atm/" },
      { text: "Under 3000kg", href: "/listings/off-road-category/under-3000-kg-atm/" },
      { text: "Over 3000kg",  href: "/listings/off-road-category/over-3000-kg-atm/" },
    ],
  },
  {
    icon: <Image src="/images/Length.png" alt="Length" width={24} height={24} unoptimized />,
    label: "By Size (Length)",
    items: [
      { text: "Under 16ft",     href: "/listings/off-road-category/under-16-length-in-feet/" },
      { text: "16ft – 18ft",    href: "/listings/off-road-category/between-16-18-length-in-feet/" },
      { text: "18ft – 20ft",    href: "/listings/off-road-category/between-18-20-length-in-feet/" },
      { text: "20ft – 22ft",    href: "/listings/off-road-category/between-20-22-length-in-feet/" },
      { text: "Over 22ft",      href: "/listings/off-road-category/over-22-length-in-feet/" },
    ],
  },
  {
    icon: <Image src="/images/Sleeping.png" alt="Sleeping" width={24} height={24} unoptimized />,
    label: "By Sleeping Capacity",
    items: [
      { text: "2 Berth",  href: "/listings/off-road-category/2-people-sleeping-capacity/" },
      { text: "3 Berth",  href: "/listings/off-road-category/3-people-sleeping-capacity/" },
      { text: "4 Berth",  href: "/listings/off-road-category/4-people-sleeping-capacity/" },
      { text: "5 Berth",  href: "/listings/off-road-category/5-people-sleeping-capacity/" },
      { text: "6+ Berth", href: "/listings/off-road-category/over-6-people-sleeping-capacity/" },
    ],
  },
];


export default function HomeLocationSection() {
  return (
    <section className="hloc-section pt-0">
      <div className="container">

        <div className="hloc-header">
          <h2 className="hloc-title">
            Find Off Road Caravans by <span className="hloc-title-accent">Popular Location</span>
          </h2>
          <p className="hloc-subtitle">Browse off road caravans near you by major Australian cities.</p>
          
        </div>

        <div className="hloc-major-grid">
          {MAJOR_CITIES.map((city) => (
            <a key={city.name} href={city.href} className="hloc-city-card">
              <div className="hloc-city-img-wrap">
                <div className="hloc-city-circle" />
                <Image
                  src={city.imgSrc}
                  alt={city.name}
                  width={110}
                  height={80}
                  className="hloc-city-img"
                  unoptimized
                />
              </div>
              <h3 className="hloc-city-name">
                {city.name} <span className="hloc-city-arrow"></span>
              </h3>
            </a>
          ))}
        </div>

        <div className="hloc-minor-wrap">
          {MINOR_CITIES.map((city, idx) => (
            <a
              key={city.name}
              href={city.href}
              className={`hloc-minor-pill${idx === 0 ? " hloc-minor-pill--active" : ""}`}
            >
              <h3>{city.name}</h3>
            </a>
          ))}
        </div>

        <div className="hloc-filters">
          <div className="hloc-header hloc-filter-row pb-2 mb-2">
  <h2 className="hloc-title">
           Search Off Road Caravans <span className="hloc-title-accent">Your Way</span>
          </h2>
   
        </div>
          {FILTERS.map((f) => (
            <div key={f.label} className="hloc-filter-row">
              <div className="hloc-filter-label">
                <span className="hloc-filter-icon-box">{f.icon}</span>
                <span className="hloc-filter-text">{f.label}</span>
              </div>
              <div className="hloc-filter-chips">
                <h3>
                {f.items.map((item,) => (

                  <a key={item.text} href={item.href} className="hloc-chip">
                   {item.text}</a>
                ))}
                </h3>
              </div>
            </div>
          ))}
        </div>
 
        

      </div>
    </section>
  );
}
