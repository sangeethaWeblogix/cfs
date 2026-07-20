 // app/410/page.tsx
import "./page.css";
import ListingsPage from "@/app/components/ListContent/Listings";
import "../listings/listings.css";
import "../components/ListContent/newList.css";
import { headers } from "next/headers";
import { parseSlugToFilters } from "@/app/components/urlBuilder";
import { getCachedListings } from "@/api/listings/api";
import { fetchProductList, fetchCategoryCounts, fetchMakeCounts } from "@/api/productList/api";
export const metadata = {
  title: "410 - Page Permanently Removed | Caravans For Sale",
  description:
    "This page has been permanently removed and is no longer available.",
  robots: { index: false, follow: false },
};

export default async function GonePage() {
  // The middleware rewrites to /410/ but the original URL is still in x-pathname
  const headersList = await headers();
  const originalPathname = headersList.get("x-pathname") || "";

  // Only attempt data fetch if this came from a /listings/... rewrite
  if (originalPathname.startsWith("/listings")) {
    try {
      const slugParts = originalPathname
        .replace("/listings", "")
        .split("/")
        .filter(Boolean);

      const filters = parseSlugToFilters(slugParts, {});

      const [response, productListData, initialCategoryCounts, initialMakeCounts] =
        await Promise.all([
          getCachedListings({ ...filters, page: 1 }),
          fetchProductList(),
          fetchCategoryCounts(),
          fetchMakeCounts(),
        ]);

      const empExclusiveProducts = response?.data?.emp_exclusive_products;
      const hasEmpExclusive =
        Array.isArray(empExclusiveProducts) && empExclusiveProducts.length > 0;

      if (hasEmpExclusive) {
        return (
          <ListingsPage
            initialData={response}
            productListData={productListData}
            initialCategoryCounts={initialCategoryCounts}
            initialMakeCounts={initialMakeCounts}
            initialDistances={{}}
            page={1}
          />
        );
      }
    } catch {
      // Fall through to 410 UI
    }
  }

  return (
    <div className="page-wrap-410">
      <div className="card-410">
        <p className="err-number-410" aria-hidden="true">410</p>
        <h1 className="err-title-410">Page Permanently Removed</h1>
        <p className="err-desc-410">
          The page you requested has been permanently removed and is no longer available.
        </p>
      </div>
    </div>
  );
}