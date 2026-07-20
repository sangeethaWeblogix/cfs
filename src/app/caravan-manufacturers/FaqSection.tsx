"use client";

import { useState } from "react";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";

type FaqItem = {
  heading: string;
  content: React.ReactNode;
};

const faqData: FaqItem[] = [
  {
    heading: "1. Everest Caravans",
    content: (
      <>
        <h4>What types of caravans does Everest Caravans specialize in?</h4>
        <p>
          Everest Caravans specializes in custom-built extreme off-road
          caravans, including models like{" "}
          <Link
            href="https://www.everestcaravans.com.au/range/falcon/"
            target="_blank"
          >
            Falcon
          </Link>
          ,{" "}
          <Link
            href="https://www.everestcaravans.com.au/range/nitro-extreme/"
            target="_blank"
          >
            Nitro Extreme
          </Link>
          ,{" "}
          <Link
            href="https://www.everestcaravans.com.au/range/calibra/"
            target="_blank"
          >
            Calibra
          </Link>
          ,{" "}
          <Link
            href="https://www.everestcaravans.com.au/range/summitt/"
            target="_blank"
          >
            Summitt
          </Link>
          , and{" "}
          <Link
            href="https://www.everestcaravans.com.au/range/alpine/"
            target="_blank"
          >
            Alpine
          </Link>
          .
        </p>
        <h4>Can I customize my caravan with Everest Caravans?</h4>
        <p>
          Yes, Everest Caravans offers custom-built options to tailor the
          caravan to your specific needs.
        </p>
        <h4>Are their caravans family-friendly?</h4>
        <p>
          Yes, the Calibra and Summit models are particularly designed to
          accommodate families.
        </p>
      </>
    ),
  },
  {
    heading: "2. Orbit Caravans",
    content: (
      <>
        <h4>What range of caravans does Orbit Caravans offer?</h4>
        <p>
          Orbit Caravans offers luxury off-road caravans like{" "}
          <Link
            href="https://orbitcaravans.com.au/range/discovery-x/"
            target="_blank"
          >
            Discovery X
          </Link>
          ,{" "}
          <Link
            href="https://orbitcaravans.com.au/range/eclipse/"
            target="_blank"
          >
            Eclipse X
          </Link>
          , and{" "}
          <Link
            href="https://orbitcaravans.com.au/range/space/"
            target="_blank"
          >
            Space V
          </Link>
          .
        </p>
        <h4>Are Orbit Caravans suitable for couples?</h4>
        <p>
          Yes, Eclipse X and Space V are perfect for couples seeking a luxurious
          off-road experience.
        </p>
        <h4>Do they offer extendable floor plans?</h4>
        <p>Yes, the Discovery X model features an extendable floor plan.</p>
      </>
    ),
  },
  {
    heading: "3. Grand City Caravans",
    content: (
      <>
        <h4>What technology is used in Grand City Caravans?</h4>
        <p>
          They use state-of-the-art 3D modeling software for precise builds.
        </p>
        <h4>Are Grand City Caravans customizable?</h4>
        <p>
          Yes, models like{" "}
          <Link
            href="https://grandcitycaravans.com.au/range/nomad/"
            target="_blank"
          >
            Nomad
          </Link>{" "}
          and{" "}
          <Link
            href="https://grandcitycaravans.com.au/range/explorer/"
            target="_blank"
          >
            Explorer
          </Link>{" "}
          offer options.
        </p>
        <h4>What types of caravans do they offer?</h4>
        <p>
          Full off-road (Nomad, Explorer), semi off-road{" "}
          <Link
            href="https://grandcitycaravans.com.au/range/royale/"
            target="_blank"
          >
            Royale
          </Link>
          , and touring{" "}
          <Link
            href="https://grandcitycaravans.com.au/range/escape/"
            target="_blank"
          >
            Escape
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    heading: "4. High Country Caravans",
    content: (
      <>
        <h4>What makes High Country Caravans stand out?</h4>
        <p>
          They are designed to tackle the harshest Australian off-road
          conditions.
        </p>
        <h4>What models are available?</h4>
        <p>Alpine, Explore, Extreme, and Summit.</p>
        <h4>Are their caravans family-friendly?</h4>
        <p>Yes, with ample space and modern amenities.</p>
      </>
    ),
  },
  {
    heading: "5. Silver Valley Caravans",
    content: (
      <>
        <h4>What types of caravans does Silver Valley offer?</h4>
        <p>
          Touring models like{" "}
          <Link
            href="https://www.silvervalleycaravans.com.au/range/the-family-getaway.html"
            target="_blank"
          >
            Family Getaway
          </Link>
          ,{" "}
          <Link
            href="https://www.silvervalleycaravans.com.au/range/yarra.html"
            target="_blank"
          >
            Yarra
          </Link>
          ,{" "}
          <Link
            href="https://www.silvervalleycaravans.com.au/range/orana.html"
            target="_blank"
          >
            Orana
          </Link>
          ,{" "}
          <Link
            href="https://www.silvervalleycaravans.com.au/range/indigo.html"
            target="_blank"
          >
            Indigo
          </Link>
          ,{" "}
          <Link
            href="https://www.silvervalleycaravans.com.au/range/hepburn.html"
            target="_blank"
          >
            Hepburn
          </Link>
          .
        </p>
        <h4>Are they customizable?</h4>
        <p>Yes, with interior & exterior options.</p>
        <h4>What makes them luxurious?</h4>
        <p>High-quality materials and modern appliances.</p>
      </>
    ),
  },
  {
    heading: "6. Red Centre Caravans",
    content: (
      <>
        <h4>What distinguishes Red Centre Caravans?</h4>
        <p>Sturdy aluminium frame construction.</p>
        <h4>What types do they offer?</h4>
        <p>
          On-road, off-road, semi-off-road like{" "}
          <Link href="https://redcentrecaravans.com.au/newell/" target="_blank">
            Newell
          </Link>
          ,{" "}
          <Link
            href="https://redcentrecaravans.com.au/kimberley/"
            target="_blank"
          >
            Kimberley
          </Link>
          ,{" "}
          <Link href="https://redcentrecaravans.com.au/tanami/" target="_blank">
            Tanami Extreme
          </Link>
          ,{" "}
          <Link
            href="https://redcentrecaravans.com.au/gibb-off-road-plus/"
            target="_blank"
          >
            Gibb Plus
          </Link>
          .
        </p>
        <h4>Are they energy-efficient?</h4>
        <p>Yes, with systems like Victron micro touch.</p>
      </>
    ),
  },
  {
    heading: "7. Masterpiece Caravans",
    content: (
      <>
        <h4>What range do they provide?</h4>
        <p>Models like Optimum, Performance, XTM.</p>
        <h4>Are they built for extreme conditions?</h4>
        <p>Yes, engineered for rugged terrains with luxury interiors.</p>
        <h4>Do they offer compact models?</h4>
        <p>Yes, the XTM series.</p>
      </>
    ),
  },
  {
    heading: "8. Villa Caravans",
    content: (
      <>
        <h4>What do they specialize in?</h4>
        <p>Semi off-road caravans like Escape SE and Escape.</p>
        <h4>Are they suitable for rough terrains?</h4>
        <p>Yes, durable for dirt roads and remote travel.</p>
        <h4>Do they offer family-friendly options?</h4>
        <p>Yes, with spacious, feature-rich models.</p>
      </>
    ),
  },
  {
    heading: "9. Willow RV",
    content: (
      <>
        <h4>What types of caravans do they offer?</h4>
        <p>
          Models include{" "}
          <Link
            href="https://willowrv.com.au/illawarra-series-caravans/"
            target="_blank"
          >
            Illawarra
          </Link>
          ,{" "}
          <Link
            href="https://willowrv.com.au/waratah-series-caravans/"
            target="_blank"
          >
            Waratah
          </Link>
          ,{" "}
          <Link
            href="https://willowrv.com.au/ironbark-series-caravans/"
            target="_blank"
          >
            Ironbark
          </Link>
          ,{" "}
          <Link
            href="https://willowrv.com.au/boab-series-caravans/"
            target="_blank"
          >
            Boab
          </Link>
          .
        </p>
        <h4>Are their interiors comfortable?</h4>
        <p>Yes, luxury interiors with ensuites and open layouts.</p>
        <h4>What value do they provide?</h4>
        <p>Premium features included as standard.</p>
      </>
    ),
  },
  {
    heading: "10. Apache Caravans",
    content: (
      <>
        <h4>What makes Apache stand out?</h4>
        <p>
          Innovative layouts, eco-friendly features, space-efficient design.
        </p>
        <h4>Are they budget-friendly?</h4>
        <p>Yes, competitive pricing while maintaining quality.</p>
        <h4>Do they handle off-road?</h4>
        <p>
          Yes, models like{" "}
          <Link
            href="https://apachecaravans.com.au/top-gun-13/"
            target="_blank"
          >
            TopGun 13
          </Link>{" "}
          and{" "}
          <Link href="https://apachecaravans.com.au/wildkat14/" target="_blank">
            WildKat 14
          </Link>
          .
        </p>
      </>
    ),
  },
];

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="faq section-padding style-4 bg_custom_d">
      <div className="container">
        <div className="section-head text-center style-4">
          <h2 className="mb-30">Frequently asked questions (FAQs)</h2>
        </div>
        <div className="accordion faq style-3 style-4" id="accordionFaq">
          {faqData.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div
                className="accordion-item border-bottom rounded-0"
                key={index}
              >
                <h3 className="accordion-header">
                  <button
                    className={`accordion-button rounded-0 py-4 ${
                      isOpen ? "" : "collapsed"
                    }`}
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleAccordion(index)}
                  >
                    {faq.heading}
                  </button>
                </h3>
                <div
                  className={`accordion-collapse collapse ${
                    isOpen ? "show" : ""
                  }`}
                >
                  <div className="accordion-body">{faq.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
