import Image from "next/image";

const TYPES = [
  {
    slug: "off-road-category",
    label: "Off Road Caravans for Sale",
    image: "/images/off-road.webp",
    desc: "Built tough for Australia's rougher tracks.",
    count: "1,245",
  },
  {
    slug: "luxury-category",
    label: "Luxury Caravans for Sale",
    image: "/images/luxury.webp",
    desc: "Premium comfort, high-end interiors and full-size features.",
    count: "982",
  },
  {
    slug: "hybrid-category",
    label: "Hybrid Caravans for Sale",
    image: "/images/hybrid.webp",
    desc: "The balance of easy towing, compact size and outdoor living.",
    count: "673",
  },
  {
    slug: "pop-top-category",
    label: "Pop Top Caravans for Sale",
    image: "/images/pop-top.webp",
    desc: "Easy to store, simple to tow and practical for getaways.",
    count: "1,112",
  },
  {
    slug: "touring-category",
    label: "Touring Caravans for Sale",
    image: "/images/touring.webp",
    desc: "Comfortable, reliable and ideal for long-distance trips.",
    count: "1,984",
  },
  {
    slug: "family-category",
    label: "Family Caravans for Sale",
    image: "/images/family.webp",
    desc: "Spacious layouts designed for the whole family.",
    count: "856",
  },
];

export default function HomeTypeSection() {
  return (
    <section className="htype-section">
      <div className="container">
        <div className="htype-header">
          <h2 className="htype-title">Browse Caravan Listings by Type</h2>
        </div>

        <div className="htype-grid">
          {TYPES.map((t) => (
            <a key={t.slug} href={`/listings/${t.slug}/`} className="htype-card">
              <div className="htype-card__img-wrap">
                <Image
                  src={t.image}
                  alt={t.label}
                  width={160}
                  height={110}
                  className="htype-card__img"
                />
              </div>
              <h3 className="htype-card__name">
                {t.label.replace(" for Sale", "")}<br />for Sale
              </h3>
              <p className="htype-card__desc">{t.desc}</p>
              <span className="htype-card__count">
                {t.count} listings <span aria-hidden>→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
