"use client";
import "../filter.css?=27";
import { useState, useEffect, useRef } from "react";
import { fetchProductList } from "@/api/productList/api";
import { fetchMakeDetails } from "@/api/make-new/api";
import CategorySkeleton from "./CategorySkeleton";
import { buildSlugFromFilters } from "../slugBuilter";
import { useRouter } from "next/navigation";
import { fetchLocations } from "@/api/location/api";

type LocationSuggestion = {
  key: string;
  uri: string;
  address: string;
  short_address: string;
  postcode?: string | number;
};
interface CategoryCount {
  name: string;
  slug: string;
  count: number;
}
  export interface Category {
    name: string;
    slug: string;
  }

 

type ProductListResponse = {
  data: {
    all_categories: Category[];
    states: StateOption[];
    
  };
};
interface StateOption {
  value: string;
  name: string;
  regions?: {
    name: string;
    value: string;
  }[];
}



interface Filters {
  category?: string;
  make?: string;
  model?: string;
  state?: string;
  region?: string;
  suburb?: string;
  pincode?: string;
  from_price?: string | number;
  to_price?: string | number;
  minKg?: string | number;
  maxKg?: string | number;
  condition?: string;
  from_length?: string | number;
  to_length?: string | number;
  from_sleep?: string | number;
  to_sleep?: string | number;
  acustom_fromyears?: string | number;
  acustom_toyears?: string | number;
  search?: string;
  keyword?: string;
  [key: string]: any;
}

interface FilterSliderProps {
  setIsLoading?: (val: boolean) => void;
  setIsMainLoading?: (val: boolean) => void;
  setIsFeaturedLoading?: (val: boolean) => void;
  setIsPremiumLoading?: (val: boolean) => void;
  currentFilters: Filters;
  categoryCounts: CategoryCount[];
  isCategoryCountLoading?: boolean;
  stateOptions?: StateOption[];
  onCategorySelect: (slug: string | null) => void;
  onMakeSelect?: (make: string | null, model: string | null) => void;
  onLocationSelect: (state: string | null, region: string | null) => void;
  onOpenModal?: (section?: string) => void;
  onPriceSelect?: (from: number | null, to: number | null) => void;
  onAtmSelect?: (min: number | null, max: number | null) => void;
  onFilterChange?: (filters: Filters) => void;
  productListData?: ProductListResponse;
  initialMakeOptions?: { name: string; slug: string }[];
}

// ── FilterModal-போல் buildCountParams helper ──
const buildMakeCountParams = (filters: Filters): URLSearchParams => {
  const params = new URLSearchParams();

  // make & model exclude பண்ணு (make count-க்கு)
  if (filters.category) params.set("category", filters.category);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.state && typeof filters.state === "string")
    params.set("state", filters.state.toLowerCase());
  if (filters.region) params.set("region", filters.region);
  if (filters.suburb) params.set("suburb", filters.suburb);
  if (filters.pincode) params.set("pincode", filters.pincode);
  if (filters.from_price) params.set("from_price", String(filters.from_price));
  if (filters.to_price) params.set("to_price", String(filters.to_price));
  if (filters.minKg) params.set("from_atm", String(filters.minKg));
  if (filters.maxKg) params.set("to_atm", String(filters.maxKg));
  if (filters.acustom_fromyears)
    params.set("acustom_fromyears", String(filters.acustom_fromyears));
  if (filters.acustom_toyears)
    params.set("acustom_toyears", String(filters.acustom_toyears));
  if (filters.from_length)
    params.set("from_length", String(filters.from_length));
  if (filters.to_length) params.set("to_length", String(filters.to_length));
  if (filters.from_sleep) params.set("from_sleep", String(filters.from_sleep));
  if (filters.to_sleep) params.set("to_sleep", String(filters.to_sleep));
  if (filters.search) params.set("search", filters.search);
  if (filters.keyword) params.set("keyword", filters.keyword);

  params.set("group_by", "make");
  return params;
};

const PRICE_OPTIONS = [
  10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000,
  125000, 150000, 175000, 200000, 225000, 250000, 275000, 300000,
];
const ATM_OPTIONS = [
  600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
  4500,
];
const SLEEP_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const LENGTH_OPTIONS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
const YEAR_OPTIONS = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
  2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2000, 1975,
];

const FilterSlider = ({
  currentFilters,
  categoryCounts,
  isCategoryCountLoading,
  stateOptions: propStateOptions = [],
  onCategorySelect,
  onLocationSelect,
  onOpenModal,
  onPriceSelect,
  onAtmSelect,
  onMakeSelect,
  onFilterChange,
  setIsLoading,
  setIsMainLoading,
  setIsFeaturedLoading,
  setIsPremiumLoading,
  productListData,
  initialMakeOptions,
}: FilterSliderProps) => {
const [states, setStates] = useState<StateOption[]>(
  productListData?.data?.states || []
);  const router = useRouter();
  const RADIUS_OPTIONS = [25, 50, 100, 250, 500, 1000] as const;
  const [tempSuburbRadius, setTempSuburbRadius] = useState<number>(
    RADIUS_OPTIONS[0],
  );
  const [tempSuburbSuggestion, setTempSuburbSuggestion] =
    useState<LocationSuggestion | null>(null);
  const [tempSuburbInput, setTempSuburbInput] = useState("");
  const [suburbLocationSuggestions, setSuburbLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [showSuburbSuggestions, setShowSuburbSuggestions] = useState(false);
  const [suburbLocLoading, setSuburbLocLoading] = useState(false);
  const [tempRegionRaw, setTempRegionRaw] = useState<string | null>(null);
  const [removingChip, setRemovingChip] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => { setRemovingChip(null); setClearingAll(false); }, [currentFilters]);

  // ── Make & Model states ──
  const [makes, setMakes] = useState<
    { name: string; slug: string; models?: { name: string; slug: string }[] }[]
  >(initialMakeOptions ?? []);
  const [makeCounts, setMakeCounts] = useState<
    { name: string; slug: string; count: number }[]
  >([]);
  const [tempMake, setTempMake] = useState<string | null>(null);
  const [tempModel, setTempModel] = useState<string | null>(null);
  const [makeSearch, setMakeSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [makeSubView, setMakeSubView] = useState<"makes" | "models">("makes");
  const [makeLoading, setMakeLoading] = useState(false);
  const [lastModelName, setLastModelName] = useState<string | null>(null);

  // ── 1. modelCounts state add பண்ணு (makeCounts state-க்கு கீழே) ──
  const [modelCounts, setModelCounts] = useState<
    { name: string; slug: string; count: number }[]
  >([]);

  const [modelCountLoading, setModelCountLoading] = useState(false);

  const didFetchMakeRef = useRef(false);

  // ✅ make-details API la make & model rendu um oru sethuvom, click pannum bothu
  // athukulla irukura models ah nேrடா show pannalam (old initialMakeOptions-la models illa)
  // useEffect(() => {
  //   if (didFetchMakeRef.current) return;
  //   didFetchMakeRef.current = true;
  //   fetchMakeDetails().then((list) => {
  //     if (Array.isArray(list) && list.length) setMakes(list);
  //   });
  // }, []);

  const suburbReqIdRef = useRef(0);
  const suburbDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toTitleCase = (str: string): string =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());


 

  useEffect(() => {
    if (!tempMake) { setModelCounts([]); return; }
    const controller = new AbortController();
    setModelCountLoading(true);
    // Use only make + group_by=model — matches what the KV warmer pre-warms.
    // Including category or other filters causes a KV miss every time (warmer
    // only covers {make, group_by=model}) and WP returns empty for that combo.
    const params = new URLSearchParams();
    params.set("make", tempMake);
    params.set("group_by", "model");
    fetch(`/api/params-count/?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (!controller.signal.aborted) {
          const data = json.data || [];
          setModelCounts(data);
          setModelCountLoading(false);
          const matched = data.find((m: any) => m.slug === currentFilters.model);
          if (matched) setLastModelName(matched.name);
        }
      })
      .catch((e) => { if (e.name !== "AbortError") { console.error(e); setModelCountLoading(false); } });
    return () => controller.abort();
  }, [tempMake]);

  const availableModels = makes.find((m) => m.slug === tempMake)?.models ?? [];

  const makeSource = (() => {
    const raw = makeCounts.length > 0
      ? makeCounts
      : makes.map((m) => ({ name: m.name, slug: m.slug, count: 0 }));
    // Deduplicate by slug (WP taxonomy can register the same make twice)
    const seen = new Set<string>();
    return raw.filter((m) => {
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    });
  })();
  const filteredMakes = makeSearch
    ? makeSource.filter((m) => m.name.toLowerCase().includes(makeSearch.toLowerCase()))
    : makeSource;

  const modelSource = modelCounts.length > 0
    ? modelCounts
    : availableModels.map((m) => ({ name: m.name, slug: m.slug, count: 0 }));
  const filteredModels = modelSearch
    ? modelSource.filter((m) => m.name.toLowerCase().includes(modelSearch.toLowerCase()))
    : modelSource;

  // ── FIXED: FilterModal-போல் full filter params use பண்ணி make count fetch ──
  useEffect(() => {
    const controller = new AbortController();
    const params = buildMakeCountParams(currentFilters);
    fetch(`/api/params-count/?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => { if (!controller.signal.aborted) setMakeCounts(json.data || []); })
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });
    return () => controller.abort();
  }, [
    currentFilters.category, currentFilters.condition, currentFilters.state, currentFilters.region,
    currentFilters.suburb, currentFilters.pincode, currentFilters.from_price, currentFilters.to_price,
    currentFilters.minKg, currentFilters.maxKg, currentFilters.acustom_fromyears, currentFilters.acustom_toyears,
    currentFilters.from_length, currentFilters.to_length, currentFilters.from_sleep, currentFilters.to_sleep,
    currentFilters.search, currentFilters.keyword,
  ]);

  // ── Make & Model handlers ──

  // ── handleMakeOpen — validate பண்ணாம directly set பண்ணு ──
  const handleMakeOpen = () => {
    const currentMake = currentFilters.make ?? null;
    const currentModel = currentFilters.model ?? null;

    setTempMake(currentMake);
    setTempModel(currentModel);
    setMakeSearch("");
    setModelSearch("");
    setMakeSubView(currentMake ? "makes" : "makes");
    setOpenModal("make");
  };

  const handleModelViewOpen = (makeSlug?: string) => {
    const target = makeSlug ?? tempMake;
    if (!target) return;
    if (makeSlug && makeSlug !== tempMake) {
      setTempMake(makeSlug);
      setTempModel(null);
    }
    setModelSearch("");
    setMakeSubView("models");
  };
  const handleMakeSearch = () => {
    delete localOverrideRef.current.make;
    delete localOverrideRef.current.model;
    const newFilters = { ...currentFilters, make: tempMake ?? undefined, model: tempModel ?? undefined, page: 1 };
    updateFiltersAndURL(newFilters);
    setOpenModal(null);
  };
  const handleMakeClear = () => {
    setTempMake(null);
    setTempModel(null);

    updateFiltersAndURL({
      make: undefined,
      model: undefined,
    });

    setOpenModal(null);
  };
  // ── Price & ATM temp states ──
  const [tempPriceFrom, setTempPriceFrom] = useState<number | null>(null);
  const [tempPriceTo, setTempPriceTo] = useState<number | null>(null);
  const [tempAtmFrom, setTempAtmFrom] = useState<number | null>(null);
  const [tempAtmTo, setTempAtmTo] = useState<number | null>(null);
  const [tempCondition, setTempCondition] = useState<string | null>(null);
  const [tempSleepFrom, setTempSleepFrom] = useState<number | null>(null);
  const [tempSleepTo, setTempSleepTo] = useState<number | null>(null);
  const [tempLengthFrom, setTempLengthFrom] = useState<number | null>(null);
  const [tempLengthTo, setTempLengthTo] = useState<number | null>(null);
  const [tempYearFrom, setTempYearFrom] = useState<number | null>(null);
  const [tempYearTo, setTempYearTo] = useState<number | null>(null);
  const [tempKeyword, setTempKeyword] = useState<string>("");
  const [openModal, setOpenModal] = useState<
    | "type"
    | "location"
    | "price"
    | "atm"
    | "make"
    | "suburb"
    | "condition"
    | "sleep"
    | "year"
    | "length"
    | "keyword"
    | null
  >(null);

  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [openModal]);

  // condition handlers

  // ── Condition handlers ──
  const handleConditionOpen = () => {
  setTempCondition(currentFilters.condition?.toLowerCase() ?? null);
    setOpenModal("condition");
  };
  console.log("connnn", tempCondition)

  const handleConditionSearch = () => {
    updateFiltersAndURL({ condition: tempCondition ?? undefined });
    setOpenModal(null);
  };

  const handleConditionClear = () => {
    setTempCondition(null);
    updateFiltersAndURL({ condition: undefined });
    setOpenModal(null);
  };
  // ── Price handlers ──
  const handlePriceOpen = () => {
    const f = getEffectiveFilters();

    setTempPriceFrom(
      currentFilters.from_price ? Number(currentFilters.from_price) : null,
    );
    setTempPriceTo(
      currentFilters.to_price ? Number(currentFilters.to_price) : null,
    );
    setOpenModal("price");
  };
  const handlePriceSearch = () => {
    delete localOverrideRef.current.from_price;
    delete localOverrideRef.current.to_price;
    updateFiltersAndURL({ from_price: tempPriceFrom ?? undefined, to_price: tempPriceTo ?? undefined });
    setOpenModal(null);
  };
  const handlePriceClear = () => {
    setTempPriceFrom(null);
    setTempPriceTo(null);

    updateFiltersAndURL({
      from_price: undefined,
      to_price: undefined,
    });

    setOpenModal(null);
  };

  // ── ATM handlers ──
  const handleAtmOpen = () => {
    const f = getEffectiveFilters();
    setTempAtmFrom(f.minKg ? Number(f.minKg) : null);
    setTempAtmTo(f.maxKg ? Number(f.maxKg) : null);
    setOpenModal("atm");
  };
  const handleAtmSearch = () => {
    delete localOverrideRef.current.minKg;
    delete localOverrideRef.current.maxKg;
    updateFiltersAndURL({ minKg: tempAtmFrom ?? undefined, maxKg: tempAtmTo ?? undefined });
    setOpenModal(null);
  };
  const handleAtmClear = () => {
    setTempAtmFrom(null);
    setTempAtmTo(null);

    updateFiltersAndURL({
      minKg: undefined,
      maxKg: undefined,
    });

    setOpenModal(null);
  };

  const handleSleepOpen = () => {
    const f = getEffectiveFilters();
    setTempSleepFrom(f.from_sleep ? Number(f.from_sleep) : null);
    setTempSleepTo(f.to_sleep ? Number(f.to_sleep) : null);
    setOpenModal("sleep");
  };
  const handleSleepSearch = () => {
    updateFiltersAndURL({ from_sleep: tempSleepFrom ?? undefined, to_sleep: tempSleepTo ?? undefined });
    setOpenModal(null);
  };
  const handleSleepClear = () => {
    setTempSleepFrom(null);
    setTempSleepTo(null);
    updateFiltersAndURL({ from_sleep: undefined, to_sleep: undefined });
    setOpenModal(null);
  };

  const handleLengthOpen = () => {
    const f = getEffectiveFilters();
    setTempLengthFrom(f.from_length ? Number(f.from_length) : null);
    setTempLengthTo(f.to_length ? Number(f.to_length) : null);
    setOpenModal("length");
  };
  const handleLengthSearch = () => {
    updateFiltersAndURL({ from_length: tempLengthFrom ?? undefined, to_length: tempLengthTo ?? undefined });
    setOpenModal(null);
  };
  const handleLengthClear = () => {
    setTempLengthFrom(null);
    setTempLengthTo(null);
    updateFiltersAndURL({ from_length: undefined, to_length: undefined });
    setOpenModal(null);
  };

  const handleYearOpen = () => {
    const f = getEffectiveFilters();
    setTempYearFrom(f.acustom_fromyears ? Number(f.acustom_fromyears) : null);
    setTempYearTo(f.acustom_toyears ? Number(f.acustom_toyears) : null);
    setOpenModal("year");
  };
  const handleYearSearch = () => {
    updateFiltersAndURL({ acustom_fromyears: tempYearFrom ?? undefined, acustom_toyears: tempYearTo ?? undefined });
    setOpenModal(null);
  };
  const handleYearClear = () => {
    setTempYearFrom(null);
    setTempYearTo(null);
    updateFiltersAndURL({ acustom_fromyears: undefined, acustom_toyears: undefined });
    setOpenModal(null);
  };

  const handleKeywordOpen = () => {
    setTempKeyword(getEffectiveFilters().keyword ?? "");
    setOpenModal("keyword");
  };
  const handleKeywordSearch = () => {
    updateFiltersAndURL({ keyword: tempKeyword.trim() || undefined });
    setOpenModal(null);
  };
  const handleKeywordClear = () => {
    setTempKeyword("");
    updateFiltersAndURL({ keyword: undefined });
    setOpenModal(null);
  };

  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempState, setTempState] = useState<string | null>(null);
  const [tempRegion, setTempRegion] = useState<string | null>(null);
  const [locationSubView, setLocationSubView] = useState<"states" | "regions">("states");
  const [stateCounts, setStateCounts] = useState<{name: string; slug: string; count: number}[]>([]);
  const [regionCounts, setRegionCounts] = useState<{name: string; slug: string; count: number}[]>([]);
  const [stateCountsLoading, setStateCountsLoading] = useState(false);
  const [regionCountsLoading, setRegionCountsLoading] = useState(false);
  const updateFiltersAndURL = (updates: Partial<Filters>) => {
    const newFilters = { ...currentFilters, ...updates, page: 1 };
    if (onFilterChange) {
      // Pass with undefined values intact — handleSliderFilterSelect uses them to delete keys
      onFilterChange(newFilters as Filters);
    } else {
      Object.keys(newFilters).forEach((k) => {
        if (newFilters[k] === undefined || newFilters[k] === null) delete newFilters[k];
      });
      const slugPath = buildSlugFromFilters(newFilters);
      router.push(slugPath.endsWith("/") ? slugPath : `${slugPath}/`);
    }
  };

  const removeChip = (key: string, updates: Partial<Filters>) => {
    setRemovingChip(key);
    updateFiltersAndURL(updates);
  };

  const handleClearAll = () => {
    setClearingAll(true);
    // Clear every key currently set, same pattern as removeChip — routed
    // through onFilterChange so it goes through the normal client-side
    // filter/URL update path instead of a hard reload.
    const cleared = Object.fromEntries(
      Object.keys(currentFilters).map((key) => [key, undefined])
    ) as Partial<Filters>;
    updateFiltersAndURL(cleared);
  };
  const handleTypeOpen = () => {
    const f = getEffectiveFilters();
    setTempCategory(f.category ?? null);
    setOpenModal("type");
  };
  const handleTypeSearch = () => {
    updateFiltersAndURL({
      category: tempCategory ?? undefined,
    });

    setOpenModal(null);
  };
  const handleTypeClear = () => {
    setTempCategory(null);

    updateFiltersAndURL({
      category: undefined,
    });

    setOpenModal(null);
  };
  const formatLocationInput = (s: string) =>
    s
      .replace(/_/g, " ")
      .replace(/\s*-\s*/g, "  ")
      .replace(/\s{3,}/g, "  ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatted = (s: string) => s.replace(/ - /g, "  ").replace(/\s+/g, " ");

  const getValidRegionName = (
    stateName: string | null | undefined,
    regionName: string | null | undefined,
    allStates: StateOption[],
  ): string | undefined => {
    if (!stateName || !regionName) return undefined;
    const st = allStates.find(
      (s) =>
        s.name.toLowerCase() === stateName.toLowerCase() ||
        s.value.toLowerCase() === stateName.toLowerCase(),
    );
    if (!st?.regions?.length) return undefined;
    const reg = st.regions.find(
      (r) =>
        r.name.toLowerCase() === regionName.toLowerCase() ||
        r.value.toLowerCase() === regionName.toLowerCase(),
    );
    return reg?.name;
  };
  const handleLocationOpen = () => {
    const f = getEffectiveFilters();

    const matchedState = states.find(
      (s) =>
        s.name?.toLowerCase() === (f.state ?? "").toLowerCase() ||
        s.value?.toLowerCase() === (f.state ?? "").toLowerCase(),
    );

    setTempState(matchedState?.name ?? f.state ?? null);

    const matchedRegion = matchedState?.regions?.find(
      (r) =>
        r.name?.toLowerCase() === (f.region ?? "").toLowerCase() ||
        r.value?.toLowerCase() === (f.region ?? "").toLowerCase(),
    );

    if (matchedRegion) {
      setTempRegion(matchedRegion.name);
      setTempRegionRaw(null);
    } else if (f.region) {
      setTempRegion(null);
      setTempRegionRaw(f.region);
    } else {
      setTempRegion(null);
      setTempRegionRaw(null);
    }

    // Init suburb temp state
    if (f.suburb && f.state) {
      const shortAddr = [
        toTitleCase(f.suburb),
        AUS_ABBR[f.state?.toUpperCase() ?? ""] ?? f.state?.toUpperCase() ?? "",
        f.pincode,
      ].filter(Boolean).join(" ");
      const fullAddr = [
        toTitleCase(f.suburb),
        f.state.replace(/\b\w/g, (c) => c.toUpperCase()),
        f.pincode,
      ].filter(Boolean).join(" ");
      const stateSlug = f.state.toLowerCase().replace(/\s+/g, "-") + "-state";
      const regionSlug = f.region
        ? f.region.toLowerCase().replace(/\s+/g, "-") + "-region"
        : "unknown-region";
      const suburbSlug = f.suburb.toLowerCase().replace(/\s+/g, "-") + "-suburb";
      const uri = [stateSlug, regionSlug, suburbSlug, f.pincode].filter(Boolean).join("/");
      setTempSuburbSuggestion({ key: "hydrated", uri, address: fullAddr, short_address: shortAddr });
      setTempSuburbInput("");
    } else {
      setTempSuburbInput("");
      setTempSuburbSuggestion(null);
    }
    setSuburbLocationSuggestions([]);
    setShowSuburbSuggestions(false);
    setTempSuburbRadius(f.radius_kms ? Number(f.radius_kms) : RADIUS_OPTIONS[0]);
    setLocationSubView("states");

    // Fetch state counts
    setStateCountsLoading(true);
    const stateParams = new URLSearchParams({ group_by: "state" });
    if (currentFilters.category) stateParams.set("category", currentFilters.category);
    fetch(`/api/params-count/?${stateParams}`)
      .then((r) => r.json())
      .then((json) => { setStateCounts(json.data ?? []); setStateCountsLoading(false); })
      .catch(() => setStateCountsLoading(false));

    setOpenModal("location");
  };
  const handleLocationSearch = () => {
    updateFiltersAndURL({
      state: tempState?.toLowerCase() ?? undefined,
      region: tempRegion?.toLowerCase() ?? tempRegionRaw?.toLowerCase() ?? undefined,
      suburb: undefined,
      pincode: undefined,
    });
    setOpenModal(null);
  };
  const handleRegionViewOpen = (stateName?: string) => {
    const target = stateName ?? tempState;
    if (!target) return;
    if (stateName) {
      setTempState(stateName);
      // Only clear region when switching to a different state
      if (stateName.toLowerCase() !== (tempState ?? "").toLowerCase()) {
        setTempRegion(null);
      }
    }
    setLocationSubView("regions");
    setRegionCountsLoading(true);
    const params = new URLSearchParams({ group_by: "region", state: target.toLowerCase() });
    if (currentFilters.category) params.set("category", currentFilters.category);
    fetch(`/api/params-count/?${params}`)
      .then((r) => r.json())
      .then((json) => { setRegionCounts(json.data ?? []); setRegionCountsLoading(false); })
      .catch(() => setRegionCountsLoading(false));
  };

  const handleLocationClear = () => {
    setTempState(null);
    setTempRegion(null);
    setTempRegionRaw(null);
    setTempSuburbInput("");
    setTempSuburbSuggestion(null);
    updateFiltersAndURL({
      state: undefined,
      region: undefined,
      suburb: undefined,
      pincode: undefined,
      radius_kms: undefined,
    });
    setOpenModal(null);
  };

  const filteredRegions =
    states.find((s) => s.name.toLowerCase() === tempState?.toLowerCase())
      ?.regions ?? [];

  const hasTypeChange = tempCategory !== (currentFilters.category ?? null);
  const hasLocationChange =
    (tempState?.toLowerCase() ?? null) !==
      (currentFilters.state?.toLowerCase() ?? null) ||
    (tempRegion?.toLowerCase() ?? null) !==
      (currentFilters.region?.toLowerCase() ?? null);
  const closeBtn = (
    <button className="filter-close" onClick={() => setOpenModal(null)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 64 64"
      >
        <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
      </svg>
    </button>
  );
  const localOverrideRef = useRef<Partial<Filters>>({});

  // ── Helper: currentFilters + local override merge பண்ணு ──
  const getEffectiveFilters = () => {
    const merged = { ...currentFilters };
    // localOverrideRef-ல் உள்ள keys loop பண்ணி explicitly override பண்ணு
    for (const key of Object.keys(localOverrideRef.current)) {
      const val = localOverrideRef.current[key];
      if (val === null || val === undefined) {
        delete merged[key]; // ✅ null/undefined ஆனா key-ஐயே remove பண்ணு
      } else {
        merged[key] = val;
      }
    }
    return merged;
  };

  // ── In FilterSlider component, add this ref near the top (after useState declarations) ──

  const cachedCategoryCountsRef = useRef<CategoryCount[]>([]);

  // Update cache whenever we get real data
  useEffect(() => {
    if (categoryCounts.length > 0) {
      cachedCategoryCountsRef.current = categoryCounts;
    }
  }, [categoryCounts]);

  // utils/formatSuburb.ts (or wherever suburb label is formatted)

  const AUS_ABBR: Record<string, string> = {
    VICTORIA: "VIC",
    "NEW SOUTH WALES": "NSW",
    QUEENSLAND: "QLD",
    "SOUTH AUSTRALIA": "SA",
    "WESTERN AUSTRALIA": "WA",
    TASMANIA: "TAS",
    "NORTHERN TERRITORY": "NT",
    "AUSTRALIAN CAPITAL TERRITORY": "ACT",
  };

  return (
    <>
      <div className="filter-row">
        <div className="slider-wrapper">
          <div className="filter-swiper">
            <button
              className={`tag ${currentFilters.category ? "active" : ""}`}
              onClick={handleTypeOpen}
            >
              Caravan Type
              {currentFilters.category && (
                <span className="active_filter">
                  <i className="bi bi-circle-fill"></i>
                </span>
              )}
            </button>

            <button
              className={`tag ${currentFilters.state || currentFilters.region || currentFilters.suburb ? "active" : ""}`}
              onClick={handleLocationOpen}
            >
              Location
              {(currentFilters.state || currentFilters.region || currentFilters.suburb) && (
                <span className="active_filter">
                  <i className="bi bi-circle-fill"></i>
                </span>
              )}
            </button>

            <button
              className={`tag ${currentFilters.condition ? "active" : ""}`}
              onClick={handleConditionOpen}
            >
              Condition
              {currentFilters.condition && (
                <span className="active_filter">
                  <i className="bi bi-circle-fill"></i>
                </span>
              )}
            </button>

            <button
              className={`tag ${currentFilters.make ? "active" : ""}`}
              onClick={handleMakeOpen}
            >
              Make
              {currentFilters.make && (
                <span className="active_filter">
                  <i className="bi bi-circle-fill"></i>
                </span>
              )}
            </button>

            <button
              className={`tag ${currentFilters.from_price || currentFilters.to_price ? "active" : ""}`}
              onClick={handlePriceOpen}
            >
              Price
              {(currentFilters.from_price || currentFilters.to_price) && (
                <span className="active_filter">
                  <i className="bi bi-circle-fill"></i>
                </span>
              )}
            </button>

            <button
              className={`tag ${currentFilters.minKg || currentFilters.maxKg ? "active" : ""}`}
              onClick={handleAtmOpen}
            >
              ATM
              {(currentFilters.minKg || currentFilters.maxKg) && (
                <span className="active_filter">
                  <i className="bi bi-circle-fill"></i>
                </span>
              )}
            </button>

            <button
              style={{ display: "none" }}
              className={`tag ${currentFilters.from_sleep || currentFilters.to_sleep ? "active" : ""}`}
              onClick={handleSleepOpen}
            >
              Sleep
            </button>

            <button
              style={{ display: "none" }}
              className={`tag ${currentFilters.acustom_fromyears || currentFilters.acustom_toyears ? "active" : ""}`}
              onClick={handleYearOpen}
            >
              Year
            </button>

            <button
              style={{ display: "none" }}
              className={`tag ${currentFilters.from_length || currentFilters.to_length ? "active" : ""}`}
              onClick={handleLengthOpen}
            >
              Length
            </button>

            <button
              style={{ display: "none" }}
              className={`tag ${currentFilters.keyword ? "active" : ""}`}
              onClick={handleKeywordOpen}
            >
              Search by Keyword
            </button>
          </div>
        </div>
      </div>

      {/* ── Active filter chips row ── */}
      {(currentFilters.category ||
        currentFilters.state ||
        currentFilters.region ||
        currentFilters.suburb ||
        currentFilters.make ||
        currentFilters.model ||
        currentFilters.from_price ||
        currentFilters.to_price ||
        currentFilters.minKg ||
        currentFilters.maxKg ||
        currentFilters.condition ||
        currentFilters.from_sleep ||
        currentFilters.to_sleep ||
        currentFilters.acustom_fromyears ||
        currentFilters.acustom_toyears ||
        currentFilters.from_length ||
        currentFilters.to_length ||
        currentFilters.keyword) && (
        <div className="active-chips-row">
          {/* 1. Make */}
          {currentFilters.make && (
            <span className={`active-chip${removingChip === "make" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleMakeOpen}>
                {toTitleCase(
                  makeCounts.find((m) => m.slug === currentFilters.make)?.name ??
                    makes.find((m) => m.slug === currentFilters.make)?.name ??
                    currentFilters.make,
                )}
              </span>
              <span className="chip-close" onClick={() => removeChip("make", { make: undefined, model: undefined })}>×</span>
            </span>
          )}
          {/* 2. Model */}
          {currentFilters.model && (
            <span className={`active-chip${removingChip === "model" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleMakeOpen}>
                {toTitleCase(
                  lastModelName ??
                    modelCounts.find((m) => m.slug === currentFilters.model)?.name ??
                    currentFilters.model.replace(/-/g, " "),
                )}
              </span>
              <span className="chip-close" onClick={() => removeChip("model", { model: undefined })}>×</span>
            </span>
          )}
          {/* 3. Condition */}
          {currentFilters.condition && (
            <span className={`active-chip${removingChip === "condition" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleConditionOpen}>
                {currentFilters.condition?.toLowerCase() === "new" ? "New" : "Used"}
              </span>
              <span className="chip-close" onClick={() => removeChip("condition", { condition: undefined })}>×</span>
            </span>
          )}
          {/* 4. Category */}
          {currentFilters.category && (
            <span className={`active-chip${removingChip === "category" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleTypeOpen}>
                {(() => {
                  const slug = currentFilters.category!;
                  const allCats = productListData?.data?.all_categories ?? [];
                  return toTitleCase(
                    categoryCounts.find((c) => c.slug === slug)?.name ??
                    cachedCategoryCountsRef.current.find((c) => c.slug === slug)?.name ??
                    allCats.find((c) => c.slug === slug || c.slug === slug + "-category" || c.slug.replace(/-category$/, "") === slug)?.name ??
                    slug.replace(/-/g, " "),
                  );
                })()}
              </span>
              <span className="chip-close" onClick={() => removeChip("category", { category: undefined })}>×</span>
            </span>
          )}
          {/* 5. State */}
          {currentFilters.state && (
            <span className={`active-chip${removingChip === "state" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleLocationOpen}>{toTitleCase(currentFilters.state)}</span>
              <span className="chip-close" onClick={() => removeChip("state", { state: undefined, region: undefined, suburb: undefined, pincode: undefined, radius_kms: undefined })}>×</span>
            </span>
          )}
          {/* 6. Region */}
          {currentFilters.region && (
            <span className={`active-chip${removingChip === "region" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleLocationOpen}>{toTitleCase(currentFilters.region)}</span>
              <span className="chip-close" onClick={() => removeChip("region", { region: undefined, suburb: undefined, pincode: undefined, radius_kms: undefined })}>×</span>
            </span>
          )}
          {/* 7. Suburb */}
          {currentFilters.suburb && (
            <span className={`active-chip${removingChip === "suburb" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleLocationOpen}>{toTitleCase(currentFilters.suburb)}</span>
              <span className="chip-close" onClick={() => removeChip("suburb", { suburb: undefined, pincode: undefined, radius_kms: undefined })}>×</span>
            </span>
          )}
          {/* 8. Price */}
          {(currentFilters.from_price || currentFilters.to_price) && (
            <span className={`active-chip${removingChip === "price" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handlePriceOpen}>
                {currentFilters.from_price && currentFilters.to_price
                  ? `$${Number(currentFilters.from_price).toLocaleString()} – $${Number(currentFilters.to_price).toLocaleString()}`
                  : currentFilters.from_price
                    ? `From $${Number(currentFilters.from_price).toLocaleString()}`
                    : `Upto $${Number(currentFilters.to_price).toLocaleString()}`}
              </span>
              <span className="chip-close" onClick={() => removeChip("price", { from_price: undefined, to_price: undefined })}>×</span>
            </span>
          )}
          {/* 9. ATM */}
          {(currentFilters.minKg || currentFilters.maxKg) && (
            <span className={`active-chip${removingChip === "atm" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleAtmOpen}>
                {currentFilters.minKg && currentFilters.maxKg
                  ? `${Number(currentFilters.minKg).toLocaleString()} kg – ${Number(currentFilters.maxKg).toLocaleString()} kg`
                  : currentFilters.minKg
                    ? `From ${Number(currentFilters.minKg).toLocaleString()} kg`
                    : `Upto ${Number(currentFilters.maxKg).toLocaleString()} kg`}
              </span>
              <span className="chip-close" onClick={() => removeChip("atm", { minKg: undefined, maxKg: undefined })}>×</span>
            </span>
          )}
          {/* 10. Length */}
          {(currentFilters.from_length || currentFilters.to_length) && (
            <span className={`active-chip${removingChip === "length" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleLengthOpen}>
                {currentFilters.from_length && currentFilters.to_length
                  ? `${currentFilters.from_length}ft – ${currentFilters.to_length}ft`
                  : currentFilters.from_length
                    ? `From ${currentFilters.from_length}ft`
                    : `Upto ${currentFilters.to_length}ft`}
              </span>
              <span className="chip-close" onClick={() => removeChip("length", { from_length: undefined, to_length: undefined })}>×</span>
            </span>
          )}
          {/* 11. Sleep */}
          {(currentFilters.from_sleep || currentFilters.to_sleep) && (
            <span className={`active-chip${removingChip === "sleep" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleSleepOpen}>
                {currentFilters.from_sleep && currentFilters.to_sleep
                  ? `${currentFilters.from_sleep} – ${currentFilters.to_sleep} Berths`
                  : currentFilters.from_sleep
                    ? `From ${currentFilters.from_sleep} Berths`
                    : `Upto ${currentFilters.to_sleep} Berths`}
              </span>
              <span className="chip-close" onClick={() => removeChip("sleep", { from_sleep: undefined, to_sleep: undefined })}>×</span>
            </span>
          )}
          {/* 12. Year */}
          {(currentFilters.acustom_fromyears || currentFilters.acustom_toyears) && (
            <span className={`active-chip${removingChip === "year" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleYearOpen}>
                {currentFilters.acustom_fromyears && currentFilters.acustom_toyears
                  ? `${currentFilters.acustom_fromyears} – ${currentFilters.acustom_toyears}`
                  : currentFilters.acustom_fromyears
                    ? `From ${currentFilters.acustom_fromyears}`
                    : `${currentFilters.acustom_toyears}`}
              </span>
              <span className="chip-close" onClick={() => removeChip("year", { acustom_fromyears: undefined, acustom_toyears: undefined })}>×</span>
            </span>
          )}
          {/* 13. Keyword */}
          {currentFilters.keyword && (
            <span className={`active-chip${removingChip === "keyword" ? " chip-removing" : ""}`}>
              <span className="chip-label" onClick={handleKeywordOpen}>{currentFilters.keyword}</span>
              <span className="chip-close" onClick={() => removeChip("keyword", { keyword: undefined })}>×</span>
            </span>
          )}
          <button
            className="chip-clear-all"
            disabled={clearingAll}
            onClick={handleClearAll}
          >
            {clearingAll ? "Clearing…" : "Clear all"}
          </button>
        </div>
      )}

      {/* Caravan Type Modal */}
      {openModal === "type" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Caravan Type</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="filter-item pt-0">
                <ul className="loc-state-list">
                  {isCategoryCountLoading &&
                  cachedCategoryCountsRef.current.length === 0 ? (
                    <CategorySkeleton />
                  ) : (
                    // Use cached data as fallback while re-fetching
                    (categoryCounts.length > 0
                      ? categoryCounts
                      : cachedCategoryCountsRef.current
                    ).map((cat) => (
                      <li
                        key={cat.slug}
                        className="loc-state-item"
                        onClick={() => setTempCategory(tempCategory === cat.slug ? null : cat.slug)}
                      >
                        <span className={`loc-checkbox${tempCategory === cat.slug ? " checked" : ""}`}>
                          {tempCategory === cat.slug && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}></i>}
                        </span>
                        <span className="loc-state-name">{cat.name}</span>
                        {/* <span className="loc-count">({cat.count.toLocaleString()})</span> */}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleTypeClear}
                style={{
                  opacity: tempCategory ? 1 : 0.4,
                  cursor: tempCategory ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${hasTypeChange ? "active" : ""}`}
                onClick={handleTypeSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {openModal === "location" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header" style={{ position: "relative" }}>
              {locationSubView === "regions" ? (
                <>
                  <button className="loc-back-btn" onClick={() => setLocationSubView("states")}>
                    <i className="bi bi-chevron-left"></i> Location
                  </button>
                  <h3 style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", margin: 0 }}>Region</h3>
                </>
              ) : (
                <h3>Location</h3>
              )}
              {closeBtn}
            </div>

            <div className="filter-body">
              {locationSubView === "states" ? (
                <>
                  {/* Suburb / Postcode search */}
                  <div className="loc-search-wrap">
                    <div style={{ position: "relative" }}>
                    <i className="bi bi-search loc-search-icon"></i>
                    <input
                      type="text"
                      className="loc-search-input"
                      autoComplete="off"
                      placeholder="Search suburb, postcode, state, region"
                      value={formatted(tempSuburbInput)}
                      onFocus={() => setShowSuburbSuggestions(true)}
                      onChange={(e) => {
                        setShowSuburbSuggestions(true);
                        setTempSuburbSuggestion(null);
                        const rawValue = e.target.value;
                        setTempSuburbInput(rawValue);
                        const formattedValue = /^\d+$/.test(rawValue) ? rawValue : formatLocationInput(rawValue);
                        if (formattedValue.length < 1) { setSuburbLocationSuggestions([]); return; }
                        const suburb = formattedValue.split(" ")[0];
                        if (suburbDebounceRef.current) clearTimeout(suburbDebounceRef.current);
                        suburbDebounceRef.current = setTimeout(() => {
                          const reqId = ++suburbReqIdRef.current;
                          setSuburbLocLoading(true);
                          fetchLocations(suburb)
                            .then((data) => {
                              if (reqId !== suburbReqIdRef.current) return;
                              const searchValue = formattedValue.toLowerCase();
                              const filtered = data.filter((item: any) =>
                                item.short_address?.toLowerCase().includes(searchValue) ||
                                item.address?.toLowerCase().includes(searchValue) ||
                                (item.postcode && item.postcode.toString().includes(searchValue))
                              );
                              setSuburbLocationSuggestions(filtered);
                              setSuburbLocLoading(false);
                            })
                            .catch(() => setSuburbLocLoading(false));
                        }, 300);
                      }}
                      onBlur={() => setTimeout(() => setShowSuburbSuggestions(false), 150)}
                    />
                    </div>
                    {showSuburbSuggestions && suburbLocLoading && tempSuburbInput && (
                      <ul className="location-suggestions">
                        {[1, 2, 3].map((i) => (
                          <li key={i} className="suggestion-skeleton"><div className="skeleton-line" /></li>
                        ))}
                      </ul>
                    )}
                    {showSuburbSuggestions && !suburbLocLoading && tempSuburbInput && suburbLocationSuggestions.length === 0 && (
                      <p className="suggestions-no-results" style={{ paddingLeft: 12 }}>No results found</p>
                    )}
                    {showSuburbSuggestions && !suburbLocLoading && suburbLocationSuggestions.length > 0 && (
                      <ul className="location-suggestions">
                        {suburbLocationSuggestions.map((item: any, idx: number) => (
                          <li
                            key={idx}
                            className={`suggestion-item ${tempSuburbSuggestion?.short_address === item.short_address ? "selected" : ""}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setTempSuburbSuggestion(item);
                              setTempSuburbInput("");
                              setSuburbLocationSuggestions([]);
                              setShowSuburbSuggestions(false);
                            }}
                          >
                            {item.address}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Selected suburb chip + radius */}
                  {tempSuburbSuggestion && !tempSuburbInput && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="filter-chip">
                        <span>{tempSuburbSuggestion.address}</span>
                        <button type="button" className="filter-chip-close" onMouseDown={(e) => { e.preventDefault(); setTempSuburbSuggestion(null); setTempSuburbInput(""); }} aria-label="Remove location">×</button>
                      </div>
                      {tempSuburbSuggestion.uri.split("/").filter(Boolean).length >= 3 && (
                        <div style={{ marginTop: 14 }}>
                          <div className="cfs-radius-label">Search surrounding area</div>
                          <div className="cfs-radius-wrap">
                            {(() => {
                              const idx = Math.max(0, RADIUS_OPTIONS.indexOf(tempSuburbRadius as (typeof RADIUS_OPTIONS)[number]));
                              const pct = (idx / (RADIUS_OPTIONS.length - 1)) * 100;
                              return (
                                <>
                                  <div className="cfs-radius-tooltip" style={{ left: `calc(${pct}% + ${18 - 0.36 * pct}px)` }}>{tempSuburbRadius}km</div>
                                  <div className="cfs-radius-track-wrap">
                                    <input type="range" className="cfs-radius-slider" min={0} max={RADIUS_OPTIONS.length - 1} step={1} value={idx} style={{ background: `linear-gradient(to right, #f37920 0%, #f37920 ${pct}%, #ddd ${pct}%, #ddd 100%)` }} onChange={(e) => setTempSuburbRadius(RADIUS_OPTIONS[parseInt(e.target.value, 10)])} aria-label="Search radius in kilometers" />
                                    {RADIUS_OPTIONS.map((km, i) => {
                                      const tickPct = (i / (RADIUS_OPTIONS.length - 1)) * 100;
                                      return <span key={i} className={`cfs-radius-tick${i < idx ? " active" : i === idx ? " current" : ""}`} style={{ left: `calc(${tickPct}% + ${9 - 0.18 * tickPct}px)` }} title={`${km}km`} />;
                                    })}
                                  </div>
                                  <div className="cfs-radius-range"><span>{RADIUS_OPTIONS[0]}km</span><span>{RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1].toLocaleString()}km</span></div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* State list — hidden when suburb is selected */}
                  <ul className="loc-state-list" style={{ display: tempSuburbSuggestion ? "none" : undefined }}>
                    {states.map((s) => {
                      const abbr = AUS_ABBR[s.name.toUpperCase()] ?? s.name.substring(0, 3).toUpperCase();
                      const count = stateCounts.find((c) => c.name?.toLowerCase() === s.name.toLowerCase() || c.name?.toLowerCase() === abbr.toLowerCase())?.count;
                      const isSelected = tempState?.toLowerCase() === s.name.toLowerCase();
                      return (
                        <li
                          key={s.name}
                          className={`loc-state-item${isSelected ? " selected" : ""}`}
                          onClick={() => { setTempState(isSelected ? null : s.name); setTempRegion(null); }}
                        >
                          <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                            {isSelected && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}></i>}
                          </span>
                          <span className="loc-state-name">{abbr}</span>
                          {isSelected ? (
                            <button
                              className="loc-region-pill"
                              onClick={(e) => { e.stopPropagation(); handleRegionViewOpen(s.name); }}
                            >
                              Region <i className="bi bi-chevron-right"></i>
                            </button>
                          ) : (
                            <button
                              className="loc-arrow-btn"
                              onClick={(e) => { e.stopPropagation(); handleRegionViewOpen(s.name); }}
                              aria-label={`View regions in ${abbr}`}
                            >
                              <i className="bi bi-chevron-right"></i>
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                /* Regions sub-view */
                <>
                  <div className="loc-region-heading">Region of {tempState}</div>
                  <ul className="loc-state-list">
                    {filteredRegions.map((r) => {
                      const count = regionCounts.find((c) => c.name?.toLowerCase() === r.name.toLowerCase())?.count;
                      const isSelected = tempRegion?.toLowerCase() === r.name.toLowerCase();
                      return (
                        <li
                          key={r.name}
                          className={`loc-state-item${isSelected ? " selected" : ""}`}
                          onClick={() => setTempRegion(isSelected ? null : r.name)}
                        >
                          <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                            {isSelected && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}></i>}
                          </span>
                          <span className="loc-state-name">{r.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleLocationClear}
                style={{
                  opacity: (tempState || currentFilters.suburb) ? 1 : 0.4,
                  cursor: (tempState || currentFilters.suburb) ? "pointer" : "not-allowed",
                }}
              >
                Clear
              </button>
              <button
                className={`search ${(hasLocationChange || tempSuburbSuggestion) ? "active" : ""}`}
                onClick={() => {
                  if (tempSuburbSuggestion) {
                    const uriParts = tempSuburbSuggestion.uri.split("/").filter(Boolean);
                    const stateSlug = uriParts[0] || "";
                    const regionSlug = uriParts[1] || "";
                    const suburbSlug = uriParts[2] || "";
                    let pincode = uriParts[3] || "";
                    const state = stateSlug.replace(/-state$/, "").replace(/-/g, " ").trim();
                    const region = regionSlug.replace(/-region$/, "").replace(/-/g, " ").trim();
                    // Handle both URI formats:
                    // Old: state/region/suburb-suburb/pincode  → pincode in uriParts[3]
                    // New: state/region/suburb-pincode-suburb  → pincode embedded in slug
                    const suburbWithPinMatch = suburbSlug.match(/^([a-z0-9-]+)-(\d{4})-suburb$/i);
                    let suburb: string;
                    if (suburbWithPinMatch) {
                      suburb = suburbWithPinMatch[1].replace(/-/g, " ").trim();
                      if (!pincode) pincode = suburbWithPinMatch[2];
                    } else {
                      suburb = suburbSlug.replace(/-suburb$/, "").replace(/-/g, " ").trim();
                    }
                    if (!/^\d{4}$/.test(pincode)) {
                      const m = tempSuburbSuggestion.address.match(/\b\d{4}\b/);
                      if (m) pincode = m[0];
                    }
                    const validRegion = getValidRegionName(state, region, states);
                    updateFiltersAndURL({ suburb: suburb.toLowerCase(), pincode: pincode || undefined, state, region: validRegion || region, radius_kms: tempSuburbRadius });
                  } else {
                    handleLocationSearch();
                  }
                  setOpenModal(null);
                }}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Make & Model Modal */}
      {openModal === "make" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header" style={{ position: "relative" }}>
              {makeSubView === "models" ? (
                <>
                  <button className="loc-back-btn" onClick={() => setMakeSubView("makes")}>
                    <i className="bi bi-chevron-left"></i> Make
                  </button>
                  <h3 style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", margin: 0 }}>Model</h3>
                </>
              ) : (
                <h3>Make &amp; Model</h3>
              )}
              {closeBtn}
            </div>
            {/* Search — outside filter-body so it never scrolls away */}
            <div className="filter-search-bar">
              {makeSubView === "models" && (
                <div className="loc-region-heading" style={{ marginBottom: 8, borderBottom: "none", paddingBottom: 0 }}>
                  {makes.find((m) => m.slug === tempMake)?.name ?? tempMake}
                </div>
              )}
              <div className="loc-search-wrap" style={{ marginBottom: 0 }}>
                <i className="bi bi-search loc-search-icon"></i>
                <input
                  className="loc-search-input"
                  type="text"
                  placeholder={makeSubView === "makes" ? "Search make" : "Search model"}
                  value={makeSubView === "makes" ? makeSearch : modelSearch}
                  onChange={(e) =>
                    makeSubView === "makes"
                      ? setMakeSearch(e.target.value)
                      : setModelSearch(e.target.value)
                  }
                />
              </div>
            </div>
            {/* key={makeSubView} forces a full DOM remount (and scroll-to-top)
                when switching between the makes list and the models list so the
                two lists are never visible at the same time. */}
            <div className="filter-body" key={makeSubView}>
              {makeSubView === "makes" ? (
                <ul className="loc-state-list">
                  {makeLoading ? (
                    <li className="loc-state-item" style={{ justifyContent: "center", color: "#888" }}>Loading...</li>
                  ) : (
                    filteredMakes.map((m) => {
                      const isSelected = tempMake === m.slug;
                      return (
                        <li
                          key={m.slug}
                          className={`loc-state-item${isSelected ? " selected" : ""}`}
                          onClick={() => {
                            if (isSelected) {
                              setTempMake(null);
                              setTempModel(null);
                            } else {
                              setTempMake(m.slug);
                              setTempModel(null);
                            }
                          }}
                        >
                          <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                            {isSelected && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}></i>}
                          </span>
                          <span className="loc-state-name">{m.name}</span>
                          {/* <span className="loc-count">({m.count.toLocaleString()})</span> */}
                          {isSelected ? (
                            <button
                              className="loc-region-pill"
                              onClick={(e) => { e.stopPropagation(); handleModelViewOpen(m.slug); }}
                            >
                              Model <i className="bi bi-chevron-right"></i>
                            </button>
                          ) : (
                            <button
                              className="loc-arrow-btn"
                              onClick={(e) => { e.stopPropagation(); setTempMake(m.slug); setTempModel(null); handleModelViewOpen(m.slug); }}
                              aria-label={`View models for ${m.name}`}
                            >
                              <i className="bi bi-chevron-right"></i>
                            </button>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              ) : (
                <ul className="loc-state-list">
                  {modelCountLoading ? (
                    <li className="loc-state-item" style={{ justifyContent: "center", color: "#888" }}>Loading...</li>
                  ) : filteredModels.length === 0 ? (
                    <li className="loc-state-item" style={{ color: "#888" }}>No models found</li>
                  ) : (
                    filteredModels.map((mod) => {
                      const isSelected = tempModel === mod.slug;
                      return (
                        <li
                          key={mod.slug}
                          className={`loc-state-item${isSelected ? " selected" : ""}`}
                          onClick={() => setTempModel(isSelected ? null : mod.slug)}
                        >
                          <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                            {isSelected && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}></i>}
                          </span>
                          <span className="loc-state-name">{mod.name || mod.slug}</span>
                          {/* <span className="loc-count">({mod.count.toLocaleString()})</span> */}
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleMakeClear}
                style={{
                  opacity: tempMake ? 1 : 0.4,
                  cursor: tempMake ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempMake ? "active" : ""}`}
                onClick={handleMakeSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {openModal === "price" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Price</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempPriceFrom ?? ""}
                      onChange={(e) =>
                        setTempPriceFrom(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {PRICE_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          ${v.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempPriceTo ?? ""}
                      onChange={(e) =>
                        setTempPriceTo(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {PRICE_OPTIONS
                        .filter((v) => !tempPriceFrom || v > tempPriceFrom)
                        .map((v) => (
                          <option key={v} value={v}>
                            ${v.toLocaleString()}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handlePriceClear}
                style={{
                  opacity: tempPriceFrom || tempPriceTo ? 1 : 0.4,
                  cursor:
                    tempPriceFrom || tempPriceTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempPriceFrom || tempPriceTo ? "active" : ""}`}
                onClick={handlePriceSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATM Modal */}
      {openModal === "atm" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>ATM</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempAtmFrom ?? ""}
                      onChange={(e) =>
                        setTempAtmFrom(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {ATM_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v} kg
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempAtmTo ?? ""}
                      onChange={(e) =>
                        setTempAtmTo(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">Any</option>
                      {ATM_OPTIONS
                        .filter((v) => !tempAtmFrom || v > tempAtmFrom)
                        .map((v) => (
                          <option key={v} value={v}>
                            {v} kg
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleAtmClear}
                style={{
                  opacity: tempAtmFrom || tempAtmTo ? 1 : 0.4,
                  cursor: tempAtmFrom || tempAtmTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempAtmFrom || tempAtmTo ? "active" : ""}`}
                onClick={handleAtmSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* {condition label} */}
      {/* Condition Modal */}
      {openModal === "condition" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Condition</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="filter-item condition-field">
                <ul className="loc-state-list">
                  {(["New", "Used"] as const).map((cond) => {
                    const isSelected = tempCondition?.toLowerCase() === cond.toLowerCase();
                    return (
                      <li
                        key={cond}
                        className="loc-state-item"
                        onClick={() => setTempCondition(isSelected ? null : cond.toLowerCase())}
                      >
                        <span className={`loc-checkbox${isSelected ? " checked" : ""}`}>
                          {isSelected && <i className="bi bi-check" style={{ color: "#fff", fontSize: 14, lineHeight: 1 }}></i>}
                        </span>
                        <span className="loc-state-name">{cond}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleConditionClear}
                style={{
                  opacity: tempCondition ? 1 : 0.4,
                  cursor: tempCondition ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempCondition ? "active" : ""}`}
                onClick={handleConditionSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sleep Modal */}
      {openModal === "sleep" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Sleeping Capacity</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempSleepFrom ?? ""}
                      onChange={(e) => setTempSleepFrom(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Any</option>
                      {SLEEP_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v} {v === 1 ? "person" : "people"}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempSleepTo ?? ""}
                      onChange={(e) => setTempSleepTo(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Any</option>
                      {SLEEP_OPTIONS
                        .filter((v) => !tempSleepFrom || v >= tempSleepFrom)
                        .map((v) => (
                          <option key={v} value={v}>{v} {v === 1 ? "person" : "people"}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleSleepClear}
                style={{
                  opacity: tempSleepFrom || tempSleepTo ? 1 : 0.4,
                  cursor: tempSleepFrom || tempSleepTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempSleepFrom || tempSleepTo ? "active" : ""}`}
                onClick={handleSleepSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Year Modal */}
      {openModal === "year" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Year Range</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>From</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempYearFrom ?? ""}
                      onChange={(e) => setTempYearFrom(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Any</option>
                      {YEAR_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>To</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempYearTo ?? ""}
                      onChange={(e) => setTempYearTo(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Any</option>
                      {YEAR_OPTIONS
                        .filter((v) => !tempYearFrom || v >= tempYearFrom)
                        .map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleYearClear}
                style={{
                  opacity: tempYearFrom || tempYearTo ? 1 : 0.4,
                  cursor: tempYearFrom || tempYearTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempYearFrom || tempYearTo ? "active" : ""}`}
                onClick={handleYearSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Length Modal */}
      {openModal === "length" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Length (ft)</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempLengthFrom ?? ""}
                      onChange={(e) => setTempLengthFrom(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Any</option>
                      {LENGTH_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v} ft</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select
                      className="cfs-select-input form-select"
                      value={tempLengthTo ?? ""}
                      onChange={(e) => setTempLengthTo(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Any</option>
                      {LENGTH_OPTIONS
                        .filter((v) => !tempLengthFrom || v >= tempLengthFrom)
                        .map((v) => (
                          <option key={v} value={v}>{v} ft</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleLengthClear}
                style={{
                  opacity: tempLengthFrom || tempLengthTo ? 1 : 0.4,
                  cursor: tempLengthFrom || tempLengthTo ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempLengthFrom || tempLengthTo ? "active" : ""}`}
                onClick={handleLengthSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyword Modal */}
      {openModal === "keyword" && (
        <div className="filter-overlay">
          <div className="filter-modal">
            <div className="filter-header">
              <h3>Search by Keyword</h3>
              {closeBtn}
            </div>
            <div className="filter-body">
              <div className="location-item">
                <div style={{ position: "relative" }}>
                  <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: 14 }}></i>
                  <input
                    type="text"
                    className="cfs-select-input form-control"
                    placeholder="Try caravans with bunks"
                    autoComplete="off"
                    autoFocus
                    value={tempKeyword}
                    style={{ paddingLeft: 36 }}
                    onChange={(e) => setTempKeyword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && tempKeyword.trim()) handleKeywordSearch(); }}
                  />
                </div>
              </div>
            </div>
            <div className="filter-footer">
              <button
                className="clear"
                onClick={handleKeywordClear}
                style={{
                  opacity: tempKeyword.trim() ? 1 : 0.4,
                  cursor: tempKeyword.trim() ? "pointer" : "not-allowed",
                }}
              >
                Clear filters
              </button>
              <button
                className={`search ${tempKeyword.trim() ? "active" : ""}`}
                onClick={handleKeywordSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSlider;
