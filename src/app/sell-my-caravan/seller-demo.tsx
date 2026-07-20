  "use client";
 import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
 import "@fortawesome/fontawesome-free/css/solid.min.css";
 import "@fortawesome/fontawesome-free/css/regular.min.css";
 import React, { useState } from "react";
 import { getRegionBySlug } from "../sell-my-caravan-region/regions-data";

 const STATE_LINKS = [
   { label: "Victoria",              img: "/images/vic_map.svg", href: "/sell-my-caravan/victoria/" },
   { label: "New South Wales",       img: "/images/nsw_map.svg", href: "/sell-my-caravan/new-south-wales/" },
   { label: "Queensland",            img: "/images/qld_map.svg", href: "/sell-my-caravan/queensland/" },
   { label: "Western Australia",     img: "/images/wa_map.svg",  href: "/sell-my-caravan/western-australia/" },
   { label: "South Australia",       img: "/images/sa_map.svg",  href: "/sell-my-caravan/south-australia/" },
   { label: "Tasmania",              img: "/images/tas_map.svg", href: "/sell-my-caravan/tasmania/" },
 ];

 const CITY_SLUGS = [
   { label: " Melbourne", regionSlug: "melbourne-region" },
   { label: " Sydney", regionSlug: "sydney-region" },
   { label: " Brisbane", regionSlug: "brisbane-region" },
   { label: " Perth", regionSlug: "perth-region" },
   { label: " Adelaide", regionSlug: "adelaide-region" },
   { label: " Gold Coast", regionSlug: "gold-coast-region" },
   { label: " Sunshine Coast", regionSlug: "sunshine-coast-region" },
   { label: " Newcastle", regionSlug: "newcastle-region" },
   { label: " Canberra", regionSlug: "canberra-region" },
   { label: " Hobart", regionSlug: "hobart-region" },
 ];

 const CITY_LINKS = CITY_SLUGS.map(({ label, regionSlug }) => {
   const region = getRegionBySlug(regionSlug);
   return {
     label,
     href: region ? `/sell-my-caravan/${region.state.slug}/${region.pageSlug}/` : "/sell-my-caravan/",
   };
 });
 
 const CARAVAN_TYPES = [
   { label: "Off Road Caravans", img: "/images/off-road.webp", href: "/listings/off-road-category/" },
   { label: "Family Caravans", img: "/images/family.webp", href: "/listings/family-caravans-category/" },
   { label: "Pop Top Caravans", img: "/images/pop-top.webp", href: "/listings/pop-top-category/" },
   { label: "Hybrid Caravans", img: "/images/hybrid.webp", href: "/listings/hybrid-caravans-category/" },
   { label: "Luxury Caravans", img: "/images/luxury.webp", href: "/listings/luxury-caravans-category/" },
   { label: "Couples Caravans", img: "/images/touring.webp", href: "/listings/couples-caravans-category/" },
   { label: "Touring Caravans", img: "/images/touring.webp", href: "/listings/touring-caravans-category/" },
   { label: "Bunk Caravans", img: "/images/family.webp", href: "/listings/bunk-caravans-category/" },
   { label: "Small Caravans", img: "/images/pop-top.webp", href: "/listings/small-caravans-category/" },
   { label: "Used Caravans", img: "/images/off-road.webp", href: "/listings/used-condition/" },
 ];
 
 const HOW_TO_STEPS = [
   { num: 1, iconSet: "fa-regular", icon: "fa-file-lines",    title: "Create Your Listing",    desc: "Add your caravan details, specifications, price and contact information." },
   { num: 2, iconSet: "fa-regular", icon: "fa-image",         title: "Upload Photos",          desc: "Add clear photos of the inside, outside and key features of your caravan." },
   { num: 3, iconSet: "fa-regular", icon: "fa-comment-dots",  title: "Receive Buyer Enquiries", desc: "Interested buyers contact you directly through your listing." },
   { num: 4, iconSet: "fa-regular", icon: "fa-handshake",     title: "Negotiate Directly",     desc: "Arrange inspections, answer questions and negotiate with buyers." },
   { num: 5, iconSet: "fa-regular", icon: "fa-circle-check",  title: "Complete The Sale",      desc: "Once sold, mark your listing as sold or remove it from the site." },
 ];
 
 
 const MAIN_FAQS = [
   {
     q: "How do I sell my caravan online in Australia?",
     a: <p>You can sell your caravan online by creating a private seller listing on CaravansForSale.com.au. Add your caravan details, upload clear photos, set your asking price and publish your ad so buyers across Australia can contact you directly.</p>,
   },
   {
     q: "How much does it cost to list my caravan?",
     a: <p>It costs $49 inc. GST to list your caravan on CaravansForSale.com.au. This is a one-time listing fee with no monthly subscription, no hidden charges and no commission when your caravan sells.</p>,
   },
   {
     q: "How long does my caravan listing stay live?",
     a: <p>Your caravan listing stays live until sold. You do not need to keep paying monthly fees to keep your ad active. Once your caravan is sold, you can remove the listing from the website.</p>,
   },
   {
     q: "Can I edit my caravan listing after publishing?",
     a: <p>Yes. After your listing is published, you can update your caravan details, change the asking price, add or replace photos and improve your description if needed.</p>,
   },
   {
     q: "How do buyers contact me?",
     a: <p>Interested buyers can contact you directly through your caravan listing. This allows you to answer questions, arrange inspections, negotiate the price and manage the sale privately.</p>,
   },
   {
     q: "What photos should I upload when selling my caravan?",
     a: <p>Upload clear photos of the outside, inside, kitchen, beds, seating area, bathroom, tyres, drawbar and any included accessories. Good photos help buyers understand the condition of your caravan and can increase enquiries.</p>,
   },
   {
     q: "How should I price my caravan?",
     a: <p>Check similar caravans for sale before setting your price. Compare by make, model, year, condition, length, ATM, tare weight, sleeping capacity, features and location. A realistic asking price can help attract more genuine buyers.</p>,
   },
   {
     q: "Is it safe to sell my caravan privately online?",
     a: <p>Yes, but you should take normal precautions. Speak with buyers directly, meet in a safe location, confirm payment has cleared before handover and complete any required transfer paperwork for your state or territory.</p>,
   },
   {
     q: "Do I pay commission when my caravan sells?",
     a: <p>No. CaravansForSale.com.au does not charge commission when your caravan sells. You pay the one-time listing fee and keep 100% of the agreed sale price.</p>,
   },
   {
     q: "Can I remove my listing after my caravan is sold?",
     a: <p>Yes. Once your caravan has sold, you can remove your listing so buyers know it is no longer available.</p>,
   },
 ];
 
 export default function SellerDemo() {
   const [activeFaq, setActiveFaq] = useState<number | null>(null);
 
   return (
     <div className="page_wrapper demo-page">
 
       {/* ── Hero ── */}
       <section className="demo-hero">
         <div className="container">
           <h1 className="demo-hero__title">
             Sell My Caravan Online in Australia
           </h1>
           <p className="demo-hero__subtitle">
             List your caravan for $49 until sold — no commissions, no subscriptions and direct buyer contact.
           </p>
           
 
           {/* Pricing card + CTA wrapper — one seamless unit */}
           <div className="demo-price-wrapper">
           <div className="demo-price-card">
             
             {/* Left: Australia info */}
             <div className="demo-price-card__left">
               <div className="demo-price-card__aus-circle">
                 <img src="/images/australia.png" alt="Australia" />
               </div>
               <div className="demo-price-card__header">
               <h3>Looking to sell your caravan?</h3>
             </div>
               <p className="demo-price-card__desc">
                 CaravansForSale.com.au helps private sellers advertise directly to genuine caravan buyers for a one-time $49 listing fee, with no commissions, no subscriptions and your ad live until sold.
               </p>
               
             </div>
 
             {/* Center: Price highlight */}
             <div className="demo-price-card__center">
               <div className="demo-price-card__badge">BEST VALUE</div>
               <div className="demo-price-card__price-box">
                 <div className="demo-price-card__only">ONLY</div>
                 <div className="demo-price-card__amount"><sup>$</sup>49</div>
                 <hr className="demo-price-card__hr" />
                 <div className="demo-price-card__fee">One-Time Listing Fee (Inc. GST)</div>
               </div>
             </div>
 
             {/* Right: Features */}
             <div className="demo-price-card__right">
               {[
                 { icon: "fa-calendar-days", label: "No Subscriptions" },
                 { icon: "fa-percent", label: "No Commissions" },
                 { icon: "fa-circle-dollar-to-slot", label: "No Ongoing Fees" },
                 { icon: "fa-bullhorn", label: "Ad Live Until Sold" },
               ].map((item, i) => (
                 <div key={item.label} className={`demo-price-card__feature${i < 3 ? " demo-price-card__feature--border" : ""}`}>
                   <span className="demo-price-card__feature-icon">
                     <i className={`fa-solid ${item.icon}`} />
                   </span>
                   <span className="demo-price-card__feature-label">{item.label}</span>
                 </div>
               ))}
             </div>
           </div>
 
           {/* CTA — inside wrapper so it attaches seamlessly to card bottom */}
           <a href="https://seller.caravansforsale.com.au/seller-signup/" className="demo-hero__cta">
             List Your Caravan Now <i className="fa-solid fa-arrow-right" />
           </a>
           </div>{/* end demo-price-wrapper */}
 
           
         </div>
       </section>
 
       {/* ── Feature cards ── */}
       <section className="demo-features-section">
         <div className="container">
           <div className="demo-features-grid">
             {[
               { img: "/images/chat2.png", title: "Direct Buyer Contact", desc: "Connect directly with genuine buyers. No middleman." },
               { img: "/images/calendar.png", title: "Live Until Sold", desc: "Your listing stays online and visible until your caravan is sold." },
               { img: "/images/caravan.png", title: "Caravan-Only Marketplace", desc: "Reach a targeted audience actively looking to buy caravans." },
               { img: "/images/dollar.png", title: "Keep 100% of Your Sale", desc: "Pay only $49 Inc GST per listing. No commissions or hidden costs." },
             ].map((item, i) => (
               <div className="demo-feature-card" key={i}>
                 <div className="demo-feature-card__icon">
                   <img src={item.img} alt={item.title} />
                 </div>
                 <h4 className="demo-feature-card__title">{item.title}</h4>
                 <p className="demo-feature-card__desc">{item.desc}</p>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* ── Reach section ── */}
       <section className="demo-reach-section">
         <div className="container">
 
           {/* Heading */}
           <div className="demo-reach-heading">
             <h3>Reach Caravan Buyers Across Australia, Including: </h3>
             {/* <p>Your listing is seen by thousands of active buyers Australia-wide.</p> */}
           </div>
 
   {/* ── City links ── */}
       <section className="demo-city-section">
         <div className="container">
          
 
           {/* State cards */}
           <div className="demo-state-grid">
             {STATE_LINKS.map((s) => (
               <a
                 key={s.label}
                 href={s.href}
                 title={`Sell my caravan in ${s.label}`}
                 className="demo-state-item"
               >
                 <div className="demo-state-item__img">
                   <img src={s.img} alt={s.label} />
                 </div>
                 <h3 className="demo-state-item__label">{s.label}</h3>
               </a>
             ))}
           </div>
 
           {/* City cards */}
           <div className="demo-city-grid">
             {CITY_LINKS.map((c) => (
               <div key={c.label} className="demo-city-item">
                 <span className="demo-city-icon">
                   <img src="/images/caravan.png" alt="" />
                 </span>
                       <h3 className="demo-city-label">

                 <a
                   href={c.href}
                   title={`Sell my caravan in ${c.label.trim()}`}
                   className="demo-city-label"
                 >
                   {c.label}
                 </a>
                 </h3>
                 <i className="fa-solid fa-chevron-right demo-city-arrow" />
               </div>
             ))}
           </div>
         </div>
       </section>
 
           <div className="demo-reach-row">
           {/* Device image */}
           <div className="demo-reach-device">
             <img src="/images/your-caravan-desktop-seller-2.jpg" className="img-fluid d-none d-lg-block" alt="Caravan For Sale Desktop" />
             <img src="/images/your-caravan-mobile-2.jpg" className="img-fluid d-block d-lg-none" alt="Caravan For Sale Mobile" />
           </div>
 
           {/* Pricing + FAQ card */}
           <div className="demo-reach-card">
             {/* Left: Pricing */}
             <div className="demo-reach-card__left">
               <span className="demo-reach-card__badge">BEST VALUE</span>
               <div className="demo-reach-card__price">
                 <span className="demo-reach-card__dollar">$</span>
                 <span className="demo-reach-card__amount">49</span>
                 <span className="demo-reach-card__gst">(Inc. GST)</span>
               </div>
               <p className="demo-reach-card__fee-label">One-Time Listing Fee</p>
               <ul className="demo-reach-card__list">
                 {[
                   "1 Caravan listed until sold",
                   "Edit your listing anytime",
                   "No expiration or monthly fees",
                 ].map((item) => (
                   <li key={item}>
                     <i className="fa-solid fa-circle-check" />
                     {item}
                   </li>
                 ))}
               </ul>
               <a href="https://seller.caravansforsale.com.au/seller-signup/" className="demo-reach-card__cta">
                 List My Caravan Now <i className="fa-solid fa-arrow-right" />
               </a>
             </div>
 
             {/* Divider */}
             <div className="demo-reach-card__divider" />
 
             {/* Right: FAQ items */}
             <div className="demo-reach-card__right">
               <div className="demo-reach-faq">
                 
                 <div className="demo-reach-faq__body">
                   <h4>How long does the listing stay up?</h4>
                   <ul>
                     <li><i className="fa-solid fa-circle-check" />Your ad stays live until it sells.</li>
                     <li><i className="fa-solid fa-circle-check" />You can update details, photos, and price anytime.</li>
                     <li><i className="fa-solid fa-circle-check" />Mark as sold or remove anytime — no penalties.</li>
                   </ul>
                 </div>
               </div>
               <div className="demo-reach-faq demo-reach-faq--border">
                 
                 <div className="demo-reach-faq__body">
                   <h4>Can I edit my listing after posting?</h4>
                   <ul>
                     <li><i className="fa-solid fa-circle-check" />Yes, updates are allowed anytime.</li>
                     <li><i className="fa-solid fa-circle-check" />No penalties or restrictions.</li>
                   </ul>
                 </div>
               </div>
             </div>
           </div>
           </div>{/* end demo-reach-row */}
 
         </div>
       </section>
 
       {/* ── Compact Seller Guide ── */}
       <section className="demo-guide-section">
         <div className="container">
           <h2 className="demo-guide-title">Compact Seller Guide</h2>
           <div className="demo-guide-underline" />
           <div className="demo-guide-grid">
 
             <div className="demo-guide-card">
               <div className="demo-guide-card__header">
                 <span className="demo-guide-card__num">1</span>
                 <h3>Why sell on CaravansForSale.com.au?</h3>
               </div>
               <ul className="demo-guide-card__list">
                 <li>Caravan-only marketplace, not a general classifieds page.</li>
                 <li>Buyers search by type, price, weight, sleeps and location.</li>
                 <li>Your caravan is shown to people already looking to buy.</li>
                 <li>Direct enquiries, no commission on the final sale.</li>
               </ul>
             </div>
 
             <div className="demo-guide-card">
               <div className="demo-guide-card__header">
                 <span className="demo-guide-card__num">2</span>
                 <h3>What you need before listing</h3>
               </div>
               <ul className="demo-guide-card__list">
                 <li>Photos: exterior, interior, beds, kitchen, tyres and accessories.</li>
                 <li>Details: make, model, year, ATM, tare, length and sleeps.</li>
                 <li>Condition, rego, service history, upgrades and asking price.</li>
               </ul>
             </div>
 
             <div className="demo-guide-card">
               <div className="demo-guide-card__header">
                 <span className="demo-guide-card__num">3</span>
                 <h3>How to price your caravan</h3>
               </div>
               <ul className="demo-guide-card__list">
                 <li>Check similar caravans before setting your asking price.</li>
                 <li>Compare make, year, condition, length, features and location.</li>
                 <li>Leave room for negotiation while staying competitive.</li>
               </ul>
             </div>
 
             <div className="demo-guide-card">
               <div className="demo-guide-card__header">
                 <span className="demo-guide-card__num">4</span>
                 <h3>Private sale vs other options</h3>
               </div>
               <ul className="demo-guide-card__list">
                 <li>Private sale: more control and keep the sale price.</li>
                 <li>Trade-in: faster and easier, but often lower value.</li>
                 <li>Consignment: dealer handles the sale, fees may apply.</li>
               </ul>
             </div>
 
           </div>
         </div>
       </section>
 
       {/* ── Main FAQ accordion ── */}
       <section className="demo-faq-section">
         <div className="container">
           <div className="demo-faq-head">
             <span className="demo-faq-head__tag">FAQ</span>
             <h2>Frequently Asked Questions</h2>
             <p>Everything you need to know about selling your caravan on CaravansForSale.com.au</p>
           </div>
           <div className="demo-faq-list">
             {MAIN_FAQS.map((faq, i) => (
               <div
                 key={i}
                 className={`demo-faq-item${activeFaq === i ? " demo-faq-item--open" : ""}`}
               >
                 <button
                   className="demo-faq-item__q"
                   onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                 >
        <h3 className="demo-faq-item__q-text">{faq.q}</h3>
                   <span className="demo-faq-item__icon">
                     <i className={`fa-solid ${activeFaq === i ? "fa-minus" : "fa-plus"}`} />
                   </span>
                 </button>
                 {activeFaq === i && (
                   <div className="demo-faq-item__a">{faq.a}</div>
                 )}
               </div>
             ))}
           </div>
         </div>
       </section>
 
     
 
       {/* ── Caravan types ── */}
       <section className="demo-types-section">
         <div className="container">
           <h2 className="demo-section-title">Sell Any Type of Caravan</h2>
           <div className="demo-types-grid">
             {CARAVAN_TYPES.map((t) => (
               <div key={t.label} className="demo-type-item">
                 <div className="demo-type-icon">
                   <img src={t.img} alt={t.label} width={80} height={80} />
                 </div>
                 <span className="demo-type-label">{t.label}</span>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* ── Why buyers section ── */}
       <section className="demo-why-section">
         <div className="container">
           <div className="row align-items-center g-4">
             <div className="col-md-6">
               <img src="/images/your-caravan-desktop-seller-2.jpg" className="img-fluid demo-why-img" alt="Caravan buyers" />
             </div>
             <div className="col-md-6">
               <h2>Why Thousands of Caravan Buyers Visit CaravansForSale Every Month</h2>
               <p>
                 CaravansForSale.com.au is Australia's dedicated caravan marketplace, built exclusively
                 for caravan buyers and sellers. We attract thousands of genuine buyers every day who
                 are actively searching for road caravans, family caravans, pop-top caravans, luxury
                 caravans and more.
               </p>
               <div className="demo-check-grid demo-check-grid--2col mt-3">
                 {[
                   "Australia-wide exposure", "Live until sold for one low price",
                   "Caravan-only marketplace", "Update listing anytime",
                   "Direct buyer enquiries", "No dealer involvement",
                   "No commissions or hidden fees", "Simple, fast and effective",
                 ].map((t) => (
                   <span key={t} className="demo-check-item">
                     <i className="fa-solid fa-circle-check"></i> {t}
                   </span>
                 ))}
               </div>
             </div>
           </div>
         </div>
       </section>
 
       {/* ── How to sell ── */}
       <section className="demo-steps-section">
         <div className="container">
           
           <h2 className="demo-steps-title">How To Sell Your Caravan Online</h2>
           <p className="demo-steps-subtitle">List your caravan in minutes and connect with serious buyers Australia-wide.</p>
 
           {/* Steps: each column has number circle + icon + content; connectors between columns */}
           <div className="demo-steps-wrapper">
             {HOW_TO_STEPS.map((s, i) => (
               <React.Fragment key={s.num}>
                 <div className="demo-steps-item">
                   <div className="demo-step-num">{s.num}</div>
                   <div className="demo-step-icon-circle">
                     <i className={`${s.iconSet} ${s.icon}`} />
                   </div>
                   <h4 className="demo-step-title">{s.title}</h4>
                   <p className="demo-step-desc">{s.desc}</p>
                 </div>
                 {i < HOW_TO_STEPS.length - 1 && (
                   <div className="demo-steps-connector" />
                 )}
               </React.Fragment>
             ))}
           </div>
 
           
         </div>
       </section>
 
       
 
       {/* ── Bottom CTA strip ── */}
       <section className="demo-cta-strip">
         <div className="container text-center">
           <p>
             Start selling your caravan today for just{" "}
             <strong>$49 (Inc. GST)</strong> — Live until sold!
           </p>
           <a href="https://seller.caravansforsale.com.au/seller-signup/" className="btn white_btn">
             List Your Caravan Now
           </a>
         </div>
       </section>
 
     </div>
   );
 }
 