// app/page.tsx
"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { fetchUsedBlogList } from "@/api/usedBlog/api";
import { useEffect, useState } from "react";
import { fetchUsedStateBasedCaravans } from "@/api/homeApi/usedState/api";
import { fetchSleepBands } from "@/api/homeApi/sleep/api";
import { fetchRegion } from "@/api/homeApi/region/api";
import { fetchManufactures } from "@/api/homeApi/manufacture/api";
import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
import { fetchUsedCaravansList } from "@/api/homeApi/usedCaravanList/api";
import { fetchFeaturedUsedCaravans } from "@/api/featuredCaravanList/api";
import FetauredLsit from './fetauredList'
import LatestList from './usedCaravanList'
import { fetchLatestUsedCaravans } from "@/api/usedCaravanList/api";
import { fetchCaravanList } from "@/api/caravanlist/api";

type BlogItem = {
  id: number;
  title: string;
  image: string;
  date: string;
  link: string;
  slug: string;
};

interface Item {
  label: string;
  capacity: number;
  slug: string;
  permalink: string;
  caravan_count: number;
  starting_price: number;
  display_text: string;
  state: string;
}

type CategorySection = {
  title: string;
  items: {
    label: string;
    count: string;
    
    url: string;
    display_text?: string;
    permalink?: string;
  }[];
};


type Product = {
 id: number;
  name: string;
  regular_price: string;
  sale_price: string;
  condition: string;
  location: string;
  make: string;
  model: string;
  length: string;
  kg: string;
  slug: string;
  sku: string;
};
 

const states = [
  { name: "Victoria", count: "2,726", startPrice: "$9,000", map: "/images/vic_map.svg" },
  { name: "New South Wales", count: "1,739", startPrice: "$11,990", map: "/images/nsw_map.svg" },
  { name: "Queensland", count: "1,760", startPrice: "$9,000", map: "/images/qld_map.svg" },
  { name: "Western Australia", count: "944", startPrice: "$12,990", map: "/images/wa_map.svg" },
  { name: "South Australia", count: "825", startPrice: "$4,990", map: "/images/sa_map.svg" },
  { name: "Tasmania", count: "182", startPrice: "$14,990", map: "/images/tas_map.svg" },
];

  

export default function Home() {
   const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateBands, setStateBands] = useState<Item[]>([]);
 const [sleepBands, setSleepBands] = useState<Item[]>([]);
  const [regionBands, setRegionBands] = useState<Item[]>([]);
  const [manufactureBands, setManufactureBands] = useState<Item[]>([]);
  const [lengthBands, setLengthBands] = useState<Item[]>([]);
  const [atmBands, setAtmBands] = useState<Item[]>([]);
  const [usedCategoryList, setUsedCategoryList] = useState<Item[]>([]);
  const [priceBands, setPriceBands] = useState<Item[]>([]);
  const [usedState, setUsedState] = useState<Item[]>([]);
  const [usedRegion, setUsedRegion] = useState<Item[]>([]);
    const [categoryBands, setCategoryBands] = useState<Item[]>([]);




  const [products, setProducts] = useState<Product[]>([]);
    const [latestCaravans, setLatestCaravans] = useState<Product[]>([]);

 
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchFeaturedUsedCaravans();
      setProducts(data?.products || []);
      setLoading(false);
    };

    loadData();
  }, []);

 useEffect(() => {
    const loadData = async () => {
      const data = await fetchLatestUsedCaravans();
      setLatestCaravans(data?.products || []);
      setLoading(false);
    };

    loadData();
  }, []);


    useEffect(() => {
  const loadBlogs = async () => {
    try {
      const res = await fetchUsedBlogList();
      console.log("Fetched blogs:", res);

      if (!res?.data?.latest_blog_posts?.items) {
        setBlogs([]);
        return;
      }

      setBlogs(res.data.latest_blog_posts.items);
    } catch (err) {
      console.error("Blog fetch failed:", err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  loadBlogs();
}, []);
const formatBlogDate = (dateString: string) => {
  if (!dateString) return "";

  // "2026-1-20 22.18.54" → "2026-1-20"
  const cleanDate = dateString.split(" ")[0];

  const date = new Date(cleanDate);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};
  const stateMeta = {
    "victoria": { code: "VIC", image: "/images/vic_map.svg" },
    "new-south-wales": { code: "NSW", image: "/images/nsw_map.svg" },
    "queensland": { code: "QLD", image: "/images/qld_map.svg" },
    "south-australia": { code: "SA", image: "/images/sa_map.svg" },
    "western-australia": { code: "WA", image: "/images/wa_map.svg" },
    "tasmania": { code: "TAS", image: "/images/tas_map.svg" }
  };

 
 useEffect(() => {
    async function loadAll() {
      // const [sleep, region, weight, length] = await Promise.all([
      const [sleep, region, manufactures, weight, length, price, usedData, state, caravan] =
        await Promise.all([
          fetchSleepBands(),
          fetchRegion(),
          fetchManufactures(),
          fetchAtmBasedCaravans(),
          fetchLengthBasedCaravans(),
          fetchPriceBasedCaravans(),
          fetchUsedCaravansList(),
          fetchUsedStateBasedCaravans(),
          fetchCaravanList()
          
          ,
        ]);

      setSleepBands(sleep);
      setRegionBands(region);
      setManufactureBands(manufactures);
      setAtmBands(weight);
      setLengthBands(length);
      setPriceBands(price);
      setUsedCategoryList(usedData.by_category);
      setUsedState(usedData.by_state);
      setUsedRegion(usedData.by_region);
      setStateBands(state);
      setCategoryBands(caravan);

    }

    loadAll();
  }, []);

  const categories: CategorySection[] = [
  {
    title: "Caravans For Sale By Price",
    items: priceBands.map((item) => ({
      label:  item.label,
      count: item.display_text  ,
      url: `/listings/${item.permalink}`,
    })),
  },
  {
    title: "Caravans For Sale By Weight",
    items: atmBands.map((item) => ({
     label:  item.label,
      count: item.display_text  ,
      url: `/listings/${item.permalink}`,
    })),
  },
  {
    title: "Caravans For Sale By Length",
    items: lengthBands.map((item) => ({
     label:  item.label,
      count: item.display_text  ,
      url: `/listings/${item.permalink}`,
    })),
  },
  {
    title: "Caravans For Sale By Sleeps",
    items: sleepBands.map((item) => ({
    label:  item.label,
      count: item.display_text  ,
      url: `/listings/${item.permalink}`,
    })),
  },
   {
    title: "Caravans For Sale By Type",
    items: categoryBands.map((item) => ({
    label:  item.label,
      count: item.display_text  ,
      url: `/listings/${item.permalink}`,
    })),
  },
  {
    title: "Caravans By Popular Manufacturers",
    items: manufactureBands.map((item) => ({
     label:  item.label,
      count: item.display_text  ,
      url: `/listings/${item.permalink}`,
    })),
  },
];


  return (
    <div>
      {/* Ad Banner */}
      <div className="ad_banner">
        <a href="https://www.caravansforsale.com.au/listings/">
          <div className="item-image">
            <Image
              src="/images/banner_top_dk.jpg"
              alt="off-road"
              width={1200}
              height={200}
              className="hidden-xs"
              priority
              sizes="100vw"
            />
            <Image
              src="/images/banner_top_mb.jpg"
              alt="off-road"
              width={600}
              height={300}
              className="hidden-lg hidden-md hidden-sm"
              sizes="100vw"
            />
          </div>
        </a>
      </div>

      {/* Hero / Search Requirement */}
      <div className="search_requirement_area py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="section-head search_home">
            <h3>Used caravans for sale in Australia</h3>
            <p className="mb-2 mt-3 fw-semibold">
              Find your perfect used caravan for sale in Australia from thousands of listings across the country, listed by dealers and private sellers.
            </p>
            <p>
              Whether you’re searching by price, weight, length, caravan type, sleeping capacity, manufacturer, or location, CaravansForSale.com.au makes it easy to compare options and find the right caravan for your lifestyle. Browse Australia-wide used caravan listings, explore popular categories, and access expert buying guides to help you make a confident decision.
            </p>
            <a href="/listings/used-condition/" className="btn">
              Browse Used Caravans
            </a>
          </div>
        </div>
      </div>

      {/* States Carousel */}
      <section className="caravans_by_state related-products services section-padding mt-3 style-1">
        <div className="container">
          <div className="section-head mb-4">
            <h2>Used Caravans For Sale by State</h2>
          </div>
          <div className="content">
            <div className="explore-state position-relative">
               <Swiper
                              modules={[Navigation]}
                              navigation={{
                                nextEl: ".state-manu-next",
                                prevEl: ".state-manu-prev",
                              }}
                              //autoplay={{ delay: 3000 }}
                              spaceBetween={20}
                              slidesPerView={1}
                              breakpoints={{
                                768: { slidesPerView: 2 },
                                1024: { slidesPerView: 4 },
                                 1280: { slidesPerView: 4 },
                              }}
                            >
              
                              {/* {stateBands.map((item, index) => { */}
                                {stateBands.slice(0, 5).map((item, index) => {

                                const key = item.state.toLowerCase().replace(/\s+/g, "-");
              
                                const meta = stateMeta[key] || {};
                                const stateCode = meta.code || "";
                                const mapImage = meta.image ;
              
                                return (
                                  <SwiperSlide key={index}>
              
                                    <div className="service-box">
              
                                      <div className="sec_left">
                                        <h5>
                                          {item.state}
                                        </h5>
              
                                        <div className="info">
                                          <div className="quick_linkss">
                                            {/* ✔ API BASED DISPLAY TEXT */}
                                            <p>{item.display_text}</p>
              
                                            <a className="view_all" href={`/listings/${item.permalink}`}>
                                              View All 
              
                                            </a>
                                          </div>
                                        </div>
                                      </div>
              
                                      <div className="sec_right">
                                        <span>
                                          {mapImage ? (

                                          <Image
                                            src={mapImage}
                                            alt={`${item.state} map`}
                                            width={100}
                                            height={100}
                                          />
                                          ) : null}
                                        </span>
                                      </div>
                                    </div>
              
                                  </SwiperSlide>
                                );
                              })}
              
                            </Swiper>

              <div className="swiper-button-next state-manu-next"></div>
              <div className="swiper-button-prev state-manu-prev"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Regions */}
      <section className="caravans_by_state related-products services section-padding pt-0 style-1">
        <div className="container">
          <div className="section-head mb-4">
            <h2>Used Caravans For Sale by Region</h2>
            <hr className="mb-6" />
          </div>
          <div className="content listing_region">
            <ul>
              {regionBands.map((r, i) => (
                <li key={i} >
                  <a                               
                    href={`https://www.caravansforsale.com.au/listings/${r.permalink}/`}
 className="font-medium text-blue-600">
                   {r.label}
                  </a>
                  <span className="block mt-1 text-sm text-gray-600">
                    {r.display_text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Popular Searches Grid */}
      <section className="shop-used-caravans py-12" style={{ background: "#fcfcfc", borderTop: "1px solid #ddd", borderBottom: "1px solid #ddd" }}>
        <div className="container">
          <h2>Browse Caravans by Popular Searches</h2>

          <div className="shop-grid">
            {categories.map((cat, i) => (
              <div key={i} className="shop-card">
                <h3>{cat.title}</h3>
                <ul>
                  {(cat.items || []).map((item, j) => (
                    <li key={j}>
                      <a href={item.url}>
                        {item.label} <span>({item.count})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Featured Caravans */}
      <section className="caravans_by_state related-products services section-padding style-1">
        <div className="container">
          <div className="section-head mb-4">
            <h2>Featured Used Caravans For Sale</h2>
          </div>
          <div className="content">
            <div className="explore-state position-relative">
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                  1280: { slidesPerView: 4 },
                }}
                navigation={{
                  nextEl: ".featured-next",
                  prevEl: ".featured-prev",
                }}
              >
                {products.map((caravan, i) => (
                  <SwiperSlide key={i}>
                   <FetauredLsit key={caravan.id} caravan={caravan} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="swiper-button-next featured-next"></div>
              <div className="swiper-button-prev featured-prev"></div>

            </div>
          </div>

          {/* Sell Banner */}
          <div className="banner_sell_caravan">
            <Image
              src="/images/sell-banner.jpg"
              alt="Sell Your Caravan Banner"
              fill
              className="bgImg"
            />
            <div className="overlay"></div>
            <div className="content">
              <h2 className="title">Sell Your Caravan Today!</h2>
              <p className="desc">
                Reach thousands of potential buyers in minutes.<br />
                List your caravan for sale on CaravansForSale.com.au,<br />
                the trusted marketplace for Aussie caravan owners.
              </p>
              {/* <a href="#" className="btn">
                SELL YOUR CARAVAN
              </a> */}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Caravans */}
      <section className="caravans_by_state related-products services section-padding style-1">
        <div className="container">
          <div className="section-head mb-4">
            <h2>Latest Used Caravans For Sale</h2>
          </div>
          <div className="content">
            <div className="explore-state position-relative">
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                  1280: { slidesPerView: 4 },
                }}
                navigation={{
                  nextEl: ".latest-next",
                  prevEl: ".latest-prev",
                }}
              >
                {latestCaravans.map((car, i) => (
                  <SwiperSlide key={i}>
                    <LatestList caravan={car} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="swiper-button-next latest-next"></div>
              <div className="swiper-button-prev latest-prev"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blogs */}
      <section className="related-products latest_blog section-padding blog style-8">
        <div className="container">
          <div className="title">
            <div className="tpof_tab">
              <h3>Latest Blogs on Used Caravans</h3>
              <a href="/blog">
                View All <i className="bi bi-chevron-right"></i>
              </a>
            </div>
          </div>
          <div className="content">
             {loading ? (
        <p>Loading blogs...</p>
      ) : (
            <Swiper
              modules={[Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              navigation={{
                nextEl: ".blog-next",
                prevEl: ".blog-prev",
              }}
            >
              {blogs.map((blog, i) => (
                <SwiperSlide key={i}>
                      <a href={`/${blog.slug}`}>
                  <div className="side-posts">
                    <div className="item">
                      <div className="img img-cover">
                        <Image src={blog.image} alt={blog.title} width={300} height={200} className="object-cover" />
                      </div>
                      <div className="info">
                        <h4 className="title">
                             {blog.title}
                         </h4>
                        <div className="date-author">{formatBlogDate(blog.date)}</div>
                      </div>
                    </div>
                  </div>
                    </a>
                </SwiperSlide>
              ))}
            </Swiper>
 )}

            <div className="swiper-button-next blog-next"></div>
            <div className="swiper-button-prev blog-prev"></div>
          </div>
        </div>
      </section>
    </div>
  );
}