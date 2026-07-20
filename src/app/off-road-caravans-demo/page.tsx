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
import { fetchHomePage } from "@/api/home/api";

const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY  = process.env.CFS_API_KEY;
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || "https://www.caravansforsale.com.au";

const wpHeaders = (): Record<string, string> => ({
  Accept: "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

async function fetchOffRoadCount(): Promise<number> {
  try {
    const res = await fetch(
      `${APP_URL}/api/pool-listings/?category=off-road&per_page=1&page=1&orderby=default&seed=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return 0;
    const json = await res.json();
    return (
      json?.data?.counts?.total_count ??
      json?.counts?.total_count ??
      json?.data?.pagination?.total_products ??
      json?.pagination?.total_products ??
      0
    );
  } catch {
    return 0;
  }
}

async function fetchOffRoadPrice(orderby: "price_asc" | "price_desc", condition?: string): Promise<number> {
  try {
    const params = new URLSearchParams({
      category: "off-road",
      orderby,
      per_page: "1",
      page: "1",
    });
    if (condition) params.set("condition", condition);
    const res = await fetch(`${API_BASE}/pool_test?${params.toString()}`, {
      headers: wpHeaders(),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const raw = await res.text();
    const jsonStart = raw.indexOf("{");
    const json = JSON.parse(jsonStart <= 0 ? raw : raw.substring(jsonStart));
    const products: any[] = json?.data?.products ?? json?.products ?? [];
    const price = products[0]?.regular_price ?? products[0]?.sale_price ?? "";
    return parseInt(String(price).replace(/[^0-9]/g, ""), 10) || 0;
  } catch {
    return 0;
  }
}

export const revalidate = 86400;

export default async function OffRoadCaravansDemoPage() {
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
    homeblog,
    offRoadCount,
    offRoadPriceMin,
    offRoadPriceMax,
    offRoadUsedPriceMin,
    offRoadUsedPriceMax,
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
    fetchHomePage(),
    fetchOffRoadCount(),
    fetchOffRoadPrice("price_asc"),
    fetchOffRoadPrice("price_desc"),
    fetchOffRoadPrice("price_asc", "used"),
    fetchOffRoadPrice("price_desc", "used"),
  ]);

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
      homeblog={homeblog?.latest_posts ?? []}
      offRoadCount={offRoadCount}
      offRoadPriceMin={offRoadPriceMin}
      offRoadPriceMax={offRoadPriceMax}
      offRoadUsedPriceMin={offRoadUsedPriceMin}
      offRoadUsedPriceMax={offRoadUsedPriceMax}
    />
  );
}
