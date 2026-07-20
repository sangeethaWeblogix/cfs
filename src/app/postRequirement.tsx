"use client";

import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { fetchRequirements, Requirement } from "@/api/postRquirements/api";
   import '../app/home/main.css'

interface Props {
  requirements: Requirement[];
}


const PostRequirement = ({ requirements }: Props) => {
   const swiperRef = useRef<SwiperType | null>(null);

     const [items] = useState<Requirement[]>(requirements); // ← props-இல் இருந்து


  // ✅ safely start autoplay after swiper mounts
 useEffect(() => {
  if (items.length > 0 && swiperRef.current) {
    setTimeout(() => {
      swiperRef.current?.autoplay?.start();
    }, 100); // small delay prevents freeze
  }
}, [items]);


// Start autoplay ONLY after items are loaded
useEffect(() => {
  if (items.length > 0 && swiperRef.current?.autoplay) {
    swiperRef.current.autoplay.start();
  }
}, [items]);

  // ✅ hover handlers that work even with loop mode
  // const handleMouseEnter = () => {
  //   if (swiperRef.current?.autoplay) {
  //     swiperRef.current.autoplay.stop();
  //   }
  // };

  // console.log("item", items )
  // const handleMouseLeave = () => {
  //   if (swiperRef.current?.autoplay) {
  //     swiperRef.current.autoplay.start();
  //   }
  // };
const handleMouseEnter = () => {
  swiperRef.current?.autoplay?.stop();
};

const handleMouseLeave = () => {
  swiperRef.current?.autoplay?.start();
};


useEffect(() => {
  if (!swiperRef.current) return;
  if (items.length === 0) return;

  // Delay required for production builds
  const timer = setTimeout(() => {
    swiperRef.current?.autoplay?.start();
  }, 300); 

  return () => clearTimeout(timer);
}, [items]);


// const Slug = (value: string) => {
//   return value
//     .trim()
//     .toLowerCase()
//     .replace(/offroad/g, "off-road")   // special case
//     .replace(/\s+/g, "-");             // space → hyphen
// };
  return (
     <div>
      <div className="post_bgs">
        <div className="row">
          {/* LEFT SIDE */}
          <div className="col-lg-6">
            <div className="home-post_head">
              <h3>
                <span>Find Your Ideal Caravan</span>
                <br />– Post Your Requirements
              </h3>
              <p>
                Tell us what you&apos;re looking for and we&apos;ll match you
                with the right caravan for sale, from trusted dealers at a
                fair price. Make sure your budget and expectations are
                realistic to help us deliver the best possible outcome. See
                some examples of what other caravan buyers are looking for.
              </p>
              <div className="final_post_btn">
                <a href="/caravan-enquiry-form/" className="btn">
                  Post Your Requirements
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - SWIPER */}
          <div className="col-lg-6">
            <div
              className="home-post__items info top_cta_container"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <h3>Recent Caravan Requests</h3>
              <p className="sub-text">
                See examples of what other caravan buyers are looking for.
              </p>
              <div className="top_cta bg-white">
                <Swiper
                  modules={[Autoplay, Pagination, Navigation]} // ✅ Navigation added
                  spaceBetween={20}
                  slidesPerView={1}
                  autoplay={{                                   // ✅ object, not boolean
                    delay: 3000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                  }}
                  pagination={{ clickable: true }}
                  //navigation={true}                            // ✅ arrows enabled
                  loop={true}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  className="homepost-swiper"
                >
                  {items.map((item, index) => (
                    <SwiperSlide key={index}>
                      <div className="post_flip">
                        <div className="home-post__item">
                          <div className="fet_feild">
                            <div className="type pst_table">
                              <span className="slugn">Type</span>
                              {item.type}
                            </div>
                            <div className="condition pst_table">
                              <span className="slugn">Condition</span>
                              {item.condition}
                            </div>
                            <div className="status pst_table">
                              <span className="slugn">Status</span>
                              {item.active === "1" ? "Active" : "Inactive"}
                            </div>
                            <div className="location pst_table">
                              <span className="slugn">Location</span>
                              {item.location}
                            </div>
                          </div>
                          <div className="requirements">
                            {item.requirements}
                          </div>
                          <div className="budget">
                            <span className="slugn">Budget</span>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                            }).format(Number(item.budget))}
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostRequirement;
