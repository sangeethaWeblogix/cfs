import { Filters } from "@/app/components/urlBuilder";

export function validateFilters(filters: Filters): boolean {
  const validPrice = [
    10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000,
    125000, 150000, 175000, 200000, 225000, 250000, 275000, 300000,
  ];
  const validATM = [
    600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000,
    4500,
  ];
  const validLength = [
    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const validSleeps = [1, 2, 3, 4, 5, 6, 7];
  const validYears = [
    2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014,
    2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 1994, 1984,
    1974, 1964, 1954, 1944, 1934, 1924, 1914,
  ];

  // --- Region and suburb rules ---
  if (filters.region && !filters.state) return false;
  if (filters.suburb) {
    if (!filters.pincode || !filters.state) return false;
    if (filters.region) return false;
  }
  if (filters.suburb === "" || filters.suburb === undefined) return false;

  // --- ATM validation ---
  if (
    (filters.minKg && !validATM.includes(Number(filters.minKg))) ||
    (filters.maxKg && !validATM.includes(Number(filters.maxKg)))
  )
    return false;

  // --- Length validation ---
  if (
    (filters.from_length &&
      !validLength.includes(Number(filters.from_length))) ||
    (filters.to_length && !validLength.includes(Number(filters.to_length)))
  )
    return false;

  // --- Sleeps validation ---
  if (filters.sleeps) {
    const num = Number(filters.sleeps.replace("-people", ""));
    if (!validSleeps.includes(num)) return false;
  }

  // --- Price validation ✅ ---
  if (
    (filters.from_price && !validPrice.includes(Number(filters.from_price))) ||
    (filters.to_price && !validPrice.includes(Number(filters.to_price)))
  )
    return false;

  // --- Year validation ---
  if (
    (filters.acustom_fromyears &&
      !validYears.includes(Number(filters.acustom_fromyears))) ||
    (filters.acustom_toyears &&
      !validYears.includes(Number(filters.acustom_toyears)))
  )
    return false;

  // --- Postcode validation ---
  if (filters.pincode && !/^\d{4}$/.test(filters.pincode)) return false;

  return true;
}
