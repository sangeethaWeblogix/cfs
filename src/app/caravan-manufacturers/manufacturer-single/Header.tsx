"use client";

import Link from "next/link";

export default function EverestCaravans() {
  return (
    <>
      {/* Breadcrumb Section */}
      <section className="services breadcrumbs_border pt-15 pb-0">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <ul className="breadcrumbs">
                <li className="breadcrumbs-item">
                  <Link
                    className="breadcrumbs-link"
                    href="https://admin.caravansforsale.com.au/"
                  >
                    Home
                  </Link>
                </li>
                <li className="breadcrumbs-item">
                  <Link
                    className="breadcrumbs-link"
                    href="https://admin.caravansforsale.com.au/caravan-manufacturers/all/"
                  >
                    Manufacturers
                  </Link>
                </li>
                <li className="breadcrumbs-item">Everest Caravans</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="services section-padding pt-30 pb-30 style-1">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 mb-20">
              <h1 className="uppercase divide-orange">Everest Caravans</h1>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <div className="section-head mb-60">
                <p>
                  Can’t find a caravan that fits your family? Everest Caravans
                  has the answer. Instead of settling for a standard design,
                  they build a custom caravan to your specs. Bye bye
                  compromises, hello dream caravan.
                </p>
                <p>
                  Everest Caravans build{" "}
                  <Link
                    href="https://www.caravansforsale.com.au/top-family-off-road-caravans-australia/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    top rated family caravans
                  </Link>
                  , so every detail is designed for your family’s lifestyle.
                  They work with you to ensure the design, features and
                  functionality meets your needs.
                </p>
                <h2>Hand Crafted for Every Journey</h2>
                <h3>Built to Last</h3>
                <p>
                  Every van is hand built with premium materials to withstand
                  the Australian climate. Structural strength and advanced
                  engineering means these caravans are both durable and
                  luxurious. With Everest you can travel the country knowing
                  your van will last.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
