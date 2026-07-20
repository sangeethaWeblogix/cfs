"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { shouldShowBanner } from "@/utils/bannerUtils";

type FullBanner = {
  id: number;
  name: string;
  image_url: string;
  placement: string;
  banner_type: string;
  target_url: string;
  page_url: string;
  banner_size: string;
  device_target: string;
  url_match_type: "exact" | "contains";
  excluded_urls?: string;
  position: string;
};

type BannerContextType = {
  matchedBanners: FullBanner[];
  isMobile: boolean;
  currentHomeBannerIndex: number;
  isLoading: boolean;
};

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [allBanners, setAllBanners] = useState<FullBanner[]>([]);
  const [matchedBanners, setMatchedBanners] = useState<FullBanner[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [currentHomeBannerIndex, setCurrentHomeBannerIndex] = useState(0);
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllBanners() {
      try {
        setIsLoading(true);
        const cached = sessionStorage.getItem("banners_cache");
        if (cached) {
          setAllBanners(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
        const res = await fetch("/api/banners/");
        if (!res.ok) {
          setAllBanners([]);
          return;
        }
        const data = await res.json();
        const banners = Array.isArray(data) ? data : [];
        setAllBanners(banners);
      } catch (error) {
        console.error("Banner fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllBanners();
  }, []);

  useEffect(() => {
    const homeBanners = allBanners.filter((b) => b.placement === "home");
    if (homeBanners.length === 0) return;

    const stored = parseInt(localStorage.getItem("homeBannerIndex") || "-1", 10);
    const next = (stored + 1) % homeBanners.length;
    localStorage.setItem("homeBannerIndex", String(next));
    setCurrentHomeBannerIndex(next);
  }, [allBanners]);

  useEffect(() => {
    if (!pathname || allBanners.length === 0) return;

    const device = isMobile ? "mobile" : "desktop";

    const filtered = allBanners.filter((banner) => {
      if (!shouldShowBanner(pathname, banner)) return false;
      if (
        banner.device_target !== "all" &&
        banner.device_target !== device
      ) {
        return false;
      }
      return true;
    });

    setMatchedBanners(filtered);
  }, [pathname, allBanners, isMobile]);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
    };

    check();
    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <BannerContext.Provider value={{ matchedBanners, isMobile, currentHomeBannerIndex, isLoading }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanners(): BannerContextType {
  const context = useContext(BannerContext);
  if (!context) {
    return { matchedBanners: [], isMobile: false, currentHomeBannerIndex: 0, isLoading: true };
  }
  return context;
}
