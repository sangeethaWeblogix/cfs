export default function NavbarSkeleton() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light style-4 header-white">
      <div className="container">
        <div className="logo_left">
          <a className="navbar-brand" href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cfs-logo-black.svg"
              alt="Caravans For Sale"
              width={150}
              height={50}
            />
          </a>
        </div>
        <div className="header_right_info">
          <button
            className="navbar-toggler hidden-xs hidden-sm"
            type="button"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarSupportedContent">
            <ul className="navbar-nav mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="/sell-my-caravan/">Sell My Caravan</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/dealer-advertising/">Dealer Advertising</a>
              </li>
              <li className="nav-item login">
                <a className="nav-link" href="/login/">
                  <i className="bi bi-person-fill"></i> Login
                </a>
              </li>
            </ul>
          </div>
          <div className="left_menu">
            <label className="menuIconToggle" aria-label="Open navigation menu">
              <div className="hamb-line dia p-1"></div>
              <div className="hamb-line hor"></div>
              <div className="hamb-line dia p-2"></div>
            </label>
          </div>
        </div>
      </div>
    </nav>
  );
}
