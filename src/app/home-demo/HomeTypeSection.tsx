import Image from "next/image";
import { type TypeCounts } from "@/api/homeApi/typeCounts/api";
import { linkHasListings, type ListingLinkCounts } from "@/app/listings/browseSectionShared";

const TYPES = [
  {
    slug: "off-road-category",
    category: "off-road",
    label: "Off Road Caravans for Sale",
    image: "/images/off-road.webp",
    desc: "Built tough for Australia's rougher tracks.",
  },
  {
    slug: "luxury-category",
    category: "luxury",
    label: "Luxury Caravans for Sale",
    image: "/images/luxury.webp",
    desc: "Premium comfort, high-end interiors and full-size features.",
  },
  {
    slug: "hybrid-category",
    category: "hybrid",
    label: "Hybrid Caravans for Sale",
    image: "/images/hybrid.webp",
    desc: "The balance of easy towing, compact size and outdoor living.",
  },
  {
    slug: "pop-top-category",
    category: "pop-top",
    label: "Pop Top Caravans for Sale",
    image: "/images/pop-top.webp",
    desc: "Easy to store, simple to tow and practical for getaways.",
  },
  {
    slug: "touring-category",
    category: "touring",
    label: "Touring Caravans for Sale",
    image: "/images/touring.webp",
    desc: "Comfortable, reliable and ideal for long-distance trips.",
  },
  {
    slug: "family-category",
    category: "family",
    label: "Family Caravans for Sale",
    image: "/images/family.webp",
    desc: "Spacious layouts designed for the whole family.",
  },
] as const;

interface Props {
  typeCounts?: TypeCounts;
  linkCounts?: ListingLinkCounts | null;
}

export default function HomeTypeSection({ typeCounts, linkCounts }: Props) {
  // Types with no listings are left out until the live counts show stock.
  const types = TYPES.filter((t) => linkHasListings(`/listings/${t.slug}/`, linkCounts));

  return (
    <section className="htype-section">
      <div className="container">
        <div className="htype-header">
          <h2 className="htype-title">Browse Caravans for Sale by Type</h2>
        </div>

        <div className="htype-grid">
          {types.map((t) => (
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
                {(typeCounts?.[t.category] ?? 0).toLocaleString()} listings{" "}
                <i className="bi bi-chevron-right" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
