 "use client";
import "../filter.css?=11";
import { fetchLocations } from "@/api/location/api";
import React, {
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useTransition,
  useMemo,
} from "react";
import { usePathname, useRouter } from "next/navigation";
// import { useSearchParams } from "next/navigation";
 import { buildSlugFromFilters } from "../slugBuilter";
import { buildUpdatedFilters } from "../buildUpdatedFilters";
import {
  fetchKeywordSuggestions,
  fetchHomeSearchList,
} from "@/api/homeSearch/api";
import { flushSync } from "react-dom";
 import CategorySkeleton from "./CategorySkeleton";
import SearchSuggestionSkeleton from "../Searchsuggestionskeleton ";
import { fetchMakeDetails } from "@/api/make-new/api";

type LocationSuggestion = {
  key: string;
  uri: string;
  address: string;
  short_address: string;
};

interface Category {
  name: string;
  slug: string;
}

type CategoryCount = {
  name: string;
  slug: string;
  count: number;
};

interface StateOption {
  value: string;
  name: string;
  regions?: {
    name: string;
    value: string;
    suburbs?: {
      name: string;
      value: string;
    }[];
  }[];
}

interface MakeModel {
  name: string;
  slug: string;
}

interface Make {
  id?: number;
  name: string;
  slug: string;
  models?: MakeModel[];
}
type MakeCount = {
  name: string;
  slug: string;
  count: number;
};

type ModelCount = {
  name: string;
  slug: string;
  count: number;
};

export interface Filters {
  page?: number | string; // <- allow both
  category?: string;
  make?: string;
  location?: string | null;
  from_price?: string | number;
  to_price?: string | number;
  condition?: string;
  sleeps?: string;
  states?: string;
  minKg?: string | number;
  maxKg?: string | number;
  acustom_fromyears?: number | string;
  acustom_toyears?: number | string;
  from_length?: string | number;
  to_length?: string | number;
  from_sleep?: string | number;
  to_sleep?: string | number;
  model?: string;
  state?: string;
  region?: string;
  suburb?: string;
  pincode?: string;
  radius_kms?: number | string; // <- allow both
  search?: string; // <- for search
  keyword?: string; // <- for keyword search
}

type ProductListResponse = {
  data: {
    all_categories: Category[];
    states: StateOption[];
    make_options?: Make[];
    model_options?: Model[];
  };
};
interface CaravanFilterProps {
  onClose?: () => void;
  categories: Category[];
  onClearAll?: () => void;
  makes: Make[];
  models: Model[];
  setIsLoading?: (val: boolean) => void;
  setIsMainLoading?: (val: boolean) => void;
  setIsFeaturedLoading?: (val: boolean) => void;
  setIsPremiumLoading?: (val: boolean) => void;
  states: StateOption[];
  currentFilters: Filters;
  onFilterChange: (filters: Filters) => void;
  focusSection?: string;
  productListData?: ProductListResponse;
  initialCategoryCounts?: CategoryCount[];
}

interface Option {
  name: string;
  slug: string;
}
interface Model {
  name: string;
  slug: string;
}

type Suburb = {
  name: string;
  value: string;
};

type HomeSearchItem = {
  label?: string;
  name?: string;
  title?: string;
  keyword?: string;
  value?: string;
  slug?: string;
  url?: string;
};

type KeywordItem = { label: string; url?: string };

// params-count client cache — same filter counts within 5 min = instant
const paramsCountCache = new Map<string, { data: unknown; ts: number }>();
const PARAMS_CACHE_TTL = 5 * 60 * 1000;

async function fetchParamsCount(url: string, signal: AbortSignal): Promise<Record<string, unknown>> {
  const cached = paramsCountCache.get(url);
  if (cached && Date.now() - cached.ts < PARAMS_CACHE_TTL) {
    return cached.data as Record<string, unknown>;
  }
  const res = await fetch(url, { signal });
  if (!res.ok) return {};
  const raw = await res.text();
  const idx = raw.indexOf('{"');
  try {
    const data = JSON.parse(idx > 0 ? raw.substring(idx) : raw);
    paramsCountCache.set(url, { data, ts: Date.now() });
    return data;
  } catch {
    return {};
  }
}

const FilterModal: React.FC<CaravanFilterProps> = ({
  onClose,
  onClearAll,
  onFilterChange,
  currentFilters = {},
  setIsFeaturedLoading,
  setIsPremiumLoading,
  setIsMainLoading,
  setIsLoading,
  focusSection,
  productListData,
  initialCategoryCounts,
  makes: makesProp,
  states: statesProp = [],
}) => {
  const router = useRouter();
  const pathname = usePathname();
  // const searchParams = useSearchParams();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const RADIUS_OPTIONS = [25, 50, 100, 250, 500, 1000] as const;
  const [radiusKms, setRadiusKms] = useState<number>(() => {
    const kms = Number(currentFilters.radius_kms);
    return kms > 0 ? kms : RADIUS_OPTIONS[0];
  });
   const [visibleCount, setVisibleCount] = useState(10);
  const [modelCounts, setModelCounts] = useState<ModelCount[]>([]);
  const [isCategoryCountLoading, setIsCategoryCountLoading] = useState(true);
  const categoryFirstLoadDoneRef = useRef(false); // ← add this ref

  // இந்த state variables add பண்ணு (top-ல்)
  const [tempStateName, setTempStateName] = useState<string | null>(null);
  const [tempRegionName, setTempRegionName] = useState<string | null>(null);
  const [makes, setMakes] = useState<Make[]>(makesProp || []);
  const [model, setModel] = useState<Model[]>([]);
   const [modelOpen, setModelOpen] = useState(false);
   const [categories, setCategories] = useState<Option[]>(
  productListData?.data?.all_categories || []
);

const [states, setStates] = useState<StateOption[]>(statesProp);

    console.log("productstate", productListData )

  // const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [filteredSuburbs, setFilteredSuburbs] = useState<Suburb[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [tempSleepFrom, setTempSleepFrom] = useState<number | null>(null);
  const [tempSleepTo, setTempSleepTo] = useState<number | null>(null);
  const [tempLengthFrom, setTempLengthFrom] = useState<number | null>(null);
  const [tempLengthTo, setTempLengthTo] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  // Add this new state at the top with other states
  const [tempRegionNameRaw, setTempRegionNameRaw] = useState<string | null>(
    null,
  );
  const [locationInput, setLocationInput] = useState("");
  const [makeCounts, setMakeCounts] = useState<MakeCount[]>([]);
  const [tempPriceFrom, setTempPriceFrom] = useState<number | null>(null);
  const [tempPriceTo, setTempPriceTo] = useState<number | null>(null);

  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedpincode, setSelectedpincode] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<
    string | null
  >(null);
  const [selectedMakeName, setSelectedMakeName] = useState<string | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null,
  );
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>(initialCategoryCounts ?? []);
  // ATM modal states

  const [tempAtmFrom, setTempAtmFrom] = useState<number | null>(null);
  const [tempAtmTo, setTempAtmTo] = useState<number | null>(null);
  const [tempCondition, setTempCondition] = useState<string | null>(null);
  // top (other states kula)
  const [modalKeyword, setModalKeyword] = useState("");
  const hasCategoryBeenSetRef = useRef(false);
  const categoryApiCalledRef = useRef(false);

  const prevSuburbsKeyRef = useRef<string>("");
  const radiusDebounceRef = useRef<number | null>(null);
  const regionSetAfterSuburbRef = useRef(false);

  const makeInitializedRef = useRef(false); // ✅ add at top of component

  const lastPushedURLRef = useRef<string>(
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : ""
  );
  const mountedRef = useRef(false);

  const lastSentFiltersRef = useRef<Filters | null>(null);

  const keepModelOpenRef = useRef(false);
  const isUserTypingRef = useRef(false);

  const hydratedKeyRef = useRef("");
  const [searchText, setSearchText] = useState("");
  const suburbClickedRef = useRef(false);
  const locationReqIdRef = useRef(0);
  const [selectedConditionName, setSelectedConditionName] = useState<
    string | null
  >(null);
  const [stateRegionOpen, setStateRegionOpen] = useState(true);
  const [stateLocationOpen, setStateLocationOpen] = useState(false);
  const [stateSuburbOpen, setStateSuburbOpen] = useState(true);

  const [selectedStateName, setSelectedStateName] = useState<string | null>(
    null,
  );
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(
    null,
  );
  const [selectedSuburbName, setSelectedSuburbName] = useState<string | null>(
    null,
  );
  // const [navigating, setNavigating] = useState(false);

  const [selectedSuggestion, setSelectedSuggestion] =
    useState<LocationSuggestion | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordItem[]>(
    [],
  );

  const [tempYearFrom, setTempYearFrom] = useState<number | null>(null);
  const [tempYearTo, setTempYearTo] = useState<number | null>(null);

  const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
  const [searchMake, setSearchMake] = useState("");
  const [selectedMakeTemp, setSelectedMakeTemp] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sleepRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const lengthRef = useRef<HTMLDivElement>(null);
  const keywordRef = useRef<HTMLDivElement>(null);

  const [baseKeywords, setBaseKeywords] = useState<KeywordItem[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [baseLoading, setBaseLoading] = useState(false);
  const pickedSourceRef = useRef<"base" | "typed" | null>(null);
  const [atmFrom, setAtmFrom] = useState<number | null>(null);
  const [atmTo, setAtmTo] = useState<number | null>(null);
  const [lengthFrom, setLengthFrom] = useState<number | null>(null);
  const [lengthTo, setLengthTo] = useState<number | null>(null);

  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const filtersInitialized = useRef(false);
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);
  const [sleepFrom, setSleepFrom] = useState<number | null>(null);
  const [sleepTo, setSleepTo] = useState<number | null>(null);
  const [popularMakes, setPopularMakes] = useState<MakeCount[]>([]);

  const atm = [
    600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
    4500,
  ];
  console.log(onFilterChange);
  const price = [
    10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000,
    125000, 150000, 175000, 200000, 225000, 250000, 275000, 300000,
  ];

  const years = [
    
    2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
    2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2000, 1975,
  ];

  const length = [
    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const sleep = [1, 2, 3, 4, 5, 6, 7];
  const [selectedRegion, setSelectedRegion] = useState<string>();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  // put near other utils
  const AUS_ABBR: Record<string, string> = {
    Victoria: "VIC",
    "New South Wales": "NSW",
    Queensland: "QLD",
    "South Australia": "SA",
    "Western Australia": "WA",
    Tasmania: "TAS",
    "Northern Territory": "NT",
    "Australian Capital Territory": "ACT",
  };

  // ✅ FilterSlider-la mari: tempMake (modal-la live select panradhu) மாறினா உடனே
  // athukான models காமிக்கும். selectedMake (committed/URL value) மட்டும் வெச்சா
  // dropdown-la make pick pannும் போது model list update aagathu.
  useEffect(() => {
    if (!selectedMakeTemp || makes.length === 0) {
      setModel([]);
      return;
    }

    const make = makes.find((m) => m.slug === selectedMakeTemp);
    setModel(make?.models || []);
    setModelOpen(true);
  }, [selectedMakeTemp, makes]);

  const buildParamsFromFilters = (filters: Filters) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        key !== "page" // page count-ku thevai illa
      ) {
        params.set(key, String(value));
      }
    });

    return params;
  };

  // ✅ Smart merge: local filters win, but only if they have a real value
  // ✅ Smart merge: local filters win ONLY if they have a real value

  // ✅ NEW: buildCountParams that supports excluding MULTIPLE fields
  // ✅ Smart merge: local filters win ONLY if they have a real value
  const mergeFilters = (base: Filters, local: Filters): Filters => {
    const merged: Filters = { ...base };
    for (const key of Object.keys(local) as (keyof Filters)[]) {
      const val = local[key];
      if (val !== undefined && val !== null && val !== "") {
        (merged as any)[key] = val;
      }
    }
    return merged;
  };

  // ✅ NEW: buildCountParams that supports excluding MULTIPLE fields
  const buildCountParamsMulti = (
    filters: Filters,
    excludeFields: string[] = [],
  ) => {
    const params = new URLSearchParams();

    const filterMap: Record<string, string | number | undefined | null> = {
      category: filters.category,
      make: filters.make,
      model: filters.model,
      condition: filters.condition,
      state: filters.state?.toLowerCase(),
      region: filters.region,
      suburb: filters.suburb,
      pincode: filters.pincode,
      from_price: filters.from_price,
      to_price: filters.to_price,
      from_atm: filters.minKg,
      to_atm: filters.maxKg,
      acustom_fromyears: filters.acustom_fromyears,
      acustom_toyears: filters.acustom_toyears,
      from_length: filters.from_length,
      to_length: filters.to_length,
      from_sleep: filters.from_sleep,
      to_sleep: filters.to_sleep,
      search: filters.search,
      keyword: filters.keyword,
    };

    Object.entries(filterMap).forEach(([key, value]) => {
      // Skip ALL excluded fields
      if (excludeFields.includes(key)) return;

      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });

    return params;
  };

  // Replace your count useEffect with this:

  const isSearching = searchText.trim().length > 0;

  // const filteredMakes = useMemo(() => {
  //   if (!searchMake) return makeCounts;

  //   return makeCounts.filter((m) =>
  //     m.name.toLowerCase().includes(searchMake.toLowerCase()),
  //   );
  // }, [makeCounts, searchMake]);

  const triggerGlobalLoaders = () => {
    flushSync(() => {
      if (setIsLoading) setIsLoading(true);
      if (setIsMainLoading) setIsMainLoading(true);
      if (setIsFeaturedLoading) setIsFeaturedLoading(true);
      if (setIsPremiumLoading) setIsPremiumLoading(true);
    });
  };

  // pick a human-readable text from item
  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempModel, setTempModel] = useState<string | null>(null);
  useEffect(() => {
    if (isCategoryModalOpen) {
      setTempCategory(selectedCategory);
    }
    if (isMakeModalOpen) {
      setTempModel(selectedModel);
    }
  }, [isCategoryModalOpen, isMakeModalOpen]);

  // works for (HomeSearchItem | string)[]
  useEffect(() => {
    if (currentFilters.from_sleep) {
      setSleepFrom(Number(currentFilters.from_sleep));
    } else {
      setSleepFrom(null);
    }

    if (currentFilters.to_sleep) {
      setSleepTo(Number(currentFilters.to_sleep));
    } else {
      setSleepTo(null);
    }
  }, [currentFilters.from_sleep, currentFilters.to_sleep]);

  useEffect(() => {
    setBaseLoading(true);
    fetchHomeSearchList()
      .then((list) => {
        const items: KeywordItem[] = (
          list as Array<HomeSearchItem | string>
        ).map((x) =>
          typeof x === "string"
            ? { label: x }
            : {
                label:
                  x.label ??
                  x.name ??
                  x.title ??
                  x.keyword ??
                  x.value ??
                  x.slug ??
                  "",
                url: (x as HomeSearchItem).url || "",
              },
        );

        const uniq = Array.from(
          new Map(items.map((i) => [i.label.trim(), i])).values(),
        ).filter((i) => i.label);

        setBaseKeywords(uniq);
      })
      .catch(() => setBaseKeywords([]))
      .finally(() => setBaseLoading(false));
  }, [isKeywordModalOpen]);
  useEffect(() => {
    const q = modalKeyword.trim();
    if (q.length < 2) {
      setKeywordSuggestions([]);
      setKeywordLoading(false);
      return;
    }

    const ctrl = new AbortController();
    setKeywordLoading(true);

    const t = setTimeout(async () => {
      try {
        const list = await fetchKeywordSuggestions(q, ctrl.signal);
        const items: KeywordItem[] = list.map((x) => ({
          label: (x.keyword || "").trim(),
          url: (x.url || "").trim(),
        }));

        setKeywordSuggestions(
          Array.from(new Set(items.map((i) => i.label))).map(
            (label) => items.find((i) => i.label === label)!,
          ),
        );
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.warn("[keyword] fetch failed:", e);
      } finally {
        setKeywordLoading(false);
      }
    }, 300);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [modalKeyword]);

  // ✅ Base list apply → search=<raw>

  // add near other useMemos
  const keywordText = useMemo(() => {
    const v = (currentFilters.keyword ??
      currentFilters.search ??
      filters.keyword ??
      filters.search ??
      "") as string;
    return v.toString();
  }, [
    currentFilters.keyword,
    currentFilters.search,
    filters.keyword,
    filters.search,
  ]);

  // keep the read-only input in sync
  useEffect(() => {
    if (keywordInput !== keywordText) setKeywordInput(keywordText);
  }, [keywordText]);
  // const toQueryPlus = (s: string) =>
  //   s.trim().toLowerCase().replace(/\s+/g, "+");
  const toQueryPlus = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[+\-]+/g, " ")
      .replace(/\s+/g, "+");

  const toHumanFromQuery = (s?: string) =>
    (s ?? "").toString().replace(/\+/g, " ").replace(/-/g, " ");
  // ✅ One button for modal footer
  // ✅ Modal submit → base => search, typed/suggested => keyword
  // Base list -> search=<plus joined>
  // put near other small helpers
  const keepCategory = (): Partial<Filters> => ({
    category:
      filters.category ??
      selectedCategory ??
      currentFilters.category ??
      undefined,
  });

  // Modal primary button -> always search=<plus joined>
  const applyKeywordFromModal = () => {
    const raw = modalKeyword.trim();
    if (!raw) return;
    triggerGlobalLoaders();

    const allItems = [...baseKeywords, ...keywordSuggestions];
    const match = allItems.find(
      (x) => x.label.toLowerCase() === raw.toLowerCase(),
    );

    if (match?.url && match.url.trim().length > 0) {
      router.push(match.url);
      setIsKeywordModalOpen(false);
      setModalKeyword("");
      return;
    }

    const next: Filters = {
      ...currentFilters,
      ...keepCategory(),
      search: toQueryPlus(raw),
      keyword: undefined,
    };

    setIsKeywordModalOpen(false);
    setModalKeyword("");
    setFilters(next);
    filtersInitialized.current = true;
    startTransition(() => {
      updateAllFiltersAndURL(next);
    });
  };

  const buildShortAddress = (
    suburb?: string | null,
    state?: string | null,
    pincode?: string | null,
  ) => {
    const abbr = state && AUS_ABBR[state] ? AUS_ABBR[state] : state || "";
    return [suburb, abbr, pincode].filter(Boolean).join(" ");
  };

  useEffect(() => {
    if (!showSuggestions || !isUserTypingRef.current) return;

    const q = locationInput.trim();
    if (q.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const t = setTimeout(() => {
      const suburb = q.split(" ")[0];
      fetchLocations(suburb)
        .then((data) => {
          const normalised = q
            .replace(/_/g, " ")
            .replace(/\s*-\s*/g, "  ")
            .replace(/\s{3,}/g, "  ")
            .toLowerCase();
          const filtered = data.filter(
            (item) =>
              item.short_address.toLowerCase().includes(normalised) ||
              item.address.toLowerCase().includes(normalised),
          );
          setLocationSuggestions(filtered);
        })
        .catch(console.error);
    }, 300);
    return () => clearTimeout(t);
  }, [locationInput, showSuggestions]);

  // 🔧 FIXED hydrateLocation function
  const hydrateLocation = (next: Filters): Filters => {
    const out: Filters = { ...next };

    for (const key of ["state", "region", "suburb", "pincode"] as const) {
      if (typeof out[key] === "string" && !out[key]?.trim()) delete out[key];
    }

    // ⛔ DO NOT rehydrate if user manually cleared
    if (
      !out.region &&
      selectedRegionName &&
      !regionManuallyClearedRef.current
    ) {
      out.region = selectedRegionName;
    }

    if (suburbManuallyClearedRef.current) {
      delete out.suburb;
      delete out.pincode;
      return out;
    }
    return out;
  };

  // const didFetchRef = useRef(false);
  // useEffect(() => {
  //   if (didFetchRef.current) return;
  //   didFetchRef.current = true;
  //   const loadFilters = async () => {
  //     const res = await fetchProductList();
  //     if (res?.data) {
  //       setCategories(res.data.all_categories || []);
  //       setStates(res.data.states || []);
  //     }
  //   };
  //   loadFilters();
  // }, []);

  // Keep states in sync when the prop is updated (e.g. after Listings loads states from the API)
  useEffect(() => {
    if (statesProp?.length) setStates(statesProp);
  }, [statesProp]);

  useEffect(() => {
  if (productListData?.data) {
    setCategories(productListData.data.all_categories || []);
    // Prefer productListData states only when they're populated; fall back to the prop
    if (productListData.data.states?.length) {
      setStates(productListData.data.states);
    } else if (statesProp?.length) {
      setStates(statesProp);
    }
    const makeOpts = (productListData.data as any).make_options;
    if (makeOpts?.length) {
      setMakes(makeOpts);
    } else if (makesProp?.length) {
      setMakes(makesProp);
    }
  } else if (makesProp?.length) {
    setMakes(makesProp);
  }
}, [productListData, makesProp, statesProp]);

  // useEffect(() => {
  //   const load = async () => {
  //     const list = await fetchMakeDetails();
  //     setMakes(list); // includes models[]
  //     setModelOpen(true);
  //   };
  //   load();
  // }, []);

  type UnknownRec = Record<string, unknown>;

  const isOptionArray = (v: unknown): v is Option[] =>
    Array.isArray(v) &&
    v.every(
      (o) =>
        typeof o === "object" &&
        o !== null &&
        typeof (o as UnknownRec).name === "string" &&
        typeof (o as UnknownRec).slug === "string",
    );

  const isStateOptionArray = (v: unknown): v is StateOption[] =>
    Array.isArray(v) &&
    v.every(
      (s) =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as UnknownRec).name === "string" &&
        typeof (s as UnknownRec).value === "string",
    );

 
  useEffect(() => {
    const kms = Number(currentFilters.radius_kms);
    if (kms > 0) setRadiusKms(kms);
  }, [currentFilters.radius_kms]);

  const displayedMakes = useMemo(() => {
    // Always prefer live makeCounts from params-count (pre-warmed via KV) when
    // available — this fixes the empty Make dropdown when no other filters are
    // active (old code only used makeCounts when hasOtherFilters was true).
    const raw: MakeCount[] =
      makeCounts.length > 0
        ? makeCounts
        : makes.map((m) => ({ name: m.name, slug: m.slug, count: 0 }));
    // Deduplicate by slug — WP taxonomy can register the same make twice,
    // which causes the same name to appear twice in the dropdown.
    const seen = new Set<string>();
    const source = raw.filter((m) => {
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    });
    if (!searchText.trim()) return source;
    return source.filter((m) =>
      m.name.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [makeCounts, makes, searchText, isSearching]);

  // ✅ validate region only if it exists under the given state
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
    return reg?.name; // return canonical name if valid, else undefined
  };
  // neww

  useEffect(() => {
    if (!filtersInitialized.current) {
      setAtmFrom(
        currentFilters.minKg !== undefined
          ? Number(currentFilters.minKg)
          : null,
      );
      setAtmTo(
        currentFilters.maxKg !== undefined
          ? Number(currentFilters.maxKg)
          : null,
      );
    }
  }, [currentFilters.minKg, currentFilters.maxKg]);

  // correct -2
  useEffect(() => {
    setAtmFrom(
      currentFilters.minKg !== undefined ? Number(currentFilters.minKg) : null,
    );
    setAtmTo(
      currentFilters.maxKg !== undefined ? Number(currentFilters.maxKg) : null,
    );

    setMinPrice(
      currentFilters.from_price !== undefined
        ? Number(currentFilters.from_price)
        : null,
    );
    setMaxPrice(
      currentFilters.to_price !== undefined
        ? Number(currentFilters.to_price)
        : null,
    );

    setLengthFrom(
      currentFilters.from_length !== undefined
        ? Number(currentFilters.from_length)
        : null,
    );
    setLengthTo(
      currentFilters.to_length !== undefined
        ? Number(currentFilters.to_length)
        : null,
    );

    setSelectedConditionName(currentFilters.condition ?? null);
  }, [
    currentFilters.minKg,
    currentFilters.maxKg,
    currentFilters.from_price,
    currentFilters.to_price,
    currentFilters.from_length,
    currentFilters.to_length,
    currentFilters.sleeps,
    currentFilters.condition,
  ]);

  // correct 3
  // ⛔ duplicate of the selectedMakeTemp-based effect above (was stuck on selectedMake only,
  // so picking a make in the modal never updated the Model dropdown) — commented, not deleted.
  // useEffect(() => {
  //   if (!selectedMake || makes.length === 0) {
  //     setModel([]);
  //     return;
  //   }
  //
  //   const make = makes.find((m) => m.slug === selectedMake);
  //   setModel(make?.models || []);
  //   setModelOpen(true);
  // }, [selectedMake, makes]);

  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [modalInput, setModalInput] = useState(""); // 🔐 modal-only
  const toggle = (setter: Dispatch<SetStateAction<boolean>>) => {
    setter((prev) => !prev);
  };

  const [isPending, startTransition] = useTransition();
  console.log(isPending);

  useEffect(() => {
    if (currentFilters.keyword || currentFilters.search) return;
    if (!pathname) return;

    const m = pathname.match(/(?:^|\/)(keyword|search)=([^/?#]+)/i);
    if (!m) return;

    const kind = m[1].toLowerCase();
    const raw = decodeURIComponent(m[2]);

    const next: Filters =
      kind === "keyword"
        ? {
            ...keepCategory(),
            ...filters,
            ...currentFilters,
            search: toQueryPlus(raw.replace(/-/g, " ")),
            keyword: undefined,
          }
        : {
            ...keepCategory(),
            ...filters,
            ...currentFilters,
            search: toQueryPlus(raw),
            keyword: undefined,
          };

    setKeywordInput(raw);
    setFilters(next);
    lastSentFiltersRef.current = next;
  }, [pathname]);

  // 🔁 Keep the read-only Keyword input in sync with the applied filters
  useEffect(() => {
    const v = (
      filters.keyword ??
      filters.search ?? // ← local first
      currentFilters.keyword ??
      currentFilters.search ??
      ""
    ).toString();

    if (keywordInput !== v) setKeywordInput(v);
  }, [
    filters.keyword,
    filters.search, // watch local first
    currentFilters.keyword,
    currentFilters.search,
  ]);

  const regionManuallyClearedRef = useRef(false);
  const resetRegionFilters = () => {
    regionManuallyClearedRef.current = true; // 👈 IMPORTANT

    // UI
    setSelectedRegion("");
    setSelectedRegionName(null);
    setSelectedSuburbName(null);
    setSelectedpincode(null);
    setFilteredSuburbs([]);

    const updatedFilters: Filters = {
      ...currentFilters,
    };

    delete updatedFilters.region;
    delete updatedFilters.suburb;
    delete updatedFilters.pincode;

    setFilters(updatedFilters);
    filtersInitialized.current = true;

    startTransition(() => {
      updateAllFiltersAndURL(updatedFilters);
    });
  };

  const formatted = (s: string) =>
    s
      .replace(/ - /g, "  ") // replace hyphen separators with double spaces
      .replace(/\s+/g, " ");

  const formatLocationInput = (s: string) =>
    s
      .replace(/_/g, " ") // underscores -> space
      .replace(/\s*-\s*/g, "  ") // hyphen (with any spaces) -> double space
      .replace(/\s{3,}/g, "  ") // collapse 3+ spaces -> 2
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  const suburbManuallyClearedRef = useRef(false);

  const isKnownMake = (slug?: string | null) =>
    !!slug && makes.some((m) => m.slug === slug);

  const sanitizeMake = (value?: string | null) =>
    !makes.length || isKnownMake(value) ? value! : undefined;

  const clean = (f: Filters): Filters => ({
    ...f,
    make: sanitizeMake(f.make),
  });

  useEffect(() => {
    if (!selectedSuggestion) return;

    if (radiusDebounceRef.current) clearTimeout(radiusDebounceRef.current);

    radiusDebounceRef.current = window.setTimeout(() => {
      // ✅ Always start from both currentFilters + filters
      const base: Filters = {
        ...currentFilters,
        ...filters,
        state: selectedStateName ?? currentFilters.state ?? filters.state,
        region: getValidRegionName(
          selectedStateName ?? currentFilters.state ?? filters.state,
          selectedRegionName ?? currentFilters.region ?? filters.region,
          states,
        ),
        suburb: selectedSuburbName ?? currentFilters.suburb ?? filters.suburb,
        pincode: selectedpincode ?? currentFilters.pincode ?? filters.pincode,
        make: selectedMake ?? filters.make ?? currentFilters.make,
        model: selectedModel ?? filters.model ?? currentFilters.model,
        category: selectedCategory ?? filters.category ?? currentFilters.category,
      };

      const effectiveRadius = Number(currentFilters.radius_kms) || radiusKms;
      const updated = buildUpdatedFilters(base, { radius_kms: effectiveRadius });

      setFilters(updated);
      filtersInitialized.current = true;

      startTransition(() => {
        updateAllFiltersAndURL(updated);
      });
    }, 250);

    return () => {
      if (radiusDebounceRef.current) clearTimeout(radiusDebounceRef.current);
    };
  }, [
    selectedStateName,
    selectedRegion,
    selectedRegionName,
    selectedSuburbName,
    selectedpincode,
  ]);

  const statesKey = useMemo(() => {
    if (!Array.isArray(states)) return "";
    // Use stable, cheap fields; avoid dumping whole objects
    return states.map((s) => `${s.value}:${s.regions?.length ?? 0}`).join(",");
  }, [states]);

  // 2) Keep your original effect body unchanged
  // put this near other refs

  // helper to make a stable signature of a suburbs array
  const suburbsKey = (subs?: Suburb[]) =>
    (subs ?? []).map((s) => `${s.name}|${s.value}`).join("||");

  // ✅ only sets state when the suburbs list actually changed
  useEffect(() => {
    if (!selectedStateName || !selectedRegionName || !states.length) return;

    const matchedState = states.find(
      (s) =>
        s.name.toLowerCase() === selectedStateName.toLowerCase() ||
        s.value.toLowerCase() === selectedStateName.toLowerCase(),
    );
    if (!matchedState) return;

    const matchedRegion = matchedState.regions?.find(
      (r) =>
        r.name.toLowerCase() === selectedRegionName.toLowerCase() ||
        r.value.toLowerCase() === selectedRegionName.toLowerCase(),
    );

    const nextSubs = matchedRegion?.suburbs ?? [];
    const nextKey = suburbsKey(nextSubs);

    if (prevSuburbsKeyRef.current !== nextKey) {
      prevSuburbsKeyRef.current = nextKey;
      setFilteredSuburbs(nextSubs);
    }
    // 👇 DON'T write else { setFilteredSuburbs([]) } here repeatedly.
  }, [selectedStateName, selectedRegionName, statesKey]);

  useEffect(() => {
    if (currentFilters.state) setSelectedStateName(currentFilters.state);
    if (currentFilters.region) setSelectedRegionName(currentFilters.region); // only set if present
    if (currentFilters.suburb) setSelectedSuburbName(currentFilters.suburb);
    if (currentFilters.pincode) setSelectedpincode(currentFilters.pincode);
  }, [
    currentFilters.state,
    currentFilters.region,
    currentFilters.suburb,
    currentFilters.pincode,
  ]);

  useEffect(() => {
    if (!isModalOpen || !showSuggestions || !isUserTypingRef.current) return;

    const q = modalInput.trim();
    if (q.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const t = setTimeout(() => {
      const suburb = q.split(" ")[0];
      fetchLocations(suburb)
        .then((data) => {
          // 🔥 FIX: Filter the results based on current input
          const formattedValue = formatLocationInput(q);
          const filtered = data.filter(
            (item) =>
              item.short_address
                .toLowerCase()
                .includes(formattedValue.toLowerCase()) ||
              item.address.toLowerCase().includes(formattedValue.toLowerCase()),
          );
          setLocationSuggestions(filtered);
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(t);
  }, [modalInput, showSuggestions, isModalOpen]);

  useEffect(() => {
    if (
      currentFilters.category &&
      !selectedCategory &&
      categories.length > 0 &&
      !filtersInitialized.current
    ) {
      const cat = categories.find((c) => c.slug === currentFilters.category);
      if (cat) {
        setSelectedCategory(cat.slug);
        setSelectedCategoryName(cat.name);
      }
    }
  }, [currentFilters.category, selectedCategory, categories]);

  // adaa

  // 👇 Add this inside your component
  useEffect(() => {
    if (currentFilters?.acustom_fromyears) {
      setYearFrom(Number(currentFilters.acustom_fromyears));
      setYearTo(Number(currentFilters.acustom_toyears));
    } else {
      setYearFrom(null);
      setYearTo(null);
    }
  }, [currentFilters?.acustom_fromyears, currentFilters?.acustom_toyears]);

  useEffect(() => {
    if (
      selectedMake &&
      !selectedModel &&
      currentFilters.model &&
      model.length > 0
    ) {
      const match = model.find((m) => m.slug === currentFilters.model);
      if (match) {
        setSelectedModel(match.slug);
        setSelectedModelName(match.name);

        // ✅ Auto-close dropdown once hydrated
        setModelOpen(false);
      }
    }

    if (selectedModel && model.length > 0 && !selectedModelName) {
      const match = model.find((m) => m.slug === selectedModel);
      if (match) {
        setSelectedModelName(match.name);

        // ✅ Close dropdown if model was restored
        setModelOpen(false);
      }
    }
  }, [
    selectedMake,
    selectedModel,
    model,
    currentFilters.model,
    selectedModelName,
  ]);

  useEffect(() => {
    if (
      !makeInitializedRef.current &&
      selectedMake &&
      filtersInitialized.current &&
      (!filters.make || filters.make !== selectedMake)
    ) {
      const updatedFilters = {
        ...currentFilters,
        make: selectedMake,
        model: filters.model,
      };
      setFilters(updatedFilters);
      // onFilterChange(updatedFilters);
      makeInitializedRef.current = true;
    }
  }, [selectedMake]);

  useEffect(() => {
    // Block hydration if we already initialized or make was reset
    if (
      makeInitializedRef.current || // already hydrated
      selectedMake || // already selected in UI
      !pathname.includes("/listings/") || // not in listings page
      !makes.length || // no make list
      !currentFilters.make // ❌ make no longer in filters after reset
    ) {
      return;
    }

    const segments = pathname.split("/listings/")[1]?.split("/") || [];

    const matchedMakeSlug = segments.find((segment) =>
      makes.some((m) => m.slug === segment),
    );

    if (matchedMakeSlug) {
      const matched = makes.find((m) => m.slug === matchedMakeSlug);
      if (matched) {
        setSelectedMake(matched.slug);
        setSelectedMakeName(matched.name);

        makeInitializedRef.current = true;

        // // Optional: sync filters
        // const updatedFilters: Filters = {
        //   ...currentFilters,
        //   make: matched.slug,
        // };

        // setFilters(updatedFilters);
        // startTransition(() => {
        //   updateAllFiltersAndURL(updatedFilters);
        // });
      }
    }
  }, [pathname, selectedMake, makes, currentFilters.make]);

  // ✅ MASTER SEARCH HANDLER - commits ALL temp values at once
  // ============================================================
  const handleMasterSearch = () => {
    triggerGlobalLoaders();
    // ✅ Keyword logic - old code போல
    if (modalKeyword.trim()) {
      const raw = modalKeyword.trim();
      const allItems = [...baseKeywords, ...keywordSuggestions];
      const match = allItems.find(
        (x) => x.label.toLowerCase() === raw.toLowerCase(),
      );

      if (match?.url && match.url.trim().length > 0) {
        router.push(match.url);
        if (onClose) onClose();
        return;
      }
    }
    let suburbFilters: Partial<Filters> = {};

    // Use URI length (not suburbClickedRef) so chip from previous selection also works after modal reopen
    const suggestionUriParts = selectedSuggestion
      ? selectedSuggestion.uri.split("/").filter(Boolean)
      : [];
    if (selectedSuggestion && suggestionUriParts.length >= 3) {
      // filter(Boolean) handles trailing slashes: "victoria-state/melbourne-region/" → 2 parts, not 3
      const uriParts = suggestionUriParts;
      const stateSlug = uriParts[0] || ""; // ← state first
      const regionSlug = uriParts[1] || ""; // ← region second
      const suburbSlug = uriParts[2] || ""; // ← suburb third
      let pincode = uriParts[3] || ""; // ← pincode fourth (old API format)

      const state = stateSlug
        .replace(/-state$/, "")
        .replace(/-/g, " ")
        .trim();
      const region = regionSlug
        .replace(/-region$/, "")
        .replace(/-/g, " ")
        .trim();

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
        const m = selectedSuggestion.address.match(/\b\d{4}\b/);
        if (m) pincode = m[0];
      }

      const validRegion = getValidRegionName(state, region, states);

      suburbFilters = {
        suburb: suburb.toLowerCase(),
        pincode: pincode || undefined,
        state: state,
        region: validRegion || region, // ✅ fallback to raw region
        radius_kms: radiusKms,
      };
    } else if (selectedSuggestion && currentFilters.suburb) {
      // Chip was hydrated from existing filter (not re-selected) — preserve suburb + updated radius
      suburbFilters = {
        suburb: currentFilters.suburb,
        pincode: currentFilters.pincode,
        state: currentFilters.state,
        region: currentFilters.region,
        radius_kms: radiusKms,
      };
    }

    const updatedFilters: Filters = {
      ...currentFilters,
      category: tempCategory || undefined,
      make: selectedMakeTemp || undefined,
      model: tempModel || undefined,
      condition: tempCondition || undefined,
      state: suburbFilters.state || tempStateName?.toLowerCase() || undefined,
      region:
        suburbFilters.region ||
        tempRegionName ||
        tempRegionNameRaw ||
        undefined,
      suburb: suburbFilters.suburb || undefined,
      pincode: suburbFilters.pincode || undefined,
      radius_kms: suburbFilters.radius_kms || undefined,
      minKg: tempAtmFrom ?? undefined,
      maxKg: tempAtmTo ?? undefined,
      from_price: tempPriceFrom ?? undefined,
      to_price: tempPriceTo ?? undefined,
      from_sleep: tempSleepFrom ?? undefined,
      to_sleep: tempSleepTo ?? undefined,
      from_length: tempLengthFrom ?? undefined,
      to_length: tempLengthTo ?? undefined,
      search: modalKeyword.trim()
        ? toQueryPlus(modalKeyword.trim())
        : currentFilters.search,
      acustom_fromyears: tempYearFrom !== null ? tempYearFrom : undefined,
      acustom_toyears: tempYearTo !== null ? tempYearTo : undefined,

      page: 1,
    };

    console.log("🔑 updatedFilters:", {
      sSSSState: updatedFilters.state,
      region: updatedFilters.region,
      suburb: updatedFilters.suburb,
      pincode: updatedFilters.pincode,
    });

    // ✅ regionManuallyClearedRef reset பண்ணு - இல்லன்னா hydrateLocation region drop பண்ணும்
    regionManuallyClearedRef.current = false;
    suburbManuallyClearedRef.current = false;

    setFilters(updatedFilters);
    filtersInitialized.current = true;
    suburbClickedRef.current = false;

    if (selectedSuggestion) {
      setLocationInput(selectedSuggestion.short_address || "");
      setModalInput("");
    }

    setShowSuggestions(false);
    setLocationSuggestions([]);

    // ✅ setTimeout - state updates flush ஆன பிறகு URL update
    setTimeout(() => {
      updateAllFiltersAndURL(updatedFilters);
    }, 100);

    if (onClose) onClose();
  };
  // ============================================================
  // ✅ CLEAR ALL FILTERS
  // ============================================================

  // --- helpers ---
  // List only the keys you actually care about for equality + URL
  const FILTER_KEYS: (keyof Filters)[] = [
    "category",
    "make",
    "model",
    "condition",
    "sleeps",
    "state",
    "region",
    "suburb",
    "pincode",
    "location",
    "from_price",
    "to_price",
    "minKg",
    "maxKg",
    "acustom_fromyears",
    "acustom_toyears",
    "from_length",
    "to_length",
    "radius_kms",
    "search",
    "keyword",
  ];

  const normalizeFilters = (f: Filters): Filters => {
    // convert empty strings to undefined, trim strings
    const out: Filters = { ...f };
    for (const k of FILTER_KEYS) {
      const v = out[k];
      if (typeof v === "string") {
        const t = v.trim();
        out[k] = (t === "" ? undefined : t) as never;
      }
    }
    return out;
  };

  const filtersEqual = (a?: Filters | null, b?: Filters | null): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    for (const k of FILTER_KEYS) {
      if (a[k] !== b[k]) return false;
    }
    return true;
  };
  useEffect(() => {
    if (!hasCategoryBeenSetRef.current && selectedCategory) {
      hasCategoryBeenSetRef.current = true;
    }
  }, [selectedCategory]);
  // router issue

  useEffect(() => {
    if (!selectedModel || model.length === 0) return;

    const modelMatch = model.find((m) => m.slug === selectedModel);
    if (modelMatch) {
      setSelectedModelName(modelMatch.name);
    }
  }, [model, selectedModel]);

  const isValidMakeSlug = (slug: string | null | undefined): slug is string =>
    !!slug && makes.some((m) => m.slug === slug);
  const isValidModelSlug = (slug: string | null | undefined): slug is string =>
    !!slug && isNaN(Number(slug)) && model.some((m) => m.slug === slug);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // ✅ Update all filters and URL with validation
  // 🔁 replace this whole function
  const updateAllFiltersAndURL = (override?: Filters) => {
    const DEFAULT_RADIUS = 50;

    const nextRaw: Filters = override ?? filters;
    const next: Filters = {
      ...clean(hydrateLocation(normalizeFilters(nextRaw))),
      page: 1, // ← Add this line to reset page
    };

    next.make = sanitizeMake(next.make); // belt & suspenders
    // ✅ safer location preservation logic
    if (next.state) {
      // only delete region/suburb if they're explicitly empty strings
      if (next.region === "" || next.region === undefined) delete next.region;
      if (next.suburb === "" || next.suburb === undefined) delete next.suburb;
      if (next.pincode === "" || next.pincode === undefined)
        delete next.pincode;
    } else {
      // if no state, clear all location data
      delete next.state;
      delete next.region;
      delete next.suburb;
      delete next.pincode;
    }

    setFilters((prev) => (filtersEqual(prev, next) ? (prev as Filters) : next));
    filtersInitialized.current = true;
    if (typeof next.radius_kms !== "number") next.radius_kms = DEFAULT_RADIUS;

    // 2) notify parent only if changed
    // if (!filtersEqual(lastSentFiltersRef.current, next)) {
    //   lastSentFiltersRef.current = next;
    //   onFilterChange(next);
    // }

    // 3) build URL once0000000000000000
    const slugPath = buildSlugFromFilters(next);
    const query = new URLSearchParams();

    if (next.radius_kms && next.radius_kms !== 25 && (next.suburb || next.radius_kms !== DEFAULT_RADIUS))
      query.set("radius_kms", String(next.radius_kms));

    const safeSlugPath = slugPath.endsWith("/") ? slugPath : `${slugPath}/`;
    const finalURL = query.toString() ? `${safeSlugPath}?${query}` : safeSlugPath;
    console.log("🏁 finalURL:", finalURL, "| suburb:", next.suburb, "| region:", next.region, "| pincode:", next.pincode);
    if (lastPushedURLRef.current !== finalURL) {
      lastPushedURLRef.current = finalURL;
      // window.history.replaceState(null, "", finalURL);

      if (mountedRef.current) {
        router.push(finalURL, { scroll: false });
      }
    }
  };

  useEffect(() => {
    if (keepModelOpenRef.current) {
      setModelOpen(true);
    }
  }, [model, filters]);

  // ✅ Update handleModelSelect with valid check
  const handleModelSelect = (mod: Model) => {
    keepModelOpenRef.current = false;
    const safeMake = isValidMakeSlug(selectedMake) ? selectedMake : undefined;
    const safeModel = isValidModelSlug(mod.slug) ? mod.slug : undefined;

    setSelectedModel(mod.slug);
    setSelectedModelName(mod.name);
    triggerGlobalLoaders();
    const updatedFilters: Filters = {
      ...currentFilters,
      make: safeMake,
      model: safeModel,
    };

    setFilters(updatedFilters);
    filtersInitialized.current = true;
    setModelOpen(false);
    startTransition(() => {
      updateAllFiltersAndURL(updatedFilters); // Trigger API + URL sync
    });
  };

  useEffect(() => {
    // If we have a region selected but no suburb, keep suburb panel open
    if (selectedRegionName && !selectedSuburbName) {
      setStateRegionOpen(false);
      setStateSuburbOpen(true);
    }

    // If we have a state selected but no region, keep region panel open
    if (selectedStateName && !selectedRegionName) {
      setStateLocationOpen(false);
      setStateRegionOpen(true);
    }
  }, [selectedStateName, selectedRegionName, selectedSuburbName]);

  const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");

  const findSuggestionFor = (
    suburb: string,
    region: string | null,
    state: string | null,
    pincode: string | null,
    suggestions: LocationSuggestion[],
  ): LocationSuggestion | null => {
    const ss = slug(suburb);
    const rr = slug(region || "");
    const st = slug(state || "");

    // match by URI parts first
    const byUri = suggestions.find((it) => {
      const [sub, reg, sta, pc] = it.uri.split("/");
      const matchSub = sub?.startsWith(`${ss}-suburb`);
      const matchReg = reg?.startsWith(`${rr}-region`);
      const matchSta = sta?.startsWith(`${st}-state`);
      const matchPc = pincode ? (pc || "").includes(pincode) : true;
      return matchSub && matchReg && matchSta && matchPc;
    });
    if (byUri) return byUri;

    // fallback by address text
    const byText = suggestions.find((it) => {
      const A = it.address.toLowerCase();
      return (
        A.includes(suburb.toLowerCase()) &&
        (!region || A.includes(region.toLowerCase())) &&
        (!state || A.includes(state.toLowerCase())) &&
        (!pincode || A.includes(pincode))
      );
    });
    return byText || null;
  };
  const locKey = useMemo(
    () =>
      [
        selectedSuburbName ?? "",
        selectedRegionName ?? "",
        selectedStateName ?? "",
        selectedpincode ?? "",
      ].join("|"),
    [
      selectedSuburbName,
      selectedRegionName,
      selectedStateName,
      selectedpincode,
    ],
  );

  useEffect(() => {
    if (!selectedSuburbName || !selectedStateName) return;

    // run once per unique combo
    if (hydratedKeyRef.current === locKey) return;
    hydratedKeyRef.current = locKey; // mark early to prevent re-entry

    let cancelled = false;

    (async () => {
      try {
        const data = await fetchLocations(selectedSuburbName);
        console.log("🌆 location data sub:", selectedSuburbName);
        console.log("🌆 location data fetched:", data);

        // ✅ Normalize input suburb for safe comparison
        const target = selectedSuburbName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");

        // ✅ Filter only exact suburb matches (ignore East/North variations)
        const exactMatches = (data || []).filter((item) => {
          // normalize fetched suburb from URI
          const suburbFromUri = item.uri
            ?.split("/")[0]
            ?.replace(/-suburb$/, "")
            ?.replace(/-/g, " ")
            ?.trim()
            ?.toLowerCase();

          return suburbFromUri === target;
        });

        console.log("🎯 exact suburb matches:", exactMatches);

        const match = findSuggestionFor(
          selectedSuburbName,
          selectedRegionName,
          selectedStateName,
          selectedpincode || null,
          exactMatches || [],
        );

        if (!match || cancelled) return;

        if (!selectedSuggestion || selectedSuggestion.key !== match.key) {
          setSelectedSuggestion(match);
        }
        console.log("🌇 location input Hydrating:", locationInput);
        if (locationInput !== match.short_address) {
          isUserTypingRef.current = false;
          setLocationInput(match.short_address);
        }
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locKey]);

  console.log("region", selectedRegionName);
  useEffect(() => {
    console.log("🔍 Region Auto-detection State:", {
      selectedSuburbName,
      selectedStateName,
      selectedRegionName,
      hasStates: states.length > 0,
      regionSetAfterSuburb: regionSetAfterSuburbRef.current,
      suburbClicked: suburbClickedRef.current,
      shouldAutoDetect:
        selectedSuburbName &&
        selectedStateName &&
        !regionSetAfterSuburbRef.current &&
        !suburbClickedRef.current,
    });
  }, [selectedSuburbName, selectedStateName, selectedRegionName, states]);

  // ✅ Modal open ஆகும்போது suburb இருந்தா chip-style-ல காட்டு
  useEffect(() => {
    if (currentFilters.suburb && currentFilters.state) {
      const capitalizedSuburb = currentFilters.suburb.replace(/\b\w/g, (c) =>
        c.toUpperCase(),
      );
      const stateAbbr =
        Object.entries(AUS_ABBR).find(
          ([key]) => key.toLowerCase() === currentFilters.state?.toLowerCase(),
        )?.[1] || currentFilters.state;
      const fullStateName = currentFilters.state.replace(/\b\w/g, (c) => c.toUpperCase());

      const shortAddr = [capitalizedSuburb, stateAbbr, currentFilters.pincode]
        .filter(Boolean)
        .join(" ");
      const fullAddr = [capitalizedSuburb, fullStateName, currentFilters.pincode]
        .filter(Boolean)
        .join(" ");

      const stateSlug = currentFilters.state.toLowerCase().replace(/\s+/g, "-") + "-state";
      const regionSlug = currentFilters.region
        ? currentFilters.region.toLowerCase().replace(/\s+/g, "-") + "-region"
        : "unknown-region";
      const suburbSlug = currentFilters.suburb.toLowerCase().replace(/\s+/g, "-") + "-suburb";
      const uri = [stateSlug, regionSlug, suburbSlug, currentFilters.pincode]
        .filter(Boolean)
        .join("/");

      setSelectedSuggestion({ key: `hydrated`, uri, address: fullAddr, short_address: shortAddr });
      setModalInput("");
      setLocationInput(shortAddr);
    }
  }, [currentFilters.suburb, currentFilters.state, currentFilters.pincode]);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedStateName]);
  categoryApiCalledRef.current = true;

  type OptimizeType =
    | "category"
    | "make"
    | "model"
    | "state"
    | "region"
    | "suburb"
    | "keyword"
    | "atm";

  const lastOptimizeRef = useRef<Record<string, string | undefined>>({});

  const triggerOptimizeApi = (type: OptimizeType, value?: string | null) => {
    if (!value) return;

    // 🔒 prevent duplicate calls for same value
    if (lastOptimizeRef.current[type] === value) return;
    lastOptimizeRef.current[type] = value;

    const params = new URLSearchParams();
    params.set(type, value);

    fetch(`/api/listings/?${params.toString()}`, {
      method: "GET",
      keepalive: true,
    }).catch(() => {});
  };

  // Modal open ஆகும்போது currentFilters sync பண்ணு
  useEffect(() => {
    // ✅ state case-insensitive match
    const matchedState = states.find(
      (s) =>
        s.name.toLowerCase() === (currentFilters.state || "").toLowerCase(),
    );
    setTempStateName(matchedState?.name || null);

    // ✅ region match
    const matchedRegion = matchedState?.regions?.find(
      (r) =>
        r.name.toLowerCase() === (currentFilters.region || "").toLowerCase(),
    );
    if (matchedRegion) {
      // ✅ dropdown-ல் இருக்கு → normal set
      setTempRegionName(matchedRegion.name);
      setTempRegionNameRaw(null);
    } else if (currentFilters.region) {
      // ✅ dropdown-ல் இல்ல ஆனா URL-ல் இருக்கு → raw-ஆ set
      setTempRegionName(null);
      setTempRegionNameRaw(currentFilters.region);
    } else {
      setTempRegionName(null);
      setTempRegionNameRaw(null);
    }
    setTempCondition(currentFilters.condition ?? null);
    setTempCategory(currentFilters.category || null);
    setSelectedMakeTemp(currentFilters.make || null);
    setTempModel(currentFilters.model || null);
    setTempAtmFrom(currentFilters.minKg ? Number(currentFilters.minKg) : null);
    setTempAtmTo(currentFilters.maxKg ? Number(currentFilters.maxKg) : null);
    setTempPriceFrom(
      currentFilters.from_price ? Number(currentFilters.from_price) : null,
    );
    setTempPriceTo(
      currentFilters.to_price ? Number(currentFilters.to_price) : null,
    );
    setTempSleepFrom(
      currentFilters.from_sleep ? Number(currentFilters.from_sleep) : null,
    );
    setTempSleepTo(
      currentFilters.to_sleep ? Number(currentFilters.to_sleep) : null,
    );
    setTempLengthFrom(
      currentFilters.from_length ? Number(currentFilters.from_length) : null,
    );
    setTempLengthTo(
      currentFilters.to_length ? Number(currentFilters.to_length) : null,
    );
    setTempAtmFrom(currentFilters.minKg ? Number(currentFilters.minKg) : null);
    setTempAtmTo(currentFilters.maxKg ? Number(currentFilters.maxKg) : null);
    setTempYearFrom(currentFilters.acustom_fromyears ? Number(currentFilters.acustom_fromyears) : null);
    setTempYearTo(currentFilters.acustom_toyears ? Number(currentFilters.acustom_toyears) : null);
    const existingKeyword = currentFilters.search
      ? toHumanFromQuery(currentFilters.search)
      : currentFilters.keyword
        ? toHumanFromQuery(currentFilters.keyword)
        : "";
    setModalKeyword(existingKeyword);
  }, [
    states, // ✅ states load ஆன பிறகு run ஆகணும்
    currentFilters.category,
    currentFilters.make,
    currentFilters.model,
    currentFilters.state,
    currentFilters.region,
    currentFilters.minKg,
    currentFilters.maxKg,
    currentFilters.from_price,
    currentFilters.to_price,
    currentFilters.from_sleep,
    currentFilters.to_sleep,
    currentFilters.from_length,
    currentFilters.to_length,
    currentFilters.acustom_fromyears,
    currentFilters.acustom_toyears,
    currentFilters.condition,
    currentFilters.search, // ✅ இது add பண்ணு
    currentFilters.keyword,
  ]);
  useEffect(() => {
    setTempCondition(currentFilters.condition ?? null);
  }, [currentFilters.condition]);
  useEffect(() => {
    const existingKeyword = currentFilters.search
      ? toHumanFromQuery(currentFilters.search)
      : currentFilters.keyword
        ? toHumanFromQuery(currentFilters.keyword)
        : "";
    setModalKeyword(existingKeyword);
  }, [currentFilters.search, currentFilters.keyword]);

  const hasAnyTempFilter = useMemo(() => {
    return !!(
      tempCategory ||
      selectedMakeTemp ||
      tempModel ||
      tempCondition ||
      tempAtmFrom ||
      tempAtmTo ||
      tempPriceFrom ||
      tempPriceTo ||
      tempSleepFrom ||
      tempSleepTo ||
      tempYearFrom ||
      tempYearTo ||
      tempLengthFrom ||
      tempLengthTo ||
      tempStateName ||
      tempRegionName ||
      modalInput ||
      modalKeyword ||
      // ✅ currentFilters-லயும் check பண்ணு (already applied filters)
      currentFilters.category ||
      currentFilters.make ||
      currentFilters.model ||
      currentFilters.condition ||
      currentFilters.state ||
      currentFilters.from_price ||
      currentFilters.to_price ||
      currentFilters.minKg ||
      currentFilters.maxKg ||
      currentFilters.acustom_fromyears ||
      currentFilters.from_length ||
      currentFilters.to_length ||
      currentFilters.from_sleep ||
      currentFilters.to_sleep ||
      currentFilters.search ||
      currentFilters.keyword
    );
  }, [
    tempCategory,
    selectedMakeTemp,
    tempModel,
    tempCondition,
    tempAtmFrom,
    tempAtmTo,
    tempPriceFrom,
    tempPriceTo,
    tempSleepFrom,
    tempSleepTo,
    tempYearFrom,
    tempYearTo,
    tempLengthFrom,
    tempLengthTo,
    tempStateName,
    tempRegionName,
    modalInput,
    modalKeyword,
    currentFilters.category,
    currentFilters.make,
    currentFilters.model,
    currentFilters.condition,
    currentFilters.state,
    currentFilters.from_price,
    currentFilters.to_price,
    currentFilters.minKg,
    currentFilters.maxKg,
    currentFilters.acustom_fromyears,
    currentFilters.from_length,
    currentFilters.to_length,
    currentFilters.from_sleep,
    currentFilters.to_sleep,
    currentFilters.search,
    currentFilters.keyword,
  ]);
  // ✅ categoryCounts load ஆன பிறகு run ஆகும்

  // Replace your count useEffect with this:

  useEffect(() => {
    // ✅ temp values merge பண்ணு - modal-ல் select பண்ணவுடனே count update ஆகும்
    const tempFilters: Filters = {};
    if (tempCategory) tempFilters.category = tempCategory;
    if (selectedMakeTemp) tempFilters.make = selectedMakeTemp;
    if (tempModel) tempFilters.model = tempModel;
    if (tempCondition) tempFilters.condition = tempCondition;
    if (tempStateName) tempFilters.state = tempStateName.toLowerCase();
    if (tempRegionName) tempFilters.region = tempRegionName;
    else if (tempRegionNameRaw) tempFilters.region = tempRegionNameRaw;
    if (selectedSuggestion) {
      const uriParts = selectedSuggestion.uri.split("/");
      const suburbSlug = uriParts[2] || "";
      const pincode = uriParts[3] || "";
      const suburb = suburbSlug.replace(/-suburb$/, "").replace(/-/g, " ").trim();
      tempFilters.suburb = suburb.toLowerCase();
      tempFilters.pincode = pincode;
    }
    if (tempAtmFrom) tempFilters.minKg = tempAtmFrom;
    if (tempAtmTo) tempFilters.maxKg = tempAtmTo;
    if (tempPriceFrom) tempFilters.from_price = tempPriceFrom;
    if (tempPriceTo) tempFilters.to_price = tempPriceTo;
    if (tempSleepFrom) tempFilters.from_sleep = tempSleepFrom;
    if (tempSleepTo) tempFilters.to_sleep = tempSleepTo;
    if (tempLengthFrom) tempFilters.from_length = tempLengthFrom;
    if (tempLengthTo) tempFilters.to_length = tempLengthTo;
    if (tempYearFrom) tempFilters.acustom_fromyears = tempYearFrom;
    if (tempYearTo) tempFilters.acustom_toyears = tempYearTo;
    if (modalKeyword.trim().length < 2) {
      const rawSearch = currentFilters.search || currentFilters.keyword;
      if (rawSearch) tempFilters.search = rawSearch as string;
    }
    const activeFilters: Filters = mergeFilters(mergeFilters(currentFilters, filters), tempFilters);
    const controller = new AbortController();
    const { signal } = controller;
    // ─── CATEGORY COUNTS ───
    // Location filters (state/region/suburb) are excluded intentionally:
    // category names are global, counts are not shown in the UI, and
    // excluding location means this always hits the pre-warmed KV key
    // (params-count:group_by=category) so it never blocks on a WP fallback.
    const catParams = buildCountParamsMulti(activeFilters, [
      "category",
      "state",
      "region",
      "suburb",
      "pincode",
    ]);
    catParams.set("group_by", "category");
    setIsCategoryCountLoading(true);
    fetchParamsCount(`/api/params-count/?${catParams.toString()}`, signal)
      .then((json) => {
        if (!signal.aborted) {
          // Only overwrite if we got real data — never blank out categories with an empty array
          if (Array.isArray(json.data) && (json.data as []).length > 0) {
            setCategoryCounts(json.data as []);
          }
          setIsCategoryCountLoading(false);
          categoryFirstLoadDoneRef.current = true;
        }
      })
      .catch((e) => { if (e.name !== "AbortError") setIsCategoryCountLoading(false); });
    // ─── MAKE COUNTS ───
    const makeParams = buildCountParamsMulti(activeFilters, ["make", "model"]);
    makeParams.set("group_by", "make");
    fetchParamsCount(`/api/params-count/?${makeParams.toString()}`, signal)
      .then((json) => {
        if (!signal.aborted) {
          setMakeCounts((json.data as []) || []);
          setPopularMakes((json.popular_makes as []) || []);
        }
      })
      .catch((e) => { if (e.name !== "AbortError") console.error(e); });
    // ─── MODEL COUNTS ───
    const activeMake = activeFilters.make;
    if (activeMake) {
      const modelParams = buildCountParamsMulti(activeFilters, ["model"]);
      modelParams.set("group_by", "model");
      modelParams.set("make", activeMake);
      fetchParamsCount(`/api/params-count/?${modelParams.toString()}`, signal)
        .then((json) => { if (!signal.aborted) setModelCounts((json.data as []) || []); })
        .catch((e) => { if (e.name !== "AbortError") console.error(e); });
    } else {
      setModelCounts([]);
    }
    return () => controller.abort();
  }, [
    currentFilters.category, currentFilters.make, currentFilters.model, currentFilters.condition,
    currentFilters.state, currentFilters.region, currentFilters.suburb, currentFilters.from_price,
    currentFilters.to_price, currentFilters.minKg, currentFilters.maxKg, currentFilters.acustom_fromyears,
    currentFilters.acustom_toyears, currentFilters.from_length, currentFilters.to_length,
    currentFilters.from_sleep, currentFilters.to_sleep, currentFilters.search, currentFilters.keyword,
    filters.category, filters.make, filters.model, filters.state, filters.region, filters.suburb,
    filters.condition, filters.from_price, filters.to_price, filters.minKg, filters.maxKg,
    filters.acustom_fromyears, filters.acustom_toyears, filters.from_length,
    filters.to_length, filters.from_sleep, filters.to_sleep,
    filters.search,
    filters.keyword,
    tempCategory, selectedMakeTemp, tempModel, tempCondition,
    tempStateName, tempRegionName, modalKeyword, selectedSuggestion,
  ]);

  useEffect(() => {
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      category: categoryRef,
      sleep: sleepRef,
      year: yearRef,
      length: lengthRef,
      keyword: keywordRef,
    };
    const ref = focusSection ? refMap[focusSection] : null;
    if (ref?.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [focusSection]);
  return (
    <>
      <div className="filter-overlay">
        <div className="filter-modal">
          <div className="filter-header">
            <h3>Filters</h3>
            <button className="filter-close" onClick={onClose}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="100"
                height="100"
                viewBox="0 0 64 64"
              >
                <path d="M 16 14 C 15.488 14 14.976938 14.194937 14.585938 14.585938 C 13.804937 15.366937 13.804937 16.633063 14.585938 17.414062 L 29.171875 32 L 14.585938 46.585938 C 13.804938 47.366938 13.804937 48.633063 14.585938 49.414062 C 14.976937 49.805062 15.488 50 16 50 C 16.512 50 17.023062 49.805062 17.414062 49.414062 L 32 34.828125 L 46.585938 49.414062 C 47.366938 50.195063 48.633063 50.195062 49.414062 49.414062 C 50.195063 48.633062 50.195062 47.366937 49.414062 46.585938 L 34.828125 32 L 49.414062 17.414062 C 50.195063 16.633063 50.195062 15.366938 49.414062 14.585938 C 48.633062 13.804938 47.366937 13.804938 46.585938 14.585938 L 32 29.171875 L 17.414062 14.585938 C 17.023062 14.194938 16.512 14 16 14 z"></path>
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="filter-body">
            <>
              <div className="filter-item pt-0" ref={categoryRef}>
                <h4>Caravan Type</h4>
                <ul className="loc-state-list">
                  {categoryCounts.length === 0 ? (
                    <CategorySkeleton />
                  ) : (
                    categoryCounts.map((cat) => (
                      <li
                        key={cat.slug}
                        className="loc-state-item"
                        onClick={() => {
                          setTempCategory((prev) =>
                            prev === cat.slug ? null : cat.slug,
                          );
                          triggerOptimizeApi("category", cat.slug);
                        }}
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
              <div className="filter-item">
                <h4>Location</h4>
                <div className="location-list">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="location-item">
                        <label>State</label>
                        <select
                          className="cfs-select-input form-select"
                          value={tempStateName || ""}
                          onChange={(e) => {
                            const stateName = e.target.value;
                            // ✅ temp-ல மட்டும் store பண்ணு, API call இல்ல
                            setTempStateName(stateName || null);
                            setTempRegionName(null); // region reset
                          }}
                        >
                          <option value="">Any</option>
                          {states.map((state, index) => (
                            <option key={index} value={state.name}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="location-item">
                          <label>Region</label>
                          <select
                            className="cfs-select-input form-select"
                            value={tempRegionName || tempRegionNameRaw || ""}
                            disabled={!tempStateName}
                            onChange={(e) => {
                              setTempRegionName(e.target.value || null);
                              setTempRegionNameRaw(null);
                            }}
                          >
                            <option value="">Any</option>

                            {/* ✅ dropdown-ல் இல்லாத suburb-derived region-ஐ dynamic-ஆ add பண்ணு */}
                            {tempRegionNameRaw &&
                              !(
                                states.find(
                                  (s) =>
                                    s.name.toLowerCase() ===
                                    tempStateName?.toLowerCase(),
                                )?.regions || []
                              ).some(
                                (r) =>
                                  r.name.toLowerCase() ===
                                  tempRegionNameRaw.toLowerCase(),
                              ) && (
                                <option value={tempRegionNameRaw}>
                                  {tempRegionNameRaw}
                                </option>
                              )}

                            {(
                              states.find(
                                (s) =>
                                  s.name.toLowerCase() ===
                                  tempStateName?.toLowerCase(),
                              )?.regions || []
                            ).map((region, idx) => (
                              <option key={idx} value={region.name}>
                                {region.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
              <div className="filter-item search-filter">
                <h4>Suburb/Postcode</h4>
                <div className="search-box">
                  <div className="secrch_icon" style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <i
                        className="bi bi-search search-icon "
                        style={{
                          position: "absolute",
                          left: 10,
                          zIndex: 1,
                          pointerEvents: "none",
                        }}
                      ></i>
                      <input
                        type="text"
                        //placeholder="Suburb or postcode..."
                        className="filter-dropdown cfs-select-input"
                        autoComplete="off"
                        placeholder="Search suburb, postcode, state, region"
                        value={formatted(modalInput)} // 👈 modalInput} // 👈 use modalInput
                        onFocus={() => setShowSuggestions(true)}
                        onChange={(e) => {
                          // isUserTypingRef.current = true;
                          setShowSuggestions(true);
                          setSelectedSuggestion(null);

                          const rawValue = e.target.value;
                          // Format for filtering suggestions only
                          setModalInput(rawValue); // 👈 Store raw value
                          // const formattedValue = formatLocationInput(modalInput);
                          const formattedValue = /^\d+$/.test(rawValue)
                            ? rawValue // if user types only numbers, don’t format
                            : formatLocationInput(rawValue);

                          // Use the existing locationSuggestions state or fetch new data
                          // Since you're already fetching locations in useEffect, you can filter the existing suggestions
                          // OR trigger the same API call logic here
                          if (formattedValue.length < 1) {
                            setLocationSuggestions([]);
                            return;
                          }

                          // Use the same API call logic as in your useEffect
                          const suburb = formattedValue.split(" ")[0];
                          const reqId = ++locationReqIdRef.current;
                          setLocLoading(true);
                          fetchLocations(suburb)
                            .then((data) => {
                              if (reqId !== locationReqIdRef.current) return;
                              const searchValue = formattedValue.toLowerCase();
                              const isPostcode = /^\d+$/.test(formattedValue);
                              const filtered = data.filter((item) =>
                                item.short_address.toLowerCase().includes(searchValue) ||
                                item.address.toLowerCase().includes(searchValue) ||
                                (item.postcode && item.postcode.toString().includes(searchValue))
                              );
                              if (isPostcode) {
                                filtered.sort((a, b) => {
                                  const aExact = a.short_address.endsWith(formattedValue) || a.address.endsWith(formattedValue);
                                  const bExact = b.short_address.endsWith(formattedValue) || b.address.endsWith(formattedValue);
                                  if (aExact && !bExact) return -1;
                                  if (!aExact && bExact) return 1;
                                  return 0;
                                });
                              }
                              setLocationSuggestions(filtered);
                              setLocLoading(false);
                            })
                            .catch(() => setLocLoading(false));
                        }}
                        onBlur={() =>
                          setTimeout(() => setShowSuggestions(false), 150)
                        }
                      />
                    </div>
                    {showSuggestions && locLoading && modalInput && (
                      <ul className="location-suggestions">
                        {[1, 2, 3].map((i) => (
                          <li key={i} className="suggestion-skeleton">
                            <div className="skeleton-line" />
                          </li>
                        ))}
                      </ul>
                    )}
                    {showSuggestions && !locLoading && modalInput && locationSuggestions.length === 0 && (
                      <p className="suggestions-no-results">No results found</p>
                    )}
                    {showSuggestions && !locLoading && locationSuggestions.length > 0 && (
                      <ul className="location-suggestions">
                        {locationSuggestions.map((item, i) => {
                          const isSelected =
                            selectedSuggestion?.short_address ===
                            item.short_address;
                          return (
                            <li
                              key={i}
                              className={`suggestion-item ${
                                isSelected ? "selected" : ""
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();

                                isUserTypingRef.current = false;
                                setSelectedSuggestion(item);
                                setLocationInput(item.short_address);
                                setModalInput("");
                                setLocationSuggestions([]);
                                setShowSuggestions(false);
                                suburbClickedRef.current = true;

                                // ✅ Old code URI format: state/region/suburb/pincode
                                const uriParts = item.uri.split("/");
                                const stateSlug = uriParts[0] || ""; // ← state first
                                const regionSlug = uriParts[1] || ""; // ← region second
                                const suburbSlug = uriParts[2] || ""; // ← suburb third

                                const stateName = stateSlug
                                  .replace(/-state$/, "")
                                  .replace(/-/g, " ")
                                  .trim();
                                const regionName = regionSlug
                                  .replace(/-region$/, "")
                                  .replace(/-/g, " ")
                                  .trim();

                                const matchedState = states.find(
                                  (s) =>
                                    s.name.toLowerCase() ===
                                    stateName.toLowerCase(),
                                );
                                const canonicalStateName =
                                  matchedState?.name || stateName;

                                const validRegion = getValidRegionName(
                                  stateName,
                                  regionName,
                                  states,
                                );

                                const canonicalRegionName = getValidRegionName(
                                  canonicalStateName,
                                  regionName,
                                  states,
                                );

                                setTempStateName(canonicalStateName || null);
                                if (canonicalRegionName) {
                                  // ✅ Region exists in dropdown → show it selected
                                  setTempRegionName(canonicalRegionName);
                                  setTempRegionNameRaw(null);
                                } else {
                                  // ✅ Region NOT in dropdown → store raw for API use only, don't show in select
                                  setTempRegionName(null);
                                  setTempRegionNameRaw(regionName || null);
                                }
                              }}
                            >
                              {item.address}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {selectedSuggestion && !modalInput && (
                      <div style={{ marginTop: 8 }}>
                        <div className="filter-chip">
                          <span>{selectedSuggestion.address}</span>
                          <button
                            type="button"
                            className="filter-chip-close"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedSuggestion(null);
                              setLocationInput("");
                              setModalInput("");
                              setTempStateName(null);
                              setTempRegionName(null);
                              setTempRegionNameRaw(null);
                            }}
                            aria-label="Remove location"
                          >
                            ×
                          </button>
                        </div>
                        {selectedSuggestion.uri.split("/").filter(Boolean).length >= 3 && (
                          <div style={{ marginTop: 14 }}>
                            <div className="cfs-radius-label">Search surrounding area</div>
                            <div className="cfs-radius-wrap">
                              {(() => {
                                const idx = Math.max(0, RADIUS_OPTIONS.indexOf(radiusKms as (typeof RADIUS_OPTIONS)[number]));
                                const pct = (idx / (RADIUS_OPTIONS.length - 1)) * 100;
                                return (
                                  <>
                                    <div
                                      className="cfs-radius-tooltip"
                                      style={{ left: `calc(${pct}% + ${18 - 0.36 * pct}px)` }}
                                    >
                                      {radiusKms}km
                                    </div>
                                    <div className="cfs-radius-track-wrap">
                                      <input
                                        type="range"
                                        className="cfs-radius-slider"
                                        min={0}
                                        max={RADIUS_OPTIONS.length - 1}
                                        step={1}
                                        value={idx}
                                        style={{ background: `linear-gradient(to right, #f37920 0%, #f37920 ${pct}%, #ddd ${pct}%, #ddd 100%)` }}
                                        onChange={(e) => setRadiusKms(RADIUS_OPTIONS[parseInt(e.target.value, 10)])}
                                        aria-label="Search radius in kilometers"
                                      />
                                      {RADIUS_OPTIONS.map((km, i) => {
                                        const tickPct = (i / (RADIUS_OPTIONS.length - 1)) * 100;
                                        return (
                                          <span
                                            key={i}
                                            className={`cfs-radius-tick${i < idx ? " active" : i === idx ? " current" : ""}`}
                                            style={{ left: `calc(${tickPct}% + ${9 - 0.18 * tickPct}px)` }}
                                            title={`${km}km`}
                                          />
                                        );
                                      })}
                                    </div>
                                    <div className="cfs-radius-range">
                                      <span>{RADIUS_OPTIONS[0]}km</span>
                                      <span>{RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1].toLocaleString()}km</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="filter-item">
                <h4>Make & Model</h4>
                <div className="location-list">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="location-item">
                        <label>Make</label>
                        <select
                          className="cfs-select-input form-select"
                          value={selectedMakeTemp || ""}
                          onChange={(e) => {
                            const slug = e.target.value || null;
                            setSelectedMakeTemp(slug);
                            if (slug) triggerOptimizeApi("make", slug);
                          }}
                        >
                          <option value="">Any</option>
                          {displayedMakes.map((make, index) => (
                            <option key={index} value={make.slug}>
                              {make.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="location-item">
                          <label>Model</label>
                          <select
                            className="cfs-select-input form-select"
                            value={tempModel || ""}
                            disabled={!selectedMakeTemp}
                            onChange={(e) => {
                              const slug = e.target.value || null;
                              setTempModel(slug);
                              if (slug) triggerOptimizeApi("model", slug);
                            }}
                          >
                            <option value="">Any</option>
                            {(modelCounts.length > 0 ? modelCounts : model).map((mod, index) => (
                              <option key={index} value={mod.slug}>
                                {mod.name || mod.slug}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
              <div className="filter-item">
                <h4>ATM</h4>
                <div className="location-list">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="location-item">
                        <label>Min</label>
                        <select
                          className="cfs-select-input form-select"
                          value={tempAtmFrom ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setTempAtmFrom(val);
                            if (val) triggerOptimizeApi("atm", String(val));
                          }}
                        >
                          <option value="">Any</option>
                          {atm.map((v, index) => (
                            <option key={index} value={v}>
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
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setTempAtmTo(val);
                          }}
                        >
                          <option value="">Any</option>
                          {atm
                            .filter((v) => !tempAtmFrom || v > tempAtmFrom)
                            .map((v, index) => (
                              <option key={index} value={v}>
                                {v} kg
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="filter-item">
                <h4>Price</h4>
                <div className="location-list">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="location-item">
                        <label>Min</label>
                        <select
                          className="cfs-select-input form-select mb-3"
                          value={tempPriceFrom ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setTempPriceFrom(val);

                            // ✅ background optimize ONLY (no URL, no data)
                            triggerOptimizeApi("keyword", String(val));
                          }}
                        >
                          <option value="">Any</option>
                          {price.map((v, index) => (
                            <option key={index} value={v}>
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
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setTempPriceTo(val);
                          }}
                        >
                          <option value="">Any</option>
                          {price
                            .filter((v) => !tempPriceFrom || v > tempPriceFrom)
                            .map((v, index) => (
                              <option key={index} value={v}>
                                ${v.toLocaleString()}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="filter-item condition-field">
                <h4>Condition</h4>
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
              <div className="filter-item" ref={sleepRef}>
                <h4>Sleep</h4>
                <div className="location-list">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="location-item">
                        <label>Min</label>
                        <select
                          className="cfs-select-input form-select mb-3"
                          value={tempSleepFrom ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setTempSleepFrom(val);
                            triggerGlobalLoaders();
                            const updatedFilters: Filters = {
                              ...currentFilters,
                              from_sleep: val ?? undefined,
                              to_sleep: tempSleepTo ?? undefined,
                            };
                            setFilters(updatedFilters);
                            filtersInitialized.current = true;
                            startTransition(() => {
                              updateAllFiltersAndURL(updatedFilters);
                            });
                          }}
                        >
                          <option value="">Any</option>
                          {sleep.map((v, i) => (
                            <option key={i} value={v}>
                              {v}
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
                          value={tempSleepTo ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setTempSleepTo(val);
                            triggerGlobalLoaders();
                            const updatedFilters: Filters = {
                              ...currentFilters,
                              from_sleep: tempSleepFrom ?? undefined,
                              to_sleep: val ?? undefined,
                            };
                            setFilters(updatedFilters);
                            filtersInitialized.current = true;
                            startTransition(() => {
                              updateAllFiltersAndURL(updatedFilters);
                            });
                          }}
                        >
                          <option value="">Any</option>
                          {sleep
                            .filter((v) => !tempSleepFrom || v >= tempSleepFrom)
                            .map((v, i) => (
                              <option key={i} value={v}>
                                {v}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="filter-item" ref={yearRef}>
                <h4>Year</h4>
                <div className="location-list">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="location-item">
                        <label>From</label>
                        <select
                          className="cfs-select-input form-select"
                          value={tempYearFrom ?? ""}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            setTempYearFrom(val);
                          }}
                        >
                          <option value="">Any</option>
                          {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
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
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            setTempYearTo(val);
                          }}
                        >
                          <option value="">Any</option>
                          {years
                            .filter((y) => !tempYearFrom || y >= tempYearFrom)
                            .map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="filter-item" ref={lengthRef}>
                <h4>Length</h4>
                <div className="location-list">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="location-item">
                        <label>Min</label>
                        <select
                          className="cfs-select-input form-select mb-3"
                          value={tempLengthFrom ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setTempLengthFrom(val);
                          }}
                        >
                          <option value="">Any</option>
                          {length.map((v, index) => (
                            <option key={index} value={v}>
                              {v} ft
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
                          value={tempLengthTo ?? ""}
                          onChange={(e) => {
                            const val = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setTempLengthTo(val);
                          }}
                        >
                          <option value="">Any</option>
                          {length
                            .filter(
                              (v) => !tempLengthFrom || v > tempLengthFrom,
                            )
                            .map((v, index) => (
                              <option key={index} value={v}>
                                {v} ft
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="filter-item search-filter" ref={keywordRef}>
                <h4>Search by Keyword</h4>
                <div className="search-box">
                  <div className="secrch_icon">
                    <i className="bi bi-search search-icon"></i>
                    <input
                      type="text"
                      placeholder="Try caravans with bunks"
                      className="filter-dropdown cfs-select-input"
                      autoComplete="off"
                      value={modalKeyword}
                      onFocus={() => setShowKeywordSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowKeywordSuggestions(false), 200)}
                      onChange={(e) => {
                        pickedSourceRef.current = "typed";
                        setModalKeyword(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applyKeywordFromModal();
                      }}
                    />
                  </div>
                  {showKeywordSuggestions && (
                    <>
                      {/* Show base list when field is empty (<2 chars) */}
                      {modalKeyword.trim().length < 2 &&
                        (baseLoading ? (
                          <div style={{ marginTop: 8 }}>
                            <SearchSuggestionSkeleton
                              count={4}
                              label="Suggested searches"
                            />
                          </div>
                        ) : (
                          <div
                            style={{ marginTop: 8 }}
                            ref={(el) => { if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}
                          >
                            {/* 🏷 Title for base list */}
                            <h6 className="cfs-suggestion-title">
                              Popular searches
                            </h6>
                            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0", display: "block" }}>
                              {baseKeywords.length ? (
                                baseKeywords.map((k, i) => (
                                  <li
                                    key={`${k.label}-${i}`}
                                    style={{ padding: "10px 4px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 14, color: "#333" }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      pickedSourceRef.current = "base";
                                      setModalKeyword(k.label);
                                    }}
                                  >
                                    {k.label}
                                  </li>
                                ))
                              ) : (
                                <li style={{ padding: "10px 4px", color: "#888", fontSize: 14 }}>No popular items</li>
                              )}
                            </ul>
                          </div>
                        ))}

                      {/* Show typed suggestions when >=2 chars */}
                      {modalKeyword.trim().length >= 2 &&
                        (keywordLoading ? (
                          <div style={{ marginTop: 8 }}>
                            <SearchSuggestionSkeleton
                              count={4}
                              label="Suggested searches"
                            />
                          </div>
                        ) : (
                          <div
                            style={{ marginTop: 8 }}
                            ref={(el) => { if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}
                          >
                            {/* 🏷 Title for typed suggestions */}
                            <h6 className="cfs-suggestion-title">
                              Suggested searches
                            </h6>
                            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0", display: "block" }}>
                              {keywordSuggestions.length ? (
                                keywordSuggestions.map((k, i) => (
                                  <li
                                    key={`${k.label}-${i}`}
                                    style={{ padding: "10px 4px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: 14, color: "#333" }}
                                    onMouseDown={() => {
                                      pickedSourceRef.current = "typed";
                                      const keyword = k.label;
                                      setModalKeyword(keyword);
                                      setKeywordSuggestions([]);
                                      setBaseKeywords([]);
                                      setShowKeywordSuggestions(false);

                                      // ✅ Prevent re-trigger of fetch
                                      setKeywordLoading(false);
                                      setFilters((prev) => ({
                                        ...prev,
                                        search: toQueryPlus(keyword),
                                      }));
                                    }}
                                  >
                                    {k.label}
                                  </li>
                                ))
                              ) : (
                                <li style={{ padding: "10px 4px", color: "#888", fontSize: 14 }}>No matches</li>
                              )}
                            </ul>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </div>
            </>
          </div>

          {/* Footer */}
          <div className="filter-footer">
            <button
              className="clear"
              disabled={!hasAnyTempFilter}
              style={{
                opacity: hasAnyTempFilter ? 1 : 0.4,
                cursor: hasAnyTempFilter ? "pointer" : "not-allowed",
                color: hasAnyTempFilter ? "#ff6b00" : "#555", // ✅ orange
              }}
              onClick={() => {
                // ✅ Local temp states reset
                setTempCategory(null);
                setSelectedMakeTemp(null);
                setTempModel(null);
                setTempCondition(null);
                setTempAtmFrom(null);
                setTempAtmTo(null);
                setTempPriceFrom(null);
                setTempPriceTo(null);
                setTempSleepFrom(null);
                setTempSleepTo(null);
                setTempYearFrom(null);
                setTempYearTo(null);
                setTempLengthFrom(null);
                setTempLengthTo(null);
                setTempStateName(null);
                setTempRegionName(null);
                setTempRegionNameRaw(null);
                setModalInput("");
                setLocationInput("");
                setSelectedSuggestion(null);
                setModalKeyword("");
                suburbClickedRef.current = false;

                // ✅ Parent-ல் உள்ள resetAllFilters call பண்ணு
                if (onClearAll) onClearAll();

                // ✅ Modal close பண்ணு
                if (onClose) onClose();
              }}
            >
              Clear filters
            </button>
            <button
              className={`search ${hasAnyTempFilter ? "active" : "disabled"}`}
              disabled={!hasAnyTempFilter}
              onClick={handleMasterSearch}
            >
              Search
            </button>
          </div>
        </div>
      </div>
      
    </>
  );
};

export default FilterModal;
