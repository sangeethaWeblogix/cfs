"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
// import { fetchManufacturers, Manufacturer } from "@/api/manufactures/api";

type FeatureCardProps = {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  shortinfo?: string; // optional
  link: string;
};

function FeatureCard({
  image,
  alt,
  title,
  subtitle,
  shortinfo,
  link,
}: FeatureCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`features-card style-7 hover panel ${isFlipped ? "flip" : ""}`}
      style={{ top: "0px" }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className="front">
        <div className="box1">
          <div className="box_mid">
            <Image src={image} width={1000} height={476} alt={alt} priority />
          </div>
          <div className="box-bottom">
            <div className="info">
              <h5>{title}</h5>
            </div>
          </div>
        </div>
      </div>
      <div className="back">
        <div className="box2">
          <h4>{title.split(" - ")[0]}</h4>
        </div>
        <div className="back_bottom">
          <div className="discription">
            <h6 className="pb-20">{subtitle}</h6>
            <p>{shortinfo}</p>
          </div>
          <Link href={link} className="button">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CaravanManufacturers() {
  // const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  // useEffect(() => {
  //   fetchManufacturers().then((data) => {
  //     if (data) setManufacturers(data);
  //   });
  // }, []);

  // console.log("manufacturers", manufacturers);

  return (
    <>
      {/* Everest Caravans Section */}
      <section className="related-products section-padding pb-0">
        <div className="container">
          <div className="title mb-20">
            <div className="tpof_tab">
              <h3>Everest Caravans</h3>
              <div className="viewall_bttn">
                <Link href="https://admin.caravansforsale.com.au/caravan-manufacturers/everest-caravans/">
                  <i className="bi bi-chevron-right"></i>
                </Link>
              </div>
            </div>
          </div>
          <div className="range-list position-relative">
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
            >
              <SwiperSlide>
                <FeatureCard
                  image="https://admin.caravansforsale.com.au/wp-content/uploads/2023/08/1-13.png"
                  alt="Falcon Caravan"
                  title="Falcon - FULL OFF ROAD"
                  subtitle="FULL OFF ROAD"
                  link="https://www.caravansforsale.com.au/range/falcon-everest-caravans/"
                />
              </SwiperSlide>

              <SwiperSlide>
                <FeatureCard
                  image="https://admin.caravansforsale.com.au/wp-content/uploads/2023/08/1-16.png"
                  alt="Nitro Extreme Caravan"
                  title="Nitro Extreme - OFF ROAD"
                  subtitle="OFF ROAD"
                  link="https://www.caravansforsale.com.au/range/nitro-extreme-everest-caravans/"
                />
              </SwiperSlide>
              <SwiperSlide>
                <FeatureCard
                  image="https://admin.caravansforsale.com.au/wp-content/uploads/2023/08/1-17.png"
                  alt="Calibra Caravan"
                  title="Calibra - FULL OFF ROAD"
                  subtitle="FULL OFF ROAD"
                  shortinfo="Traveling with three kids and need space for adventure? The 20.6F CALIBRA offers all the quality, style, and features of an Everest, with a full ensuite, spacious living area, and off-road capabilities. It's perfect for family getaways, so pack up and experience it—just be warned, the kids might not want to leave!"
                  link="https://www.caravansforsale.com.au/range/calibra-everest-caravans/"
                />
              </SwiperSlide>
              <SwiperSlide>
                <FeatureCard
                  image="https://admin.caravansforsale.com.au/wp-content/uploads/2023/08/1-19.png"
                  alt="Summitt"
                  title="Summitt - FULL OFF ROAD"
                  subtitle="FULL OFF ROAD"
                  shortinfo="Traveling with 3 kids? No worries with the SUMMITT! Reach places larger vans can&#8217;t with Everest quality and style, featuring a full ensuite, spacious living area, queen island bed, and off-road, off-grid capabilities. Pack up the family and come see for yourself—but be warned, the kids might not want to leave!"
                  link="https://www.caravansforsale.com.au/range/summitt-everest-caravans/"
                />
              </SwiperSlide>
            </Swiper>

            <div className="swiper-button-next"></div>
            <div className="swiper-button-prev"></div>
          </div>
        </div>
      </section>
      {/* Pagination Section */}{" "}
      <section className="section-padding pb-0">
        <div className="container">
          <div className="pagination:container">
            <div className="pagination:number pagination:active">
              <a>1</a>
            </div>
            <div className="pagination:number">
              <Link href="https://admin.caravansforsale.com.au/caravan-manufacturers/all/page-2/">
                {" "}
                2{" "}
              </Link>
            </div>
            <div className="pagination:number">
              <Link href="https://admin.caravansforsale.com.au/caravan-manufacturers/all/page-3/">
                {" "}
                3{" "}
              </Link>
            </div>{" "}
            {/* Add more pagination items here */}{" "}
            <div className="pagination:number arrow">
              <Link href="https://admin.caravansforsale.com.au/caravan-manufacturers/all/page-2/">
                <svg width="18" height="18">
                  <use xlinkHref="#right" />
                </svg>
              </Link>
            </div>
          </div>
          <svg className="hide">
            <symbol
              id="left"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </symbol>
            <symbol
              id="right"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </symbol>
          </svg>
        </div>
      </section>
    </>
  );
}
