import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import './category-take-over.css'

/* ── Meta Title & Description ── */
export const metadata: Metadata = {
  title: 'Hybrid Caravan Category Sponsorship | Australia-Wide Exposure',
  description:
    "Exclusive Off Road Caravan Listing Page Sponsorship for hybrid caravan advertisers. Limited to just 1 advertiser per month — maximum exposure, retargeting included, and 100% share of voice in the hybrid caravan category.",
}

export default function OffRoadCategoryTakeOver() {
  return (
    <main>

      {/* BEGIN: HeroSection */}
      <header className="hero-bg text-white d-flex flex-column">
        <div className="container py-5 px-lg-5">
          <div className="col-lg-8">
            <h1 className="display-4 font-black mb-3 text-uppercase tracking-tight">
              DOMINATE THE HYBRID <br className="d-none d-md-block" /> CARAVAN MARKET
            </h1>
            <p className="h4 fw-medium mb-5">
              Exclusive Off Road Caravan Listing Page Sponsorship for <span className="fw-bold">Advertisers</span> —{' '}
              {/* <br className="d-none d-md-block" /> */}
              Limited to Just 1 Spot Per Month
            </p>
            <div className="mb-4">
              <Link className="btn btn-caravan-orange px-5 py-3 fs-5" href="https://advertisers.caravansforsale.com.au/ad-signup-hybrid/">
                Claim Your Spot
              </Link>
            </div>
            <p className="small opacity-75">
              Strictly Limited to 1 Advertiser Per Month | Reserve Your Spot
            </p>
          </div>
        </div>
      </header>
      {/* END: HeroSection */}

      {/* BEGIN: ValuePropSection */}
      <section className="py-5 features-overview" data-purpose="features-overview" style={{ background: '#f1f1f1' }}>
        <div className="container">
          <h2 className="h3 font-black text-center mb-5">WHY INVEST IN HYBRID CARAVAN CATEGORY SPONSORSHIP?</h2>
          <div className="takeover_box">
            <div className="row g-0 max-width-6xl mx-auto">

              <div className="col-md-3 p-4 text-center border-end border-light feature-card" data-purpose="feature-card">
                <div className="icon-circle">
                  <Image src="/images/hometk_visible.png" alt="Maximum Exposure" width={72} height={72} />
                </div>
                <h3 className="fw-bold text-uppercase mb-3">MAXIMUM EXPOSURE</h3>
                <p>Be one of only two brands shown to highly interested hybrid caravan buyers.</p>
              </div>

              <div className="col-md-3 p-4 text-center border-end border-light feature-card" data-purpose="feature-card">
                <div className="icon-circle">
                  <Image src="/images/hometk_banners.png" alt="Exclusive Visibility" width={72} height={72} />
                </div>
                <h3 className="fw-bold text-uppercase mb-3">EXCLUSIVE VISIBILITY</h3>
                <p>Limited to just 1 advertiser per category. No competing brands - 100% share of voice.</p>
              </div>

              <div className="col-md-3 p-4 text-center border-end border-light feature-card" data-purpose="feature-card">
                <div className="icon-circle">
                  <Image src="/images/hometk_target.png" alt="High Buyer Intent" width={72} height={72} />
                </div>
                <h3 className="fw-bold text-uppercase mb-3">HIGH BUYER INTENT</h3>
                <p>Reach thousands of serious hybrid caravan enthusiasts searching for their next model.</p>
              </div>

              <div className="col-md-3 p-4 text-center feature-card" data-purpose="feature-card">
                <div className="icon-circle">
                  <Image src="/images/hometk_retargeting.png" alt="Retargeting Included" width={72} height={72} />
                </div>
                <h3 className="fw-bold text-uppercase mb-3">RETARGETING INCLUDED</h3>
                <p>We follow site visitors with your brand ads across the web - for maximum exposure.</p>
              </div>

            </div>
          </div>
        </div>
      </section>
      {/* END: ValuePropSection */}

      {/* BEGIN: MockupSection */}
      <section className="py-3" style={{ background: '#f1f1f1' }}>
        <div className="container">
          <div className="mockup-container">
            <div className="position-relative z-1 text-white">
              <div className="row justify-content-end mt-1 position-relative">
                <div className="col-12 col-md-12 pe-0">

                  <div className="browser-mockup">
                    <div className="browser-dots">
                      <div className="browser-dot bg-danger" />
                      <div className="browser-dot bg-warning" />
                      <div className="browser-dot bg-success" />
                    </div>
                    <div className="bg-white rounded-bottom overflow-hidden">
                      <Image
                        alt="Desktop Preview"
                        className="img-fluid"
                        src="/images/category_ad_screenshot.jpg"
                        width={1200}
                        height={600}
                        style={{ objectFit: 'cover', objectPosition: 'top' }}
                      />
                    </div>
                  </div>

                  <div className="mobile-mockup">
                    <div className="bg-white rounded overflow-hidden position-relative">
                      <Image
                        alt="Mobile Preview"
                        className="img-fluid"
                        src="/images/category_ad_screenshot-m.jpg"
                        width={160}
                        height={280}
                        style={{ width: '100%', objectFit: 'cover' }}
                      />
                      <div className="position-absolute inset-0 bg-dark bg-opacity-50 d-flex flex-column justify-content-end p-3">
                        <button
                          className="btn btn-caravan-orange w-100 py-2 small tracking-widest"
                          style={{ fontSize: '10px' }}
                        >
                          Discover Models
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: MockupSection */}

      {/* BEGIN: MarketingPackageSection */}
      <section className="py-5 htk_keywords" style={{ background: '#f1f1f1' }}>
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="h3 font-black text-navy mb-2 text-uppercase">
              THE ULTIMATE HYBRID CARAVAN MARKETING PACKAGE
            </h2>
            <p className="h5 text-dark fw-medium">
              A complete lead generation solution for your caravan brand
            </p>
          </div>
          <div className="row g-4 justify-content-center">

            <div className="col-md-5">
              <div className="package-card d-flex shadow-card" data-purpose="package-item">
                <div className="me-4 text-navy">
                  <Image src="/images/hometk_tablet.png" alt="Premium Category Sponsorship" width={48} height={48} />
                </div>
                <div>
                  <h4 className="fw-bold text-uppercase" style={{ color: 'var(--caravan-orange)' }}>
                    PREMIUM CATEGORY SPONSORSHIP
                  </h4>
                  <p className="small fw-medium m-0 lh-base">
                    Your brand in the top-of page position for hybrid caravans.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="package-card d-flex shadow-card" data-purpose="package-item">
                <div className="me-4 text-navy">
                  <Image src="/images/hometk_retarget.png" alt="Retargeting Campaign" width={48} height={48} />
                </div>
                <div>
                  <h4 className="fw-bold text-uppercase" style={{ color: 'var(--caravan-orange)' }}>
                    RETARGETING CAMPAIGN
                  </h4>
                  <p className="small fw-medium m-0 lh-base">
                    We keep your brand top-of mind by following visitors across the web.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="package-card d-flex shadow-card" data-purpose="package-item">
                <div className="me-4 text-navy">
                  <Image src="/images/hometk_check.png" alt="Exclusive Share of Voice" width={48} height={48} />
                </div>
                <div>
                  <h4 className="fw-bold text-uppercase" style={{ color: 'var(--caravan-orange)' }}>
                    EXCLUSIVE SHARE OF VOICE
                  </h4>
                  <p className="small fw-medium m-0 lh-base">
                    Limited to just 2 advertisers per category. You get 100% share of voice in hybrid Caravans.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="package-card d-flex shadow-card" data-purpose="package-item">
                <div className="me-4 text-navy">
                  <Image src="/images/hometk_gps.png" alt="Aggressive Targeting" width={48} height={48} />
                </div>
                <div>
                  <h4 className="fw-bold text-uppercase" style={{ color: 'var(--caravan-orange)' }}>
                    AGGRESSIVE TARGETING
                  </h4>
                  <p className="small fw-medium m-0 lh-base">
                    We target users actively searching for hybrid caravans.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* END: MarketingPackageSection */}

      {/* BEGIN: CTAFooterBanner */}
      <footer className="footer-bg py-5 text-white">
        <div className="container py-4 text-center">
          <h2 className="h3 font-black mb-5 text-uppercase" style={{ letterSpacing: '0.1em' }}>
            Only 1 Spot Available Per Month
          </h2>
          <div className="row align-items-center justify-content-center g-4">
            <div className="col-auto">
              <div className="display-4 font-black d-flex align-items-baseline tracking-tight">
                $1000{' '}
                <span className="h6 fw-semibold ms-3 text-uppercase tracking-widest opacity-75">
                  Month + GST
                </span>
              </div>
            </div>
            <div className="col-auto">
              <Link
                className="btn btn-caravan-orange btn-lg px-5 py-3 fs-4 shadow-lg"
                href="https://advertisers.caravansforsale.com.au/ad-signup-hybrid/"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      </footer>
      {/* END: CTAFooterBanner */}

    </main>
  )
}