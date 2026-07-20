import { useEffect, useRef } from "react";

type Banner = {
  id: number;
};

export function useBannerTracking(banners: Banner[]) {
  const bannerRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const getSessionId = () => {
    let sid = sessionStorage.getItem("blr_session");
    if (!sid) {
      sid =
        "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("blr_session", sid);
    }
    return sid;
  };

  const getDeviceType = () => {
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  };

  const getIP = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip || "";
    } catch {
      return "";
    }
  };

  const track = async (bannerId: number, eventType: "click" | "impression") => {
    const ip = await getIP();

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_CF7_BASE || "https://admin.caravansforsale.com.au"}/wp-json/ads-manager/v1/banners/track`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            banner_id: bannerId,
            event_type: eventType,
            session_id: getSessionId(),
            page_url: window.location.href,
            device_type: getDeviceType(),
            user_agent: navigator.userAgent,
            ip_address: ip,
          }),
        },
      );
    } catch (e) {}
  };

  useEffect(() => {
    if (!banners.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const bannerId = Number(entry.target.getAttribute("data-banner-id"));

          if (!bannerId) return;

          track(bannerId, "impression");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 },
    );

    bannerRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [banners]);

  const trackClick = (bannerId: number) => {
    track(bannerId, "click");
  };

  return { bannerRefs, trackClick };
}
