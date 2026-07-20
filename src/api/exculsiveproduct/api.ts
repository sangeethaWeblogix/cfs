const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export interface ExclusiveProduct {
  id: number;
  name: string;
  length: string;
  kg: string;
  regular_price: string;
  sale_price?: string;
  price_difference?: string;
  image: string;
  link: string;
  condition: string;
  location?: string;
  categories?: string[];
  people?: string;
  make?: string;
  slug?: string;
  description?: string;
  is_exclusive: boolean;
}

export interface ExclusiveApiResponse {
  success: boolean;
  data: {
    products: ExclusiveProduct[];
  };
  pagination: {
    current_page: number;
    per_page: number;
    total_products: number;
    total_pages: number;
  };
}

export interface ExclusivePageResult {
  items: ExclusiveProduct[];
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  perPage: number;
}

/**
 * ✅ Fetch Exclusive Products List (with proper pagination)
 */
export const fetchExclusiveListings = async (
  page: number = 1
): Promise<ExclusivePageResult> => {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_CFS_API_BASE");

  const url = `${API_BASE}/exclusive-list?page=${page}`;
  // console.log("📡 Fetching Exclusive API:", url);

  const res = await fetch(url, {
    method: "GET",
 headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ API key added
      },    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Exclusive API failed: ${res.status}`);

  const data: ExclusiveApiResponse = await res.json();

  const products = data?.data?.products ?? [];
  const { current_page, total_pages, total_products, per_page } =
    data?.pagination ?? {};
  // console.log("api pagination", data?.pagination);
  return {
    items: products,
    currentPage: current_page,
    totalPages: total_pages,
    totalProducts: total_products,
    perPage: per_page,
  };
};
