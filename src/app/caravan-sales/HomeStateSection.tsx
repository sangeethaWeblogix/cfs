"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import CaravansByStateSkeleton from "../components/Caravansbystateskeleton";

interface Item {
  state: string;
  display_text: string;
  permalink: string;
}

interface Props {
  stateBands: Item[];
  title?: string;
}

const stateMeta: Record<string, { code: string; image: string }> = {
  victoria:           { code: "VIC", image: "/images/vic_map.svg" },
  "new-south-wales":  { code: "NSW", image: "/images/nsw_map.svg" },
  queensland:         { code: "QLD", image: "/images/qld_map.svg" },
  "south-australia":  { code: "SA",  image: "/images/sa_map.svg" },
  "western-australia":{ code: "WA",  image: "/images/wa_map.svg" },
  tasmania:           { code: "TAS", image: "/images/tas_map.svg" },
};

export default function HomeStateSection({ stateBands, title = "Browse Caravans for Sale in Australia by State" }: Props) {
  const loading = stateBands.length === 0;

  return (
    <section className="section-padding" style={{ background: "#f6f7fb" }}>
      <div className="container">
        <div className="row">
          <div className="col">
            <div className="section-head mb-4">
              <h2 className="hd-section-title">{title}</h2>
            </div>
          </div>
        </div>

        {loading ? (
          <CaravansByStateSkeleton count={4} />
        ) : (
          <div className="content caravans_by_state">
            <div className="position-relative">
              <Swiper
                modules={[Navigation]}
                navigation={{ nextEl: ".state-manu-next", prevEl: ".state-manu-prev" }}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  768:  { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
                  1280: { slidesPerView: 4 },
                }}
              >
                {stateBands.map((item, index) => {
                  const key = item.state.toLowerCase().replace(/\s+/g, "-");
                  const meta = stateMeta[key] ?? {};
                  return (
                    <SwiperSlide key={index}>
                      <div className="service-box">
                        <div className="sec_right">
                          <span>
                            {meta.image && (
                              <Image
                                src={meta.image}
                                alt={`${item.state} map`}
                                width={100}
                                height={100}
                              />
                            )}
                          </span>
                        </div>
                        <div className="sec_left">
                          <h3>{item.state}</h3>
                          <div className="info">
                            <div className="quick_linkss">
                              <p>{item.display_text.replace("caravan listings", "caravan listings")}</p>
                              <a className="view_all" href={`/listings${item.permalink}/`}>
                                View All Caravans for Sale in  {meta.code}{" "}
                                <i className="bi bi-chevron-right" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              <div className="swiper-button-next state-manu-next" />
              <div className="swiper-button-prev state-manu-prev" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
