import "./footer.css?=20";
import Image from "next/image";
import BackToTopButton from "./BackToTopButton";
import FooterNav from "./FooterNav";
import FooterPopularLocations from "./FooterPopularLocations";
import SellByLocationLink from "./SellByLocationLink";

const BROWSE_LINKS = [
  { label: "All Caravans for Sale", href: "/listings/" },
  { label: "New Caravans", href: "/listings/new-condition/" },
  { label: "Used Caravans", href: "/listings/used-condition/" },
  { label: "Off Road Caravans", href: "/listings/off-road-category/" },
  { label: "Hybrid Caravans", href: "/listings/hybrid-category/" },
  { label: "Pop Top Caravans", href: "/listings/pop-top-category/" },
  { label: "Touring Caravans", href: "/listings/touring-category/" },
  { label: "Luxury Caravans", href: "/listings/luxury-category/" },
];

const LOCATION_LINKS = [
  { label: "Victoria", href: "/listings/victoria-state/" },
  { label: "New South Wales", href: "/listings/new-south-wales-state/" },
  { label: "Queensland", href: "/listings/queensland-state/" },
  { label: "Western Australia", href: "/listings/western-australia-state/" },
  { label: "South Australia", href: "/listings/south-australia-state/" },
  { label: "Tasmania", href: "/listings/tasmania-state/" },
];

/** Same city set as the home page's "Find Caravans for Sale by Popular
 * Location" section (HomeLocationSection.tsx) — major + minor cities. */
const POPULAR_LOCATIONS = [
  { label: "Adelaide", href: "/listings/south-australia-state/adelaide-region/" },
  { label: "Brisbane", href: "/listings/queensland-state/brisbane-region/" },
  { label: "Gold Coast", href: "/listings/queensland-state/gold-coast-region/" },
  { label: "Melbourne", href: "/listings/victoria-state/melbourne-region/" },
  { label: "Perth", href: "/listings/western-australia-state/perth-region/" },
  { label: "Sydney", href: "/listings/new-south-wales-state/sydney-region/" },
  { label: "Cairns", href: "/listings/queensland-state/cairns-region/" },
  { label: "Canberra", href: "/listings/australian-capital-territory-state/australian-capital-territory-region/" },
  { label: "Darwin", href: "/listings/northern-territory-state/darwin-region/" },
  { label: "Geelong", href: "/listings/victoria-state/geelong-region/" },
  { label: "Hobart", href: "/listings/tasmania-state/hobart-region/" },
  { label: "Newcastle", href: "/listings/new-south-wales-state/newcastle-region/" },
  { label: "Sunshine Coast", href: "/listings/queensland-state/sunshine-coast-region/" },
  { label: "Townsville", href: "/listings/queensland-state/townsville-region/" },
  { label: "Wollongong", href: "/listings/new-south-wales-state/illawarra-region/" },
  { label: "Ballarat", href: "/listings/victoria-state/ballarat-region/" },
];

const SELLER_LINKS = [
  { label: "Sell My Caravan", href: "/sell-my-caravan/" },
  { label: "Sell by Location", href: "#footer-sell-by-location" },
  { label: "Seller Login", href: "https://seller.marketplacenetwork.com.au/seller-login/" },
];

const DEALER_LINKS = [
  { label: "Dealer Login", href: "https://seller.marketplacenetwork.com.au/seller-login/" },
  { label: "Dealer Advertising", href: "/dealer-advertising/" },
  { label: "Dealer Sign Up", href: "https://seller.marketplacenetwork.com.au/caravan-dealer-subscription/" },
];

const GUIDE_LINKS = [
  { label: "Off Road Caravan Hub", href: "/off-road-caravans/", accent: true },
  { label: "Blog", href: "/blog/" },
  { label: "Buyer Safety Guide", href: "/buyer-safety-guide/", nofollow: true },
  { label: "About Us", href: "/about-us/" },
  { label: "Contact Us", href: "/contact/" },
];

const NETWORK_SITES = [
  { logo: "/images/our_sites/cfs-logo-black.svg", w: 556, h: 60, href: "", label: "Caravans" },
  { logo: "/images/our_sites/mfs-logo.svg", w: 633, h: 63, href: "https://www.motorhomesforsale.com.au/", label: "Motorhomes" },
  { logo: "/images/our_sites/camper_logo.svg", w: 1159, h: 141, href: "https://www.campervansforsale.au/", label: "Campervans" },
  { logo: "/images/our_sites/cts-logo.svg", w: 688, h: 64, href: "https://www.campingtrailersforsale.com.au/", label: "Camper Trailers" },
];

const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: "/terms-conditions/" },
  { label: "Privacy Policy", href: "/privacy-policy/" },
  { label: "Privacy Collection Statement", href: "/privacy-collection-statement/" },
  { label: "Cookie Policy", href: "/cookie-policy/" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="cfs-footer">
        <div className="container">
          {/* ── Link columns ── */}
          <div className="cfs-footer__columns">
            <div className="cfs-footer__col">
              <h4 className="cfs-footer__col-title">Browse Caravans</h4>
              <ul>
                {BROWSE_LINKS.map((l) => (
                  <li key={l.label}><a href={l.href}>{l.label}</a></li>
                ))}
              </ul>
            </div>

            <div className="cfs-footer__col">
              <h4 className="cfs-footer__col-title">Browse by State</h4>
              <ul>
                {LOCATION_LINKS.map((l) => (
                  <li key={l.label}><a href={l.href}>{l.label}</a></li>
                ))}
              </ul>
            </div>

            <div className="cfs-footer__col">
              <h4 className="cfs-footer__col-title">Popular Locations</h4>
              <FooterPopularLocations locations={POPULAR_LOCATIONS} initialCount={7} />
            </div>

            <div className="cfs-footer__col">
              <h4 className="cfs-footer__col-title">Private Sellers</h4>
              <ul>
                {SELLER_LINKS.map((l) => (
                  <li key={l.label}>
                    {l.href === "#footer-sell-by-location" ? (
                      <SellByLocationLink label={l.label} />
                    ) : (
                      <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>

              <h4 className="cfs-footer__col-title cfs-footer__col-title--sub">For Dealers</h4>
              <ul>
                {DEALER_LINKS.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cfs-footer__col">
              <h4 className="cfs-footer__col-title">Guides &amp; Support</h4>
              <ul>
                {GUIDE_LINKS.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={l.accent ? "cfs-footer__link--accent" : undefined} rel={l.nofollow ? "nofollow" : undefined}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <hr className="cfs-footer__hr" />

          {/* ── Marketplace network ── */}
          <div className="cfs-footer__network">
            <h4 className="cfs-footer__network-title">Our Marketplace Network</h4>
            <div className="cfs-footer__network-grid">
              {NETWORK_SITES.map((s) =>
                s.href ? (
                  <a key={s.logo} href={s.href} target="_blank" rel="noopener noreferrer" className="cfs-footer__network-card">
                    <Image src={s.logo} alt={s.label} width={s.w} height={s.h} className="cfs-footer__network-logo" unoptimized />
                  </a>
                ) : (
                  <div key={s.logo} className="cfs-footer__network-card cfs-footer__network-card--current">
                    <Image src={s.logo} alt={s.label} width={s.w} height={s.h} className="cfs-footer__network-logo" unoptimized />
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── Sell my caravan by location (accordion) ── */}
          <div id="footer-sell-by-location">
            <FooterNav />
          </div>

          {/* ── Bottom bar ── */}
          <div className="cfs-footer__bottom">
            <ul className="cfs-footer__legal">
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}><a href={l.href} rel="nofollow">{l.label}</a></li>
              ))}
            </ul>
            <p className="cfs-footer__copyright">
              © {currentYear ?? "----"} Marketplace Network Pty Ltd&nbsp;&nbsp;·&nbsp;&nbsp;ABN 70 694 987 052
            </p>
          </div>
        </div>
      </footer>

      {/* To Top Button */}
      <BackToTopButton />
    </>
  );
};

export default Footer;
