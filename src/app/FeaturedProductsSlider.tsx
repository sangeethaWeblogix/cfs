"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import Image from "next/image";

const products = [
  {
    link: "https://www.caravansforsale.com.au/product/2024-everest-alpine-freestyle-18-6-full-off-road-slideouts-with-ensuite/",
    image:
      "https://www.caravansforsale.com.au/wp-content/uploads/2024/07/2024-everest-18-6-alpine-freestyle-new-full-off-road-caravan-straight-lounge-3061-41-maini.png",
    location: "Western Australia",
    title:
      "2024 Everest Alpine Freestyle 18’6 Full Off Road Slideouts with Ensuite",
    price: "$89,990",
    originalPrice: null,
  },
  {
    link: "https://www.caravansforsale.com.au/product/2024-prime-edge-xplorer-18-6-off-road-slide-out-kitchen-single-axle/",
    image:
      "https://www.caravansforsale.com.au/wp-content/uploads/2024/12/18-6-prime-edge-2024-xplorer-new-off-road-caravan-4555-main-1.jpg",
    location: "Queensland",
    title:
      "2024 Prime Edge Xplorer 18’6 Off Road Slide Out Kitchen – Single Axle",
    price: "$125,990",
    originalPrice: null,
  },
  {
    link: "https://www.caravansforsale.com.au/product/2024-coronet-rv-ultimate-19-6-semi-off-road-shower-and-toilet-couples/",
    image:
      "https://www.caravansforsale.com.au/wp-content/uploads/2024/10/coronet-rv-21-6-ultimate-2024-new-family-caravan-2-65-maini.jpg",
    location: "Queensland",
    title:
      "2024 Coronet RV Ultimate 19’6 Semi Off Road Shower and Toilet – Couples",
    price: "$90,999",
    originalPrice: "$91,999",
  },
  {
    link: "https://www.caravansforsale.com.au/product/2024-everest-alpine-freestyle-18-6-full-off-road-slideouts-with-ensuite/",
    image:
      "https://www.caravansforsale.com.au/wp-content/uploads/2024/07/2024-everest-18-6-alpine-freestyle-new-full-off-road-caravan-straight-lounge-3061-41-maini.png",
    location: "Western Australia",
    title:
      "2024 Everest Alpine Freestyle 18’6 Full Off Road Slideouts with Ensuite",
    price: "$89,990",
    originalPrice: null,
  },
  {
    link: "https://www.caravansforsale.com.au/product/2024-prime-edge-xplorer-18-6-off-road-slide-out-kitchen-single-axle/",
    image:
      "https://www.caravansforsale.com.au/wp-content/uploads/2024/12/18-6-prime-edge-2024-xplorer-new-off-road-caravan-4555-main-1.jpg",
    location: "Queensland",
    title:
      "2024 Prime Edge Xplorer 18’6 Off Road Slide Out Kitchen – Single Axle",
    price: "$125,990",
    originalPrice: null,
  },
  {
    link: "https://www.caravansforsale.com.au/product/2024-coronet-rv-ultimate-19-6-semi-off-road-shower-and-toilet-couples/",
    image:
      "https://www.caravansforsale.com.au/wp-content/uploads/2024/10/coronet-rv-21-6-ultimate-2024-new-family-caravan-2-65-maini.jpg",
    location: "Queensland",
    title:
      "2024 Coronet RV Ultimate 19&apos;6 Semi Off Road Shower and Toilet – Couples",
    price: "$90,999",
    originalPrice: "$91,999",
  },
];

const FeaturedProductsSlider = () => {
  return (
    <div
      className="related-products section-padding"
      style={{ background: "#f1f1f1" }}
    >
      <div className="container">
        <div className="title">
          <div className="tpof_tab">
            <h2>Featured Caravans For Sale</h2>
            <div className="viewall_bttn">
              <Link href="">
                <i className="bi bi-chevron-right"></i>
              </Link>
            </div>
          </div>
        </div>
        <div className="featured-products-slider position-relative">
          <Swiper
            modules={[Navigation]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
          >
            {products.map((product, index) => (
              <SwiperSlide key={index}>
                <Link href={product.link} className="mb-3">
                  <div className="product-card">
                    <div className="img">
                      <Image
                        src={product.image}
                        alt={product.title}
                        height={100}
                        width={100}
                      />
                    </div>
                    <div className="product_de">
                      <div className="info">
                        <h6 className="category">
                          <i className="fa-solid fa-location-dot"></i>
                          <span>{product.location}</span>
                        </h6>
                        <h3 className="title">{product.title}</h3>
                      </div>
                      <div className="price">
                        {product.originalPrice ? (
                          <>
                            <del>
                              <span className="woocommerce-Price-amount amount">
                                {product.originalPrice}
                              </span>
                            </del>{" "}
                            <ins>
                              <span className="woocommerce-Price-amount amount">
                                {product.price}
                              </span>
                            </ins>
                          </>
                        ) : (
                          <span className="woocommerce-Price-amount amount">
                            {product.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProductsSlider;
