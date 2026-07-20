import type { Metadata } from "next";
import Home from "./home";
import "../globals.css";
import { fetchSleepBands } from "@/api/homeApi/sleep/api";
import { fetchRegion } from "@/api/homeApi/region/api";
import { fetchManufactures } from "@/api/homeApi/manufacture/api";
import { fetchPriceBasedCaravans } from "@/api/homeApi/price/api";
import { fetchAtmBasedCaravans } from "@/api/homeApi/weight/api";
import { fetchLengthBasedCaravans } from "@/api/homeApi/length/api";
import { fetchUsedCaravansList } from "@/api/homeApi/usedCaravanList/api";
import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRequirements } from "@/api/postRquirements/api";


 export const metadata: Metadata = {
   title: "Caravans For Sale – Australia’s Marketplace for New & Used Caravans",
   description:
         "Browse caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
   robots: "index, follow",
   openGraph: {
     title: "Caravans For Sale – Australia’s Marketplace for New & Used Caravans",
     description:
       "Browse new & used caravans for sale across Australia. Compare prices on off-road, hybrid, pop top, touring, luxury models with size, weight & sleeping capacity.",
     // url: "https://www.caravansforsale.com.au",
     // siteName: "https://www.caravansforsale.com.au",
     // type: "product",
   },
   twitter: {
     card: "summary_large_image",
     title: "Caravans For Sale – Australia’s Marketplace for New & Used Caravans",
     description:
       "Browse new & used caravans for sale across Australia.",
   },
   alternates: {
     canonical: "https://www.caravansforsale.com.au",
   },
   verification: {
     google: "6tT6MT6AJgGromLaqvdnyyDQouJXq0VHS-7HC194xEo",
   },
 };

 export default async function Page() {
  const [
    sleepBands,
    regionBands,
    manufactureBands,
    atmBands,
    lengthBands,
    priceBands,
    usedData,
    stateBands,
     requirements,
  ] = await Promise.all([
    fetchSleepBands(),
    fetchRegion(),
    fetchManufactures(),
    fetchAtmBasedCaravans(),
    fetchLengthBasedCaravans(),
    fetchPriceBasedCaravans(),
    fetchUsedCaravansList(),
    fetchStateBasedCaravans(),
    fetchRequirements(),
  ]);
console.log("homestate", stateBands)

  return (
    <Home
      sleepBands={sleepBands}
      regionBands={regionBands}
      manufactureBands={manufactureBands}
      atmBands={atmBands}
      lengthBands={lengthBands}
      priceBands={priceBands}
      usedData={usedData}
      stateBands={stateBands}
      requirements={requirements}
    />
  );
}

