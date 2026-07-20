"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import SearchSection from "../searchSection";
import "./main.css?=24";

const Manufactures = dynamic(() => import("../manufacture"), { ssr: false });
const BlogSection = dynamic(() => import("../blogSection"), { ssr: false });

interface Item {
  label: string;
  capacity: number;
  slug: string;
  permalink: string;
  caravan_count: string;
  starting_price: number;
  display_text: string;
  state: string;
  short_label: string;
  short_count: string;
  region: string;
}

interface Props {
  sleepBands: Item[];
  regionBands: Item[];
  manufactureBands: Item[];
  atmBands: Item[];
  lengthBands: Item[];
  priceBands: Item[];
  usedData: { by_category: Item[]; by_state: Item[]; by_region: Item[] };
  stateBands: Item[];
  requirements: any;
}
/* --------------------------------- Page ---------------------------------- */
export default function HomePage({
  sleepBands,
  regionBands,
  manufactureBands,
  atmBands,
  lengthBands,
  priceBands,
  usedData,
  stateBands,
  requirements,
}: Props) {
  const [usedCategoryList, setUsedCategoryList] = useState<Item[]>([]);
  const [usedState, setUsedState] = useState<Item[]>([]);
  const [usedRegion, setUsedRegion] = useState<Item[]>([]);
  const [adIndex, setAdIndex] = useState<number>(0);

  const bannerSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedIndex = Number.parseInt(
      localStorage.getItem("ad_index") || "0",
      10,
    );
    setAdIndex(Number.isFinite(storedIndex) ? storedIndex : 0);

    const container = bannerSectionRef.current;
    if (container) {
      const items = container.querySelectorAll<HTMLElement>(".items");
      const safeIndex =
        items.length > 0 ? Math.min(storedIndex, items.length - 1) : 0;

      items.forEach((item, i) => {
        item.style.display = i === safeIndex ? "block" : "none";
      });

      const modulo = items.length || 4;
      const next = (safeIndex + 1) % modulo;
      localStorage.setItem("ad_index", String(next));
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="home_top style-1">
        <SearchSection
          sleepBands={sleepBands}
          regionBands={regionBands}
          manufactureBands={manufactureBands}
          atmBands={atmBands}
          lengthBands={lengthBands}
          priceBands={priceBands}
          usedData={usedData}
          requirements={requirements}
          stateBands={stateBands}
        />
      </section>

      {/* Deal of the Month Section */}
      {/*}<section className="deal-of-month product-details section-padding">
            <FeaturedSection />
          </section> */}
      {/*<section className="post-requirements product-details section-padding">
          <PostRequirement />
        </section> */}

      {/* Caravans by Manufacturer Section */}
      <section className="caravans_by_manufacturer related-products section-padding">
        <Manufactures />
      </section>

      {/* Latest Blog Section */}
      <BlogSection />
    </div>
  );
}
