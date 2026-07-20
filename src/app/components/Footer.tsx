// components/BrowseByCategory.tsx
'use client'

import Link from 'next/link'
 
const BrowseByCategory = () => {
  return (
    <section className="search_quick_links section-padding alldata">
    <div className="container">
      {/* Browse by State */}
      <div className="list-container">
        <div className="title">
          <h2>Browse by State</h2>
        </div>
        <div className="row">
          <div className="col-md-3">
            <ul>
              {[
                ['Australian Capital Territory', 'australian-capital-territory-state'],
                ['New South Wales', 'new-south-wales-state'],
                ['Queensland', 'queensland-state'],
                ['South Australia', 'south-australia-state'],
              ].map(([name, slug]) => (
                <li key={slug}>
                  <div className="link_list_s">
                    <Link href={`https://www.caravansforsale.com.au/listings/${slug}/`}>
                      <i className="bi bi-search" /> {name}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-md-3">
            <ul>
              {[
                ['Tasmania', 'tasmania-state'],
                ['Victoria', 'victoria-state'],
                ['Western Australia', 'western-australia-state'],
              ].map(([name, slug]) => (
                <li key={slug}>
                  <div className="link_list_s">
                    <Link href={`https://www.caravansforsale.com.au/listings/${slug}/`}>
                      <i className="bi bi-search" /> {name}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Browse by Weight */}
      <div className="list-container">
        <div className="title">
          <h2>Browse by Weight</h2>
        </div>
        <div className="row">
          {[
            ['Under 1000 kg', 'under-1000-kg-atm'],
            ['Under 1500 kg', 'under-1500-kg-atm'],
            ['Under 2000 kg', 'under-2000-kg-atm'],
            ['Under 2500 kg', 'under-2500-kg-atm'],
            ['Under 3000 kg', 'under-3000-kg-atm'],
          ].reduce((acc, curr, index) => {
            const col = Math.floor(index / 4)
            acc[col] = acc[col] || []
            acc[col].push(curr)
            return acc
          }, [] as string [][][]).map((group, index) => (
            <div className="col-md-3" key={index}>
              <ul>
                {group.map(([label, slug]) => (
                  <li key={slug}>
                    <div className="link_list_s">
                      <Link href={`https://www.caravansforsale.com.au/listings/${slug}/`}>
                        <i className="bi bi-search" /> {label}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Browse by Sleep */}
      <div className="list-container">
        <div className="title">
          <h2>Browse by Sleep</h2>
        </div>
        <div className="row">
          {[
            ['Sleeps 2', 'over-2-people-sleeping-capacity'],
            ['Sleeps 3', 'over-3-people-sleeping-capacity'],
            ['Sleeps 4', 'over-4-people-sleeping-capacity'],
            ['Sleeps 5', 'over-5-people-sleeping-capacity'],
            ['Sleeps 6', 'over-6-people-sleeping-capacity'],
            ['Sleeps 7', 'over-7-people-sleeping-capacity'],
          ].reduce((acc, curr, index) => {
            const col = Math.floor(index / 4)
            acc[col] = acc[col] || []
            acc[col].push(curr)
            return acc
          }, [] as string [][][]).map((group, index) => (
            <div className="col-md-3" key={index}>
              <ul>
                {group.map(([label, slug]) => (
                  <li key={slug}>
                    <div className="link_list_s">
                      <Link href={`https://www.caravansforsale.com.au/listings/${slug}/`}>
                        <i className="bi bi-search" /> {label}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Browse by Price */}
      <div className="list-container">
        <div className="title">
          <h2>Browse by Price</h2>
        </div>
        <div className="row">
          {[
            ['Under $60,000', 'under-60000'],
            ['Under $70,000', 'under-70000'],
            ['Under $80,000', 'under-80000'],
            ['Under $90,000', 'under-90000'],
            ['Under $100,000', 'under-100000'],
            ['Under $125,000', 'under-125000'],
            ['Under $150,000', 'under-150000'],
            ['Under $175,000', 'under-175000'],
            ['Under $200,000', 'under-200000'],
          ].reduce((acc, curr, index) => {
            const col = Math.floor(index / 4)
            acc[col] = acc[col] || []
            acc[col].push(curr)
            return acc
          }, [] as string [][][]).map((group, index) => (
            <div className="col-md-3" key={index}>
              <ul>
                {group.map(([label, slug]) => (
                  <li key={slug}>
                    <div className="link_list_s">
                      <Link href={`https://www.caravansforsale.com.au/listings/${slug}/`}>
                        <i className="bi bi-search" /> {label}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
    </section>
    
  )
}

export default BrowseByCategory
