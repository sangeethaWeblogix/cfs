
"use client";

import "./navbar.css?=60";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => setIsOpen(!isOpen);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const sidenavRef = useRef<HTMLDivElement | null>(null);
  const [hamOpen, setHamOpen] = useState(false);
  const hamRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (hamRef.current && !hamRef.current.contains(e.target as Node)) {
        setHamOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Force full-page load for listing links so browser tab shows native loading indicator
  // re-runs after mounted=true so sidenavRef.current is not null
  useEffect(() => {
    const el = sidenavRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/listings/")) return;
      window.location.href = href;
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [mounted]);

  const closeNav = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light style-4 header-white">
        <div className="container">
          <div className="logo_left">
            <a className="navbar-brand" href="/">
              <Image
                src="/images/cfs-logo-black.svg"
                alt="Caravans For Sale"
                width={150}
                height={50}
                priority
              />
            </a>
          </div>

          <div className="header_right_info">
            {/* <button className="navbar-toggler mytogglebutton">
              <i className="bi bi-search"></i>
            </button> */}

            <button
              className="navbar-toggler d-none"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div
              className="collapse navbar-collapse justify-content-end align-items-center"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav mb-2 mb-lg-0">
                <li className="nav-item">
                  <a className="nav-link" href="/listings/">Buy</a>
                </li>
                
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

              <div className="ham-menu-wrapper" ref={hamRef}>
                <button className="ham-menu-btn" onClick={() => setHamOpen(prev => !prev)} aria-label="Menu">
                  <i className="bi bi-list"></i>
                </button>
                {hamOpen && (
                  <div className="ham-dropdown">
                    <a href="/listings/" className="ham-item">Caravan Listings</a>
                    <a href="/sell-my-caravan/" className="ham-item">Sell My Caravan</a>
                    <a href="/dealer-advertising/" className="ham-item">Dealer Advertising</a>
                    <a href="/blog/" className="ham-item">Blog</a>
                    <a href="/about-us/" className="ham-item">About</a>
                    <a href="/contact/" className="ham-item">Contact</a>
                  </div>
                )}
              </div>
            </div>

            {/*<div className="navbar-right" ref={dropdownRef}>
              <button className="profile-btn" onClick={() => setOpen(!open)}>
                <span className="profile-icon"><i className="bi bi-person-fill"></i></span>
              </button>

              {open && (
                <div className="profile-dropdown">
                  <a href="/login" className="dropdown-item">
                    <span><i className="bi bi-person-fill"></i></span> Login
                  </a>
                  <a href="/login" className="dropdown-item">
                    <span><i className="bi bi-person-fill-add"></i></span> Register
                  </a>
                </div>
              )}
            </div> */}

            <div className="left_menu d-lg-none">
              <input
                type="checkbox"
                id="openSideMenu"
                className="openSideMenu"
                checked={isOpen}
                onChange={toggleNav}
              />

              <label htmlFor="openSideMenu" className="menuIconToggle">
                <div className="hamb-line dia p-1"></div>
                <div className="hamb-line hor"></div>
                <div className="hamb-line dia p-2"></div>
              </label>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      {mounted && (
        <div id="mySidenav" ref={sidenavRef} className={`sidenav ${isOpen ? "open" : ""}`}>

          {/* ── Main Panel ── */}
          <div className="sidenav-panel sidenav-panel-main">
            <div className="sidenav-header">
              <a href="/" onClick={closeNav} className="sidenav-logo-link">
                <Image src="/images/cfs-logo-black.svg" alt="Caravans For Sale" width={120} height={40} className="sidenav-logo-img" />
              </a>
              <button className="sidenav-close" onClick={closeNav} aria-label="Close menu">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="sidenav-scrollable">
              <div className="sidebar-navigation">
                <ul>
                  <li><a href="/" onClick={closeNav}>Home</a></li>
                  <li><a href="/listings/" onClick={closeNav}>Buy</a></li>
                  <li><a href="/blog/" onClick={closeNav}>Blog</a></li>
                  <li><a href="/about-us/" onClick={closeNav}>About</a></li>
                  <li><a href="/contact/" onClick={closeNav}>Contact</a></li>
                </ul>
              </div>
              <div className="sidenav-cta">
                <a href="/sell-my-caravan/" className="sidenav-cta-link" onClick={closeNav}>Sell My Caravan</a>
                <a href="/dealer-advertising/" className="sidenav-cta-link" onClick={closeNav}>Dealer Advertising</a>
                <a href="/login/" className="sidenav-cta-login" onClick={closeNav}>
                  <i className="bi bi-person-fill"></i> Login
                </a>
              </div>
            </div>
          </div>


        </div>
      )}

      {/* Overlay */}
      <div
        className={`overlay-close ${isOpen ? "active" : ""}`}
        onClick={closeNav}
      ></div>
      <div
        id="overlay"
        className={`overlay ${isOpen ? "active" : ""}`}
        onClick={() => {
          closeNav();
        }}
      ></div>

    </>
  );
}
