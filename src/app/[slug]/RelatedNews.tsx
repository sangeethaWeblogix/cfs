"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import Link from "next/link";
import { toSlug } from "@/utils/seo/slug";

type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image?: string;
  imageAlt?: string;
  slug?: string;
};

export default function RelatedNews({ blogs }: { blogs: BlogPost[] }) {
  if (!blogs || blogs.length === 0) return null;
  // console.log("dataablog", blogs);
  const getHref = (p: BlogPost) => {
    const slug = (p.slug ?? "").trim() || toSlug(p.title ?? "");
    return slug ? `/${slug}/` : "#";
  };

  return (
    <div
      className="related-products latest_blog section-padding"
      style={{ position: "relative", zIndex: 0, background: "#f1f1f1" }}
    >
      <div className="container">
        {/* Title */}
        <div className="title">
          <div className="tpof_tab">
            <h2 className="hd-section-title">Related Blogs</h2>
          </div>
        </div>

        {/* Swiper Slider */}
        <div className="related-products-slider position-relative mt-6">
          <Swiper
            modules={[Navigation]}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            }}
            spaceBetween={24}
            slidesPerView={4}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
          >
            {blogs.map((post, index) => {
              const href = getHref(post);
              return (
                <SwiperSlide key={index}>
                    <Link href={href}>
                      <div className="product-card">
                        <div className="img">
                          <Image
                            src={post.image || "/default.jpg"}
                            alt={post.imageAlt || post.title}
                            fill
                            className=""
                          />
                        </div>
                        <div className="product_de">
                          <div className="info">
                            <h5 className="title">{post.title}</h5>
                            <p>{post.excerpt}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Navigation buttons */}
          <div className="swiper-button-next"></div>
          <div className="swiper-button-prev"></div>
        </div>
      </div>
    </div>
  );
}
