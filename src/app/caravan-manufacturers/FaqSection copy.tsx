"use client";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Link from "next/link";

const FaqSection = () => {
  return (
    <section className="faq section-padding style-4 bg_custom_d">
      <div className="container">
        <div className="section-head text-center style-4">
          <h2 className="mb-30">Frequently asked questions (FAQs)</h2>
        </div>
        <div className="content">
          <div className="accordion" id="accordionSt4">
            <div className="faq style-3 style-4">
              <div className="row">
                <div className="col-lg-12">
                  {/* 1. Everest Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading1">
                      <button
                        className="accordion-button rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse1"
                        aria-expanded="true"
                        aria-controls="collapse1"
                      >
                        1. Everest Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse1"
                      className="accordion-collapse collapse show rounded-0"
                      aria-labelledby="heading1"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>
                          What types of caravans does Everest Caravans
                          specialize in?
                        </h4>
                        <p>
                          Everest Caravans specializes in custom-built extreme
                          off-road caravans, including models like{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/falcon/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Falcon
                          </Link>
                          ,{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/nitro-extreme/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Nitro Extreme
                          </Link>
                          ,{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/calibra/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Calibra
                          </Link>
                          ,{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/summitt/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Summitt
                          </Link>
                          , and{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/alpine/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Alpine
                          </Link>{" "}
                          series.
                        </p>
                        <h4>
                          Can I customize my caravan with Everest Caravans?
                        </h4>
                        <p>
                          Yes, Everest Caravans offers custom-built options to
                          tailor the caravan to your specific needs and
                          preferences.
                        </p>
                        <h4>Are their caravans family-friendly?</h4>
                        <p>
                          Yes, the Calibra and Summit models are particularly
                          designed to accommodate families, offering spacious
                          layouts and essential amenities.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 2. Orbit Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading2">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse2"
                        aria-expanded="false"
                        aria-controls="collapse2"
                      >
                        2. Orbit Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse2"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading2"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>
                          What range of caravans does Orbit Caravans offer?
                        </h4>
                        <p>
                          Orbit Caravans offers luxury off-road caravans such as
                          the{" "}
                          <Link
                            href="https://orbitcaravans.com.au/range/discovery-x/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Discovery X
                          </Link>
                          ,{" "}
                          <Link
                            href="https://orbitcaravans.com.au/range/eclipse/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Eclipse X
                          </Link>
                          , and{" "}
                          <Link
                            href="https://orbitcaravans.com.au/range/space/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Space V
                          </Link>
                          , focusing on a blend of durability and luxury.
                        </p>
                        <h4>Are Orbit Caravans suitable for couples?</h4>
                        <p>
                          Yes, models like the Eclipse X and Space V are perfect
                          for couples seeking a luxurious and feature-rich
                          off-road experience.
                        </p>
                        <h4>Do they offer extendable floor plans?</h4>
                        <p>
                          Yes, the Discovery X model features an extendable
                          floor plan, making it a practical and spacious option
                          for travelers.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 3. Grand City Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading3">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse3"
                        aria-expanded="false"
                        aria-controls="collapse3"
                      >
                        3. Grand City Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse3"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading3"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>What technology is used in Grand City Caravans?</h4>
                        <p>
                          Grand City Caravans utilizes state-of-the-art 3D
                          modeling software for precise and high-quality builds.
                        </p>
                        <h4>Are Grand City Caravans customizable?</h4>
                        <p>
                          Yes, models like the{" "}
                          <Link
                            href="https://grandcitycaravans.com.au/range/nomad/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Nomad
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="https://grandcitycaravans.com.au/range/explorer/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Explorer
                          </Link>{" "}
                          offer customizable options to suit individual
                          preferences and travel needs.
                        </p>
                        <h4>What types of caravans do they offer?</h4>
                        <p>
                          Grand City Caravans offers full off-road caravans like
                          Nomad and Explorer, semi off-road models like{" "}
                          <Link
                            href="https://grandcitycaravans.com.au/range/royale/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Royale
                          </Link>
                          , and touring options like the{" "}
                          <Link
                            href="https://grandcitycaravans.com.au/range/escape/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Escape
                          </Link>{" "}
                          series.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 4. High Country Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading4">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse4"
                        aria-expanded="false"
                        aria-controls="collapse4"
                      >
                        4. High Country Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse4"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading4"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>What makes High Country Caravans stand out?</h4>
                        <p>
                          High Country Caravans are designed to tackle the
                          harshest Australian off-road conditions, combining
                          comfort with durability.
                        </p>
                        <h4>
                          What models are available from High Country Caravans?
                        </h4>
                        <p>
                          They offer models such as the Alpine, Explore,
                          Extreme, and Summit, all built for off-road
                          adventures.
                        </p>
                        <h4>Are their caravans family-friendly?</h4>
                        <p>
                          Yes, their models cater to families looking for
                          off-road adventures with ample space and modern
                          amenities.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 5. Silver Valley Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading5">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse5"
                        aria-expanded="false"
                        aria-controls="collapse5"
                      >
                        5. Silver Valley Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse5"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading5"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>
                          What types of caravans does Silver Valley Caravans
                          offer?
                        </h4>
                        <p>
                          Silver Valley Caravans offers luxury touring caravans
                          such as the{" "}
                          <Link
                            href="https://www.silvervalleycaravans.com.au/range/the-family-getaway.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Family Getaway
                          </Link>
                          ,{" "}
                          <Link
                            href="https://www.silvervalleycaravans.com.au/range/yarra.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Yarra
                          </Link>
                          ,{" "}
                          <Link
                            href="https://www.silvervalleycaravans.com.au/range/orana.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Orana
                          </Link>
                          ,{" "}
                          <Link
                            href="https://www.silvervalleycaravans.com.au/range/indigo.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Indigo
                          </Link>
                          , and{" "}
                          <Link
                            href="https://www.silvervalleycaravans.com.au/range/hepburn.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Hepburn
                          </Link>
                          .
                        </p>
                        <h4>Are their caravans customizable?</h4>
                        <p>
                          Yes, their models come with customizable options for
                          both interiors and exteriors to meet individual
                          preferences.
                        </p>
                        <h4>What makes their caravans luxurious?</h4>
                        <p>
                          Silver Valley Caravans incorporate high-quality
                          materials, modern appliances, and smart storage
                          solutions to provide a luxurious travel experience.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 6. Red Centre Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading6">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse6"
                        aria-expanded="false"
                        aria-controls="collapse6"
                      >
                        6. Red Centre Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse6"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading6"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>
                          What distinguishes Red Centre Caravans from others?
                        </h4>
                        <p>
                          Red Centre Caravans are known for their sturdy
                          aluminium frame construction, combining lightness with
                          strength for both on-road and off-road adventures.
                        </p>
                        <h4>What types of caravans do they offer?</h4>
                        <p>
                          They offer a variety of models including on-road,
                          off-road, and semi off-road caravans like the{" "}
                          <Link
                            href="https://redcentrecaravans.com.au/newell/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Newell
                          </Link>
                          ,{" "}
                          <Link
                            href="https://redcentrecaravans.com.au/kimberley/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Kimberley
                          </Link>
                          ,{" "}
                          <Link
                            href="https://redcentrecaravans.com.au/tanami/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Tanami Extreme
                          </Link>
                          , and{" "}
                          <Link
                            href="https://redcentrecaravans.com.au/gibb-off-road-plus/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Gibb Off-Road Plus
                          </Link>
                          .
                        </p>
                        <h4>Are their caravans energy-efficient?</h4>
                        <p>
                          Yes, many of their models feature advanced
                          energy-efficient designs and systems, such as the
                          Victron micro touch battery management system.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 7. Masterpiece Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading7">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse7"
                        aria-expanded="false"
                        aria-controls="collapse7"
                      >
                        7. Masterpiece Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse7"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading7"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>
                          What range of caravans does Masterpiece Caravans
                          provide?
                        </h4>
                        <p>
                          Masterpiece Caravans offers the ultimate in off-road
                          caravans with models like Optimum, Performance and
                          XTM.
                        </p>
                        <h4>
                          Are their caravans designed for extreme conditions?
                        </h4>
                        <p>
                          Yes, their caravans are engineered for excellence in
                          the most rugged terrains, providing robust
                          construction and luxurious interiors.
                        </p>
                        <h4>Do they offer compact yet luxurious models?</h4>
                        <p>
                          Yes, the XTM series are compact, luxurious, and
                          designed to handle extreme off-road conditions while
                          providing comfort.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 8. Villa Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading8">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse8"
                        aria-expanded="false"
                        aria-controls="collapse8"
                      >
                        8. Villa Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse8"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading8"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>
                          What type of caravans does Villa Caravans specialize
                          in?
                        </h4>
                        <p>
                          Villa Caravans specializes in semi off-road caravans
                          like the Escape SE and Escape, designed for exploring
                          remote areas with semi off-road capabilities.
                        </p>
                        <h4>Are Villa Caravans suitable for rough terrains?</h4>
                        <p>
                          Yes, their semi off-road caravans are built to
                          withstand dirt roads and remote areas while providing
                          comfort and luxury.
                        </p>
                        <h4>Do they offer family-friendly options?</h4>
                        <p>
                          Yes, their caravans are designed to cater to families,
                          offering spacious and feature-rich models.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 9. Willow RV */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading9">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse9"
                        aria-expanded="false"
                        aria-controls="collapse9"
                      >
                        9. Willow RV
                      </button>
                    </h3>
                    <div
                      id="collapse9"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading9"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <p>
                          <strong>
                            What types of caravans does Willow RV offer?
                          </strong>
                        </p>
                        <p>
                          Willow RV offers a range of Australian-made caravans
                          including the{" "}
                          <Link
                            href="https://willowrv.com.au/illawarra-series-caravans/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Illawarra
                          </Link>
                          ,{" "}
                          <Link
                            href="https://willowrv.com.au/waratah-series-caravans/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Waratah
                          </Link>
                          ,{" "}
                          <Link
                            href="https://willowrv.com.au/ironbark-series-caravans/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ironbark
                          </Link>
                          , and{" "}
                          <Link
                            href="https://willowrv.com.au/boab-series-caravans/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Boab series
                          </Link>{" "}
                          — designed for different travel styles from weekend
                          escapes to long-term touring.
                        </p>
                        <p>
                          <strong>
                            Are the interiors of Willow RV caravans comfortable
                            for long trips?
                          </strong>
                        </p>
                        <p>
                          <span style={{ fontWeight: 400 }}>
                            Absolutely. Willow RV caravans feature luxury
                            interiors with open-plan layouts, spacious ensuites,
                            and five-star comfort suitable for both short and
                            extended stays.
                          </span>
                        </p>
                        <p>
                          <strong>
                            What kind of value can I expect from a Willow RV
                            caravan?
                          </strong>
                          <br />
                          <span style={{ fontWeight: 400 }}>
                            Willow RV caravans come with premium features
                            included as standard—delivering exceptional value
                            without hidden costs or extra upgrades.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 10. Apache Caravans */}
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading10">
                      <button
                        className="accordion-button collapsed rounded-0 py-4"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse10"
                        aria-expanded="false"
                        aria-controls="collapse10"
                      >
                        10. Apache Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse10"
                      className="accordion-collapse collapse rounded-0"
                      aria-labelledby="heading10"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <p>
                          <strong>
                            What makes Apache Caravans stand out in the
                            Australian market?
                          </strong>
                          <br />
                          <span style={{ fontWeight: 400 }}>
                            Apache Caravans are known for their innovative
                            layouts, eco-friendly features, and space-efficient
                            interiors. Their designs prioritise comfort,
                            practicality, and flexibility for all types of
                            travellers.
                          </span>
                        </p>
                        <p>
                          <strong>Are Apache Caravans budget-friendly?</strong>
                          <br />
                          <span style={{ fontWeight: 400 }}>
                            Yes, Apache keeps costs competitive by streamlining
                            production and using overseas manufacturing, without
                            compromising on quality. They also invest more in
                            build quality than in advertising, relying on word
                            of mouth and customer satisfaction.
                          </span>
                        </p>
                        <p>
                          <strong>
                            Do Apache Caravans cater to off-road conditions?
                          </strong>
                        </p>
                        <p>
                          Yes, models like the{" "}
                          <Link
                            href="https://apachecaravans.com.au/top-gun-13/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            TopGun 13
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="https://apachecaravans.com.au/wildkat14/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            WildKat 14
                          </Link>{" "}
                          are specifically built to handle Australia’s rugged
                          terrain, making them ideal for off-road and
                          adventurous travel.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Repeat this block for Orbit, Grand City, etc. (2–10) */}
                  {/* Just replace ids (heading2/collapse2, heading3/collapse3, etc.) and update content */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
