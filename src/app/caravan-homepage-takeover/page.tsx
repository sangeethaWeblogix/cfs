import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import './home-page-take-over.css'

/* ── Meta Title & Description ── */
export const metadata: Metadata = {
  title: 'Home Page Takeover Advertising | #1 Caravan Brand Exposure Australia-Wide',
  description:
    "Dominate Australia's leading caravan marketplace with our exclusive Home Page Takeover. Limited to 1 advertiser per month — maximum visibility, retargeting included, and 100% share of voice for your caravan brand.",
}

export default function HomePageTakeOver() {
  return (
    <main>

      {/* BEGIN: HeroSection */}
      <header className="hero-bg text-white d-flex flex-column">
        <div className="container py-5 px-lg-5">
          <div className="col-lg-8">
            {/* <h1 className="display-4 font-black mb-3 text-uppercase tracking-tight">
              Become the #1 Caravan <br className="d-none d-md-block" /> Brand Australia-Wide
            </h1> */}
            <h1 className="display-4 font-black mb-3 text-uppercase tracking-tight">
             Get your Brand Across 1000's of Caravan Buyers Daily  
            </h1>
            <p className="h4 fw-medium mb-5">
              Exclusive Home Page Takeover for <span className="fw-bold">Advertisers</span> —{' '}
              <br className="d-none d-md-block" />
              Limited to Just 1 Advertiser Per Month
            </p>
            <div className="mb-4">
              <Link className="btn btn-caravan-orange px-5 py-3 fs-5" href="https://advertisers.caravansforsale.com.au/ad-signup-home/">
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
          <h2 className="h3 font-black text-center mb-5">Why Choose Our Home Page Takeover?</h2>
          <div className="takeover_box">
            <div className="row g-0 max-width-6xl mx-auto">

              <div className="col-md-3 p-4 text-center border-end border-light feature-card" data-purpose="feature-card">
                <div className="icon-circle">
                  <Image src="/images/hometk_visible.png" alt="Maximum Visibility" width={72} height={72} />
                </div>
                <h3 className="fw-bold text-uppercase mb-3">Maximum Visibility</h3>
                <p>Be the first thing every buyer sees. Your brand dominates our home page.</p>
              </div>

              <div className="col-md-3 p-4 text-center border-end border-light feature-card" data-purpose="feature-card">
                <div className="icon-circle">
                  <Image src="/images/hometk_banners.png" alt="Exclusive Placement" width={72} height={72} />
                </div>
                <h3 className="fw-bold text-uppercase mb-3">Exclusive Placement</h3>
                <p>Limited to just 1 advertiser per month. No competing brands - 100% share of voice.</p>
              </div>

              <div className="col-md-3 p-4 text-center border-end border-light feature-card" data-purpose="feature-card">
                <div className="icon-circle">
                  <Image src="/images/hometk_target.png" alt="High-Intent Audience" width={72} height={72} />
                </div>
                <h3 className="fw-bold text-uppercase mb-3">High-Intent Audience</h3>
                <p>Reach thousands of serious caravan buyers actively searching.</p>
              </div>

              <div className="col-md-3 p-4 text-center feature-card" data-purpose="feature-card">
                <div className="icon-circle">
                  <Image src="/images/hometk_retargeting.png" alt="Retargeting Included" width={72} height={72} />
                </div>
                <h3 className="fw-bold text-uppercase mb-3">Retargeting Included</h3>
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
                        src="/images/home_ad_screenshot.jpg"
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
                        src="/images/home_ad_screenshot-m.jpg"
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
              The Ultimate Caravan Marketing Package
            </h2>
            <p className="h5 text-dark fw-medium">
              A complete lead generation solution for your caravan brand
            </p>
          </div>
          <div className="row g-4 justify-content-center">

            <div className="col-md-5">
              <div className="package-card d-flex shadow-card" data-purpose="package-item">
                <div className="me-4 text-navy">
                  <Image src="/images/hometk_tablet.png" alt="Premium Home Page Banner" width={48} height={48} />
                </div>
                <div>
                  <h4 className="fw-bold text-uppercase" style={{ color: 'var(--caravan-orange)' }}>
                    Premium Home Page Banner
                  </h4>
                  <p className="small fw-medium m-0 lh-base">
                    Your brand in the 1% top-of-homepage position (desktop &amp; mobile).
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
                    Retargeting Campaign
                  </h4>
                  <p className="small fw-medium m-0 lh-base">
                    We keep your brand top-of-mind by following visitors across the web.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="package-card d-flex shadow-card" data-purpose="package-item">
                <div className="me-4 text-navy">
                  <Image src="/images/hometk_check.png" alt="Exclusivity Guaranteed" width={48} height={48} />
                </div>
                <div>
                  <h4 className="fw-bold text-uppercase" style={{ color: 'var(--caravan-orange)' }}>
                    Exclusivity Guaranteed
                  </h4>
                  <p className="small fw-medium m-0 lh-base">
                    Only 1 advertiser per month. You get 100% share of voice for your category.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-5">
              <div className="package-card d-flex shadow-card" data-purpose="package-item">
                <div className="me-4 text-navy">
                  <Image src="/images/hometk_gps.png" alt="Australia-Wide Exposure" width={48} height={48} />
                </div>
                <div>
                  <h4 className="fw-bold text-uppercase" style={{ color: 'var(--caravan-orange)' }}>
                    Australia-Wide Exposure
                  </h4>
                  <p className="small fw-medium m-0 lh-base">
                    Reach serious caravan buyers from all over Australia.
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
                $5000{' '}
                <span className="h6 fw-semibold ms-3 text-uppercase tracking-widest opacity-75">
                  Month + GST
                </span>
              </div>
            </div>
            <div className="col-auto">
              <Link
                className="btn btn-caravan-orange btn-lg px-5 py-3 fs-4 shadow-lg"
                href="https://advertisers.caravansforsale.com.au/ad-signup-home/"
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