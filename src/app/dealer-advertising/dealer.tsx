"use client";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";
import { useState } from "react";

const DealerLandingPage = () => {

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };



  return (
    <div className="page_wrapper">
      {/* Banner Section */}
      <section className="banner_section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12 col-md-12">
              <div className="banner_text text-center">


                <h1>
                  Unlimited Listings. Zero Lead Fees. <br />
                  <span className="color-text">
                    $299 per month{" "}
                    <span style={{ fontSize: "20px" }}>(inc. GST)</span>
                  </span>{" "}
                  <span className="no-color-text">- Cancel anytime</span>
                </h1>

                <p>
                  A dealer-first marketplace built to generate consistent
                  enquiries from high-intent caravan buyers.
                </p>

                <a
                  href="https://seller.caravansforsale.com.au/dealer-subscription/"
                  className="btn white_btn"
                >
                  Start Dealer Signup
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Generation Section */}
      <section className="row_am free_app_section">
        <div className="container">
          <div className="free_app_inner">
            <div className="row">
              <div className="col-md-12">
                <div className="free_text">
                  <div className="feel_cfs">
                    <h2>
                      Lead Generation Machine{" "}
                      <span>Built for Your Caravan Dealership</span>
                    </h2>

                    <p className="mb-3">
                      Your stock deserves visibility without per-lead fees, CFS
                      connects your dealership with buyers actively searching
                      for their next caravan—so your inventory gets seen by the
                      right audience.
                    </p>

                    <div className="info top_cta_container">
                      <div
                        className="top_cta"
                        style={{ backgroundColor: "#ffffff" }}
                      >
                        <h3>Maximum Visibility & Lead Generation</h3>

                        <div className="row">
                          {[
                            {
                              img: "/images/seo_keyword.svg",
                              title: "Ranking for 300+ High-Intent Keywords",
                              desc: "Get discovered by buyers actively searching for caravans.",
                            },
                            {
                              img: "/images/visiter.svg",
                              title: "1000's of Daily Visitors & Growing",
                              desc: "Reach a highly engaged, caravan-buyer-specific audience every day",
                            },
                            {
                              img: "/images/inbox.svg",
                              title: "Daily Leads Delivered to Your Inbox",
                              desc: "Fresh, high-quality leads sent directly to you.",
                            },
                          ].map((item, i) => (
                            <div className="col-md-6 col-lg-4" key={i}>
                              <div
                                className={`why_box-1 ${i === 2 ? "why_box-border-none" : ""
                                  }`}
                              >
                                <div className="why_box">
                                  <div className="icon">
                                    <img src={item.img} alt="" />
                                  </div>
                                  <div className="text">
                                    <h4>{item.title}</h4>
                                    <p>{item.desc}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Highlights */}
                        <div className="row special_txt">

                          {[
                            "No Lead Fees",
                            "High-Intent Buyers",
                            "Dealer-First Platform",
                            "Fast Setup",
                          ].map((text, i) => (
                            <>
                              <div className="col-lg-2 p-0">
                                <h2>
                                  <span>{text}</span>
                                </h2>
                              </div>
                              {i !== 3 && (
                                <div className="col-lg-1 dot-box-one">
                                  <em>
                                    <i className="fa-solid fa-circle" />
                                  </em>
                                </div>
                              )}
                            </>
                          ))}

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

      {/* Comparison Table */}
      <section className="bottom_layout_section">
        <div className="container">
          <div className="row p-relative">
            <div className="col-12">
              <div className="comparison">
                <h2 className="text-center">
                  <span>Why Caravan Dealers </span> Choose CFS
                </h2>

                <div className="table-responsive">
                  <table className="table table-bordered text-center align-middle">
                    <thead>
                      <tr>
                        <th className="text-start">Comparison Table</th>
                        <th>CFS</th>
                        <th>Other Marketplaces</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "We list your entire stock automatically",
                        "Listings are updated automatically based on your website stock data",
                        "Caravan buyer/seller-only audience",
                        "Built for caravan dealers—not classified clutter",
                        "Unlimited caravan listings",
                        "No per-lead fees",
                        "Best-value monthly subscription fees by a country mile",
                      ].map((text, i) => (
                        <tr key={i}>
                          <td className="text-start">{text}</td>
                          <td className="check">
                            <img src="/images/check-green.svg" alt="Yes" />
                          </td>
                          <td className="cross">
                            <img src="/images/close.svg" alt="No" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-8"></div>
            <div className="col-lg-4">
              <section className="floating-section">
                <div className="container">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="floating-box">
                        <div className="box-content">
                          <h3>How long does setup take?</h3>
                          <p>Most dealers are live within 24-48 hours.</p>
                        </div>
                        <div className="box-content border-none-box">
                          <h3>Is there a contract?</h3>
                          <p>No. Cancel anytime.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
          {/* Reach Caravan Buyers Section */}
          <div className="col-lg-12">
            <div className="heading-box">
              <h2>Reach caravan buyers across Australia</h2>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-7 images-box">
              <img
                src="/images/your-caravan-desktop.jpg"
                className="img-fluid d-none d-lg-block desktop-img"
                alt="Caravan For Sale Desktop"
              />
              <img
                src="/images/your-caravan-mobile.png"
                className="img-fluid d-block d-lg-none mobile-img"
                alt="Caravan For Sale Mobile"
              />
            </div>

            <div className="col-lg-5">
              <div className="pricing-grid">
                <div className="price-box">
                  <h2>Simple Pricing. No Surprises.</h2>

                  <div className="price">
                    $299 Per Month{" "}
                    <span style={{ fontSize: "20px" }}>(inc. GST)</span>
                  </div>

                  <ul>
                    <li>Unlimited listings</li>
                    <li>Zero-lead fees</li>
                    <li>Cancel anytime</li>
                    <li>No contracts</li>
                  </ul>

                  <a
                    href="https://seller.caravansforsale.com.au/dealer-subscription/"
                    className="btn white_btn"
                  >
                    Start Dealer Signup
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* FAQ Section */}
          <h2 className="mb-3">FAQ</h2>

          <div className="accordion" id="accordionFaq">
            {/* FAQ 1 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(1)}
                  >
                    How much does the dealer subscription cost, and what’s included?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 1 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 1 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 1 ? "show" : ""}`}>
                <div className="card-body">
                  <p>
                    The dealer subscription is $299 per month (including GST). This flat
                    monthly fee allows your dealership to list unlimited caravans on
                    CaravansForSale.com.au. There are no per-listing charges, and we never
                    charge per lead or take success commissions – no matter how many
                    inquiries or sales you get, $299/month covers it all.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ 2 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(2)}
                  >
                    How are my caravan listings added and kept up-to-date automatically?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 2 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 2 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 2 ? "show" : ""}`}>
                <div className="card-body">
                  <p>
                    We sync directly with your dealership’s website. Your listings are
                    pulled automatically and refreshed weekly to match your current
                    inventory.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ 3 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(3)}
                  >
                    What kind of audience will my caravans reach?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 3 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 3 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 3 ? "show" : ""}`}>
                <div className="card-body">
                  <p>
                    CaravansForSale.com.au is a caravan-only marketplace with a focused,
                    nationwide audience of serious buyers.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ 4 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(4)}
                  >
                    Do I have to commit to a long-term contract?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 4 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 4 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 4 ? "show" : ""}`}>
                <div className="card-body">
                  <p>
                    No. The subscription is month-to-month with no lock-in contracts. You
                    can cancel anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ 5 */}
            <div className="card">
              <div className="card-header p-0">
                <h3 className="mb-0">
                  <button
                    className="btn btn-link btn-block text-left py-2"
                    onClick={() => toggleFaq(5)}
                  >
                    How do I get started, and what support can I expect?
                    <span className="accordion-icon">
                      <i className={`fa-solid fa-angle-down ${activeFaq === 5 ? "d-none" : ""}`}></i>
                      <i className={`fa-solid fa-angle-up ${activeFaq === 5 ? "" : "d-none"}`}></i>
                    </span>
                  </button>
                </h3>
              </div>

              <div className={`collapse ${activeFaq === 5 ? "show" : ""}`}>
                <div className="card-body">
                  <p>
                    Getting started is fast and easy. Our team assists with onboarding,
                    website feed integration, and ongoing dealer support.
                  </p>
                </div>
              </div>
            </div>
          </div>



        </div>
      </section>


    </div>
  );
};

export default DealerLandingPage;
