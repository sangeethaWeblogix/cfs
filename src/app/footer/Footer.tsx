import "./footer.css?=19";
// import {
//   FaFacebookF,
//   FaInstagram,
//   FaYoutube,
//   FaPinterestP,
// } from "react-icons/fa";
import BackToTopButton from "./BackToTopButton";
import FooterNav from "./FooterNav";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="style-8">
        <div className="container">
          <div className="foot py-4  brd-gray">
            <div className="row">
              {/* Left Column */}
              <div className="col-lg-12">
                <h6 className="foot-title hidden-lg hidden-md hidden-sm foot_xs">Marketplace Network</h6>
                {/* FooterNav contains the nav ul + Sell dropdown panel as a sibling div */}
                <FooterNav />
                <div>
                  <p>
                    © {currentYear ?? "----"} Marketplace Network Pty Ltd (ABN 70 694 987 052)
                  </p>
                </div>
              </div>
            </div>

            {/* Social Icons (commented out) */}
            {/*<div className="content mt-3">
              <div className="foot-info logo-social">
                <div className="socials">
                  <a
                    href="https://www.facebook.com/caravansforsale.com.au"
                    className="facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaFacebookF />
                  </a>
                  <a
                    href="https://www.instagram.com/caravansforsale.com.au"
                    className="instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href="https://x.com/CaravanMarketPL"
                    className="twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="currentColor"
                      className="bi bi-twitter-x"
                      viewBox="0 0 16 19"
                    >
                      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@caravansforsalecomau"
                    className="youtube"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaYoutube />
                  </a>
                  <a
                    href="https://au.pinterest.com/caravansforsalecomau/"
                    className="pinterest"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaPinterestP />
                  </a>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </footer>

      {/* To Top Button */}
      <BackToTopButton />
    </>
  );
};

export default Footer;
