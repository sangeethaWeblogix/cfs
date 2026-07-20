"use client";

import Link from "next/link";
import Image from "next/image";

export default function DealersAndManufacturers() {
  const dealers = [
    {
      href: "https://admin.caravansforsale.com.au/caravan-dealer/everest-caravans-vic",
      img: "https://admin.caravansforsale.com.au/wp-content/uploads/2024/07/Everest-Caravans.png",
      alt: "Everest Caravans - VIC",
      label: "Everest Caravans - VIC",
      listings: "https://admin.caravansforsale.com.au/dealers/everest-caravans-vic",
    },
    {
      href: "https://admin.caravansforsale.com.au/caravan-dealer/everest-caravans-nsw",
      img: "https://admin.caravansforsale.com.au/wp-content/uploads/2024/10/Everest-Caravans.png",
      alt: "Everest Caravans - NSW",
      label: "Everest Caravans - NSW",
      listings: "https://admin.caravansforsale.com.au/dealers/everest-caravans-nsw",
    },
    {
      href: "https://admin.caravansforsale.com.au/caravan-dealer/everest-caravans-qld",
      img: "https://admin.caravansforsale.com.au/wp-content/uploads/2024/10/Everest-Caravans.png",
      alt: "Everest Caravans - QLD",
      label: "Everest Caravans - QLD",
      listings: "https://admin.caravansforsale.com.au/dealers/everest-caravans-qld",
    },
  ];

  const manufacturers = [
    {
      href: "https://admin.caravansforsale.com.au/caravan-manufacturers/grand-caravans",
      img: "https://admin.caravansforsale.com.au/wp-content/uploads/2025/01/Grand-City-Caravans.png",
      alt: "Grand Caravans",
      label: "Grand Caravans",
    },
    {
      href: "https://admin.caravansforsale.com.au/caravan-manufacturers/coronet-rv",
      img: "https://admin.caravansforsale.com.au/wp-content/uploads/2025/01/Coronet-RV.png",
      alt: "Coronet RV",
      label: "Coronet RV",
    },
    {
      href: "https://admin.caravansforsale.com.au/caravan-manufacturers/orbit-caravans",
      img: "https://admin.caravansforsale.com.au/wp-content/uploads/2025/01/Orbit-Caravans.png",
      alt: "Orbit Caravans",
      label: "Orbit Caravans",
    },
    {
      href: "https://admin.caravansforsale.com.au/caravan-manufacturers/red-centre-caravans",
      img: "https://admin.caravansforsale.com.au/wp-content/uploads/2025/01/Red-Centre-Caravans.png",
      alt: "Red Centre Caravans",
      label: "Red Centre Caravans",
    },
  ];

  return (
    <>
      {/* Dealers Section */}
      <section
        className="related-products dealers_section"
        style={{ background: "#f1f1f1", paddingBottom: 0 }}
      >
        <div className="container">
          <div className="title">
            <div className="tpof_tab">
              <h2>Everest Caravans Dealers</h2>
            </div>
          </div>
          <div className="row">
            {dealers.map((dealer, i) => (
              <div key={i} className="col-lg-2">
                <div className="other_dlogo">
                  <Link href={dealer.href}>
                    <Image
                      src={dealer.img}
                      alt={dealer.alt}
                      width={200}
                      height={100}
                    />
                    <span>{dealer.label}</span>
                  </Link>
                </div>
                <Link className="quick_lnk" href={dealer.listings}>
                  View Caravans Listings
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manufacturers Section */}
      <section
        className="related-products make-list dealers_section section-padding"
        style={{ background: "#f1f1f1" }}
      >
        <div className="container">
          <div className="title">
            <div className="tpof_tab">
              <h2>Similar Manufacturers</h2>
            </div>
          </div>
          <div className="row">
            {manufacturers.map((mfr, i) => (
              <div key={i} className="col-lg-2">
                <div className="other_dlogo">
                  <Link href={mfr.href}>
                    <Image
                      src={mfr.img}
                      alt={mfr.alt}
                      width={200}
                      height={100}
                    />
                    <span>{mfr.label}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
