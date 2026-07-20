


export default function LoginPage() {
  return (
    <section className="login_page section-padding pt-30 pb-30 style-1">
      <div className="auth-container">
        <div className="auth-sidebar">
          <div>
            <h2>Welcome to the CFS Network</h2>
          </div>

          <div
            className="login-grid"
            role="navigation"
            aria-label="Login options"
          >
            {/* Private Seller */}
            <a
              className="login-card private"
              href="https://seller.caravansforsale.com.au/seller-login/"
              aria-label="Private Seller Login"
            >
              <div className="login-icon" aria-hidden="true">
                <i className="bi bi-person-fill"></i>
              </div>

              <div className="login-body">
                <div className="login-title">Private Seller Login</div>
                <div className="login-sub">
                  Manage or list your caravan for sale
                </div>
              </div>
            </a>

            {/* Dealer */}
            <a
              className="login-card dealer"
              href="https://seller.caravansforsale.com.au/subscriber-login/"
              aria-label="Dealer Login"
            >
              <div className="login-icon" aria-hidden="true">
                <i className="bi bi-briefcase-fill"></i>
              </div>

              <div className="login-body">
                <div className="login-title">Dealer Login</div>
                <div className="login-sub">
                  Access dealer tools and manage caravan listings
                </div>
              </div>
            </a>
          </div>

          {/*<div className="social">
            <span className="text">
              Grow your caravan dealership with unlimited listings and
              high-intent buyer leads. Reach serious caravan shoppers across
              Australia with CFS.
            </span>
          </div> */}
        </div>
      </div>
    </section>
  );
}
