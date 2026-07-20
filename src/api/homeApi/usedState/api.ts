const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export const fetchUsedStateBasedCaravans = async () => {
  const res = await fetch(`${API_BASE}/used-caravans-by-state`, {
    next: { revalidate: 3600 },
     headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ API key added
      },
  });

  const json = await res.json();
  return json?.states || [];
};
