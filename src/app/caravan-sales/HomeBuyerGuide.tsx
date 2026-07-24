import Image from "next/image";

export default function HomeBuyerGuide() {
  return (
    <>
      {/* ── Buyer Guide ── */}
      <section className="hbg-section">
        <div className="container">
          <div className="hbg-row">

            {/* Left: Image */}
            <div className="hbg-img-col">
              <div className="hbg-img-wrap">
                <Image
                  src="/images/buyers_guid.jpg"
                  alt="Caravans for Sale Australia"
                  width={600}
                  height={420}
                  className="hbg-img"
                  unoptimized
                />
                <div className="hbg-badge">
                  <svg className="hbg-badge-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                  <span className="hbg-badge-text">AUSTRALIA&apos;S TRUSTED<br />CARAVAN MARKETPLACE</span>
                </div>
              </div>
            </div>

            {/* Right: Text */}
            <div className="hbg-text-col">
              <h2 className="hbg-title">
                Caravan Sales Australia: Buyers Guide
              </h2>
              
              <p className="hbg-body">
                CaravansForSale.com.au helps Australian buyers compare a wide range of active caravan sales in one convenient place. Browse affordable used caravan sales, premium new models, and options designed for touring, family holidays, or off-road adventures. Compare important features such as layout, ATM, tare weight, sleeping capacity, length, suspension, condition, service history, and towing requirements to narrow down your choices before contacting a seller or visiting a dealership. Our easy-to-use platform makes researching and comparing caravan sales simple.
              </p>
              <p className="hbg-body">
                Explore popular categories including off-road, hybrid, pop-top, touring, and luxury caravan sales, while also comparing trusted brands and reputable dealers across Australia. Check whether dealers offer warranty support, finance options, trade-ins, after-sales service, and detailed vehicle information before making your decision. Use our buyers guide and convenient search filters to browse caravan sales by state, location, budget, size, weight, and berth, helping you find the right van for your lifestyle and travel plans.
              </p>
              
            </div>

          </div>
        </div>
      </section>

      {/* ── Why Australians ── */}
      <section className="hbg-why-section">
        <div className="container">
          <h2 className="hbg-why-title">
            Why caravansforsale.com.au is your best choice <span className="hbg-why-accent">for caravan sales across Australia</span>
          </h2>
          

          <div className="hbg-why-cards-wrap">
            <div className="hbg-why-grid">

              <div className="hbg-why-card">
                <div className="hbg-why-icon">
                  <Image src="/images/caravan_black.png" alt="Huge Selection" width={34} height={34} />
                </div>
                <h3 className="hbg-why-card-title">Huge Selection</h3>
                <div className="hbg-why-card-sep" />
                <p className="hbg-why-card-desc">Thousands of new and used caravans from dealers and private sellers across Australia.</p>
              </div>

              <div className="hbg-why-card">
                <div className="hbg-why-icon">
                  <Image src="/images/map.png" alt="Australia Wide" width={34} height={34} />
                </div>
                <h3 className="hbg-why-card-title">Australia Wide</h3>
                <div className="hbg-why-card-sep" />
                <p className="hbg-why-card-desc">Listings from every state and territory so you can buy locally or anywhere in Australia.</p>
              </div>

              <div className="hbg-why-card">
                <div className="hbg-why-icon">
                  <Image src="/images/shield.png" alt="Trusted & Secure" width={34} height={34} />
                </div>
                <h3 className="hbg-why-card-title">Trusted & Secure</h3>
                <div className="hbg-why-card-sep" />
                <p className="hbg-why-card-desc">Enquire with confidence through verified sellers on a safe and secure platform.</p>
              </div>

              <div className="hbg-why-card">
                <div className="hbg-why-icon">
                  <Image src="/images/dollar_au.png" alt="Best Prices" width={34} height={34} />
                </div>
                <h3 className="hbg-why-card-title">Best Prices</h3>
                <div className="hbg-why-card-sep" />
                <p className="hbg-why-card-desc">Compare prices, features and layouts to find the best value for your budget.</p>
              </div>

              <div className="hbg-why-card">
                <div className="hbg-why-icon">
                  <Image src="/images/check.png" alt="Dealers & Private Sellers" width={34} height={34} />
                </div>
                <h3 className="hbg-why-card-title">Dealers & Private Sellers</h3>
                <div className="hbg-why-card-sep" />
                <p className="hbg-why-card-desc">Access a wide range of stock from licensed dealers and genuine private sellers.</p>
              </div>

            </div>
          </div>

          
        </div>
      </section>
    </>
  );
}
