"use client";
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Link from "next/link";

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };
  return (
    <section className="faq section-padding style-4  bg_custom_d">
      <div className="container">
        <div className="section-head text-center style-4">
          <h2 className="mb-30">Frequently asked questions (FAQs)</h2>
        </div>
        <div className="content">
          <div className="faq style-3 style-4">
            <div className="accordion" id="accordionSt4">
              <div className="row">
                <div className="col-lg-12">
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading1">
                      <button
                        className={`accordion-button rounded-0 py-4 ${
                          activeIndex === 1 ? "" : "collapsed"
                        }`}
                        onClick={() => toggleAccordion(1)}
                        aria-expanded={activeIndex === 1}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse1"
                        aria-controls="collapse1"
                      >
                        Semi Off Road & Full Off Road Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse1"
                      className={`accordion-collapse collapse ${
                        activeIndex === 1 ? "" : "show"
                      } rounded-0`}
                      aria-labelledby="heading1"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>
                          What off-road features are highlighted in the
                          Discovery X and Space V models by Orbit Caravans?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://orbitcaravans.com.au/range/discovery-x/"
                            target="_blank"
                            rel="noopener"
                          >
                            Discovery X
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="https://orbitcaravans.com.au/range/space/"
                            target="_blank"
                            rel="noopener"
                          >
                            Space V
                          </Link>{" "}
                          models from Orbit Caravans feature extremely tough
                          off-road chassis and suspension systems, ensuring
                          durability and performance in harsh conditions.
                        </p>
                        <h4>
                          How does the Eclipse X caravan excel in handling
                          extreme off-road conditions?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://orbitcaravans.com.au/range/eclipse/"
                            target="_blank"
                            rel="noopener"
                          >
                            Eclipse X
                          </Link>{" "}
                          caravan includes a robust off-road chassis and
                          suspension system, along with solar power, a lithium
                          battery, and water tanks, making it ideal for extreme
                          off-road conditions.
                        </p>
                        <h4>
                          What makes Orbit Caravans’ off-road chassis and
                          suspension system stand out?
                        </h4>
                        <p>
                          Orbit Caravans’ off-road models are known for their
                          exceptionally tough off-road chassis and suspension
                          systems, designed to withstand harsh terrains.
                        </p>
                        <h4>
                          What off-road capabilities does the Tracker 15’6″
                          offer for tackling rugged terrains?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://grandcitycaravans.com.au/range/tracker/"
                            target="_blank"
                            rel="noopener"
                          >
                            Tracker
                          </Link>{" "}
                          15’6″ from Grand City Caravans features a 6-inch
                          chassis and Cruisemaster XT Freestyle Coil Suspension,
                          providing excellent off-road capabilities for rugged
                          terrains.
                        </p>
                        <h4>
                          How does the Nomad 17′ caravan perform in off-road
                          conditions?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://grandcitycaravans.com.au/range/nomad/"
                            target="_blank"
                            rel="noopener"
                          >
                            Nomad
                          </Link>{" "}
                          17′ caravan is designed with off-road features similar
                          to the Tracker, including a robust chassis and
                          suspension system to handle diverse terrains
                          effectively.
                        </p>
                        <h4>
                          What are the off-road advantages of the Explorer 18’6″
                          caravan?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://grandcitycaravans.com.au/range/explorer/"
                            target="_blank"
                            rel="noopener"
                          >
                            Explorer
                          </Link>{" "}
                          18’6″ boasts a 6-inch chassis, TEKO Tuff Ride 3000kg
                          Independent Coil Suspension, and 16-inch all-terrain
                          tyres, offering significant off-road advantages for
                          tackling tough conditions.
                        </p>
                        <p>
                          <b>
                            What makes Titanium Caravans a market leader in
                            off-road caravans?
                          </b>
                        </p>
                        <p>
                          <Link
                            href="https://titaniumcaravans.com.au/"
                            target="_blank"
                            rel="noopener"
                          >
                            Titanium Caravans
                          </Link>{" "}
                          combine heavy-duty hot-dipped galvanised chassis,
                          advanced airbag suspension systems, and smart off-grid
                          features like solar power and lithium batteries—making
                          them a top choice for rugged Australian terrain.
                        </p>
                        <p>
                          <b>
                            Are Titanium Caravans suitable for off-grid living?
                          </b>
                        </p>
                        <p>
                          Yes, the{" "}
                          <Link
                            href="https://titaniumcaravans.com.au/models/hs1"
                            target="_blank"
                            rel="noopener"
                          >
                            HS1 Series
                          </Link>{" "}
                          offers 400W solar power, lithium batteries, diesel
                          heating, and smart energy management—ideal for remote
                          off-grid adventures.
                        </p>
                        <p>
                          <b>
                            How does the Ti22 S1 by Titanium Caravans deliver
                            comfort during off-grid adventures?
                          </b>
                        </p>
                        <p>
                          The{" "}
                          <Link
                            href="https://titaniumcaravans.com.au/models/ti22-s1/"
                            target="_blank"
                            rel="noopener"
                          >
                            Ti22 S1
                          </Link>
                          , from Titanium Caravans, features 400W solar, lithium
                          batteries, a full kitchen, soft-close cabinetry, and
                          even a washing machine—making it a reliable and
                          comfortable off-grid home on wheels.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading2">
                      <button
                        className={`accordion-button rounded-0 py-4 ${
                          activeIndex === 2 ? "" : "collapsed"
                        }`}
                        onClick={() => toggleAccordion(2)}
                        aria-expanded={activeIndex === 2}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse2"
                        aria-controls="collapse2"
                      >
                        Hybrid Off Road Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse2"
                      className={`accordion-collapse collapse ${
                        activeIndex === 2 ? "show" : ""
                      } rounded-0`}
                      aria-labelledby="heading2"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <p>
                          <b>
                            What makes X Series RV caravans ideal for off-road
                            adventures?
                          </b>
                        </p>
                        <p>
                          <Link
                            href="https://xseriesrv.au/"
                            target="_blank"
                            rel="noopener"
                          >
                            X Series RV
                          </Link>{" "}
                          caravans are built tough for Australia’s harshest
                          terrains, offering rugged construction, high-quality
                          materials, and reliable off-road performance. Their
                          range includes off-road pods, hybrids, and toy haulers
                          that cater to different adventure needs.
                        </p>
                        <p>
                          <b>
                            What features make the X Element a great choice for
                            singles or couples?
                          </b>
                        </p>
                        <p>
                          The{" "}
                          <Link
                            href="https://xseriesrv.au/hybrid-element/"
                            target="_blank"
                            rel="noopener"
                          >
                            X Element
                          </Link>{" "}
                          is a lightweight, compact caravan designed for singles
                          or couples. It includes a well-equipped kitchen and
                          bathroom, delivering cozy comfort and essential
                          amenities in a travel-friendly size for easy off-road
                          touring.
                        </p>
                        <p>
                          <b>
                            How does X Series RV combine luxury with off-road
                            reliability?
                          </b>
                        </p>
                        <p>
                          X Series RV caravans are engineered to deliver premium
                          amenities like ensuites, full kitchens, and smart
                          storage, while maintaining rugged builds capable of
                          handling rough terrains. This ensures home-like
                          comfort without compromising off-road performance.
                        </p>
                        <p>
                          <b>
                            Which X Series RV model is best suited for families
                            needing space and convenience?
                          </b>
                        </p>
                        <p>
                          The{" "}
                          <Link
                            href="https://xseriesrv.au/hybrid-commander/"
                            target="_blank"
                            rel="noopener"
                          >
                            X Commander
                          </Link>{" "}
                          is perfect for families, offering 2 or 3 bunks, a
                          private ensuite, a washing machine, and ample storage.
                          This 22ft hard roof hybrid caravan provides both
                          luxury and durability for comfortable long-distance
                          family travel.
                        </p>
                        <p>
                          <b>
                            What types of travellers does the X Series RV range
                            cater to?
                          </b>
                        </p>
                        <p>
                          X Series RV offers versatile models for solo
                          adventurers, couples, families, and outdoor
                          enthusiasts with bikes, boats, or buggies. Whether
                          you’re exploring remote bushland or towing toys for
                          your trip, there’s a model designed to suit your
                          lifestyle.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item border-bottom rounded-0">
                    <h3 className="accordion-header" id="heading3">
                      <button
                        className={`accordion-button rounded-0 py-4 ${
                          activeIndex === 3 ? "" : "collapsed"
                        }`}
                        onClick={() => toggleAccordion(3)}
                        aria-expanded={activeIndex === 3}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse3"
                        aria-controls="collapse3"
                      >
                        Extreme Off Road Caravans
                      </button>
                    </h3>
                    <div
                      id="collapse3"
                      className={`accordion-collapse collapse ${
                        activeIndex === 3 ? "show" : ""
                      } rounded-0`}
                      aria-labelledby="heading3"
                      data-bs-parent="#accordionSt4"
                    >
                      <div className="accordion-body">
                        <h4>
                          What key features contribute to the extreme off-road
                          capability of the Nitro Extreme from Everest Caravans?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/nitro-extreme/"
                            target="_blank"
                            rel="noopener"
                          >
                            Nitro Extreme
                          </Link>{" "}
                          from Everest Caravans is built with a robust 9”
                          chassis, a 6′ deck with a 3” riser, and a 6” extended
                          A-frame. These features, along with the Supergal
                          Australian RHS Steel Chassis and 3.5 T Oz Trekker
                          Suspension, ensure exceptional off-road performance
                          and durability.
                        </p>
                        <h4>
                          How does the Summitt model from Everest Caravans
                          ensure reliability on challenging terrains?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/summitt/"
                            target="_blank"
                            rel="noopener"
                          >
                            Summitt
                          </Link>{" "}
                          model from Everest Caravans features a 9” chassis
                          constructed from RHS Australian Steel, a 6” extended
                          A-frame, and Supergal Australian RHS Steel Chassis. It
                          is equipped with 3.5 T Oz Trekker Suspension for full
                          off-road independent suspension, delivering
                          outstanding reliability and performance on tough
                          terrains.
                        </p>
                        <h4>
                          What off-road features are standard across Everest
                          Caravans’ extreme off-road models?
                        </h4>
                        <p>
                          Everest Caravans’ extreme off-road models, including
                          the{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/ice-glider/"
                            target="_blank"
                            rel="noopener"
                          >
                            Ice Glider
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="https://www.everestcaravans.com.au/range/warrior/"
                            target="_blank"
                            rel="noopener"
                          >
                            Warrior
                          </Link>
                          , come standard with a robust 9” chassis, a 6”
                          extended A-frame, Supergal Australian RHS Steel
                          Chassis, and 3.5 T Oz Trekker Suspension. These
                          features ensure exceptional durability, reliability,
                          and performance on challenging terrains.
                        </p>
                        <h4>
                          What features make the Kimberley Plus a top choice for
                          extreme off-grid excursions?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://redcentrecaravans.com.au/kimberley-plus/"
                            target="_blank"
                            rel="noopener"
                          >
                            Kimberley Plus
                          </Link>{" "}
                          from Red Centre Caravans features a robust 4-inch main
                          chassis, a 6-inch drawbar with extension, a 4-inch
                          riser, and fully independent 3.7T dual shock
                          suspension with 12” brakes, providing unmatched
                          stability and durability for rugged off-grid
                          excursions.
                        </p>
                        <h4>
                          How does the Tanami Plus improve stability and control
                          compared to the standard Tanami model?
                        </h4>
                        <p>
                          The{" "}
                          <Link
                            href="https://redcentrecaravans.com.au/tanami-plus/"
                            target="_blank"
                            rel="noopener"
                          >
                            Tanami Plus
                          </Link>{" "}
                          offers enhanced stability and control with its
                          upgraded suspension, disc brakes, and D035 off-road
                          coupling, compared to the standard{" "}
                          <Link
                            href="https://redcentrecaravans.com.au/tanami/"
                            target="_blank"
                            rel="noopener"
                          >
                            Tanami
                          </Link>{" "}
                          model, which also features a 6-inch main chassis and
                          6-inch drawbar but without the additional
                          enhancements.
                        </p>
                        <h4>
                          What makes Red Centre Caravans’ off-road suspension
                          systems suitable for tough Australian conditions?
                        </h4>
                        <p>
                          Red Centre Caravans’ off-road suspension systems, such
                          as the 3.7T dual shock suspension in the Kimberley
                          Plus and the 4T dual shock suspension in the Tanami
                          and Tanami Plus models, are designed for extreme
                          off-road conditions. They offer superior stability and
                          control, ensuring reliability on the harshest
                          terrains.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
