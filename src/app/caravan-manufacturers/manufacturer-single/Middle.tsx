"use client";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function EverestCaravans() {
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  return (
    <>
      {/* Features Section */}
      <section className="features style-7 section-padding range_listing_li pb-20">
        <div className="container">
          <div className="content">
            <div className="align-items-center justify-content-center mt-20">
              <div className="row">
                {/* Post Card 1 */}
                <div className="col-lg-4 mb-30">
                  <div
                    className={`features-card style-7 hover panel ${
                      flippedCard === 1 ? "flip" : ""
                    }`}
                    onMouseEnter={() => setFlippedCard(1)}
                    onMouseLeave={() => setFlippedCard(null)}
                  >
                    <div className="front">
                      <div className="box1">
                        <div className="box_mid">
                          <Image
                            src="https://admin.caravansforsale.com.au/wp-content/uploads/2023/08/1-13.png"
                            alt="Falcon Caravan"
                            width={1000}
                            height={476}
                          />
                        </div>
                        <div className="box-bottom">
                          <div className="info">
                            <h5>Falcon - FULL OFF ROAD</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="back">
                      <div className="box2">
                        <h4>Falcon</h4>
                      </div>
                      <div className="back_bottom">
                        <div className="discription">
                          <h6 className="pb-20">FULL OFF ROAD</h6>
                        </div>
                        <Link
                          href="https://admin.caravansforsale.com.au/range/falcon-everest-caravans/"
                          className="button"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Card 2 */}
                <div className="col-lg-4 mb-30">
                  <div
                    className={`features-card style-7 hover panel ${
                      flippedCard === 2 ? "flip" : ""
                    }`}
                    onMouseEnter={() => setFlippedCard(2)}
                    onMouseLeave={() => setFlippedCard(null)}
                  >
                    <div className="front">
                      <div className="box1">
                        <div className="box_mid">
                          <Image
                            src="https://admin.caravansforsale.com.au/wp-content/uploads/2023/08/1-16.png"
                            alt="Nitro Extreme Caravan"
                            width={1000}
                            height={476}
                          />
                        </div>
                        <div className="box-bottom">
                          <div className="info">
                            <h5>Nitro Extreme - OFF ROAD</h5>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="back">
                      <div className="box2">
                        <h4>Nitro Extreme</h4>
                      </div>
                      <div className="back_bottom">
                        <div className="discription">
                          <h6 className="pb-20">OFF ROAD</h6>
                        </div>
                        <Link
                          href="https://admin.caravansforsale.com.au/range/nitro-extreme-everest-caravans/"
                          className="button"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add more Post Cards here */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Listings Section */}
      <section
        className="related-products section-padding"
        style={{ background: "#f1f1f1" }}
      >
        <div className="container">
          <div className="title">
            <div className="tpof_tab">
              <h2>Recent Everest Caravans Listings</h2>
            </div>
          </div>

          <div className="related-products-slider position-relative">
            <Swiper
              modules={[Navigation]}
              navigation={{
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              }}
              spaceBetween={20}
              slidesPerView={3}
              breakpoints={{
                320: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              loop={true}
            >
              {/* Slide 1 */}
              <SwiperSlide>
                <Link href="https://admin.caravansforsale.com.au/product/2024-everest-warrior-19-6-extreme-off-road-with-ensuite-4-berth/">
                  <div className="product-card">
                    <div className="img">
                      <Image
                        src="https://admin.caravansforsale.com.au/wp-content/uploads/2024/07/2024-everest-20-6-warrior-new-extreme-off-road-caravan-left-l-shape-lounge-5-86-maini.jpg"
                        alt="Everest Warrior Ensuite"
                        width={1837}
                        height={1037}
                      />
                    </div>
                    <div className="product_de">
                      <div className="info">
                        <h6 className="category">
                          <i className="fa-solid fa-location-dot"></i>
                          <span>Western Australia</span>
                        </h6>
                        <h3 className="title">
                          2024 Everest Warrior 19’6 Extreme Off Road with
                          Ensuite – 4 Berth
                        </h3>
                      </div>
                      <ul className="vehicleDetailsWithIcons simple">
                        <li>
                          <span className="attribute3">New</span>
                        </li>
                      </ul>
                      <div className="price">
                        <span>POA</span>
                      </div>
                      <span className="btn rounded-pill bg-blue4 text-white mt-20">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>

              {/* Slide 2 */}
              <SwiperSlide>
                <Link href="https://admin.caravansforsale.com.au/product/2024-everest-warrior-19-6-extreme-off-road-with-club-lounge/">
                  <div className="product-card">
                    <div className="img">
                      <Image
                        src="https://admin.caravansforsale.com.au/wp-content/uploads/2024/07/2024-everest-20-6-warrior-new-extreme-off-road-caravan-left-l-shape-lounge-5-86-maini.jpg"
                        alt="Everest Warrior Club Lounge"
                        width={1837}
                        height={1037}
                      />
                    </div>
                    <div className="product_de">
                      <div className="info">
                        <h6 className="category">
                          <i className="fa-solid fa-location-dot"></i>
                          <span>Tasmania</span>
                        </h6>
                        <h3 className="title">
                          2024 Everest Warrior 19’6 Extreme Off Road with Club
                          Lounge
                        </h3>
                      </div>
                      <ul className="vehicleDetailsWithIcons simple">
                        <li>
                          <span className="attribute3">New</span>
                        </li>
                      </ul>
                      <div className="price">
                        <span>POA</span>
                      </div>
                      <span className="btn rounded-pill bg-blue4 text-white mt-20">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            </Swiper>

            {/* Navigation Arrows */}
            <div className="swiper-button-next"></div>
            <div className="swiper-button-prev"></div>
          </div>
        </div>
      </section>
    </>
  );
}
