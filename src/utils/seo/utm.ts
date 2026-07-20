// utils/utm.ts
export const storeUTM = () => {
  if (typeof window === "undefined") return;

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get("utm_source");
  const utmMedium = urlParams.get("utm_medium");
  const utmCampaign = urlParams.get("utm_campaign");

  if (utmSource || utmMedium || utmCampaign) {
    localStorage.setItem("utm_source", utmSource || "");
    localStorage.setItem("utm_medium", utmMedium || "");
    localStorage.setItem("utm_campaign", utmCampaign || "");
  }
};
