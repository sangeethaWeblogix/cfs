const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this


export const fetchFeaturedUsedCaravans = async () => {
  try {
    const res = await fetch(
      `${API_BASE}/featured-used-caravans`,
      {
        cache: "no-store", // always fresh
       headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ Missing — add this
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch featured used caravans");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("fetchFeaturedUsedCaravans error:", error);
    return null;
  }
};
