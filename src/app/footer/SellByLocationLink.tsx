"use client";

/** The "Sell by Location" link in the Private Sellers column — scrolls to
 * the accordion bar at the bottom of the footer and opens it. A plain
 * #footer-sell-by-location hash link only fires a native scroll once (no
 * "hashchange" event on a repeat click when the hash hasn't changed), so
 * closing the panel and clicking again wouldn't reopen it — dispatch a
 * custom event instead, which FooterNav listens for every time. */
export default function SellByLocationLink({ label }: { label: string }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new Event("open-sell-by-location"));
    document.getElementById("footer-sell-by-location")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <a href="#footer-sell-by-location" onClick={handleClick}>
      {label}
    </a>
  );
}
