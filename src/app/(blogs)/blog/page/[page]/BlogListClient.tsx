// src/app/blog/page/[page]/page.tsx
"use client";
// export const dynamic = "force-dynamic"
;
import React, {  useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {  type BlogPost, type BlogPageResult } from "@/api/blog/api";
import { formatPostDate } from "@/utils/date";
import { toSlug } from "@/utils/seo/slug";
import BlogCardSkelton from "../../../../components/blogCardSkeleton";
import { useBanners } from "@/components/BannerHandler";
import { useBannerTracking } from "@/hooks/useBannerTracking";

// Build compact page list like [1, '…', 8, 9, 10, 11, 12, '…', 35]
function buildPageList(current: number, total: number, delta = 2) {
  const pages: (number | string)[] = [];
  const range: number[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  range.push(1);
  for (let i = left; i <= right; i++) range.push(i);
  if (total > 1) range.push(total);
  let last = 0;
  for (const p of range) {
    if (last && p - last > 1) pages.push("…");
    pages.push(p);
    last = p;
  }
  return pages;
}

interface Props {
  data: BlogPageResult;
  currentPage: number;
}
export default function BlogListClient({ data, currentPage }: Props) {
   const params = useParams<{ page?: string }>();
  // const initialPage = Math.max(1, Number(params?.page || 1));
  const totalPages = data.total_pages;
  const blogPosts = data.items;
// ✅ இதை போடுங்க — data வந்துச்சான்னு check பண்ணு
const loading = !data || !blogPosts || blogPosts.length === 0 && data.totalPages === 0;
  function decodeHTML(str: string = "") {
    if (!str) return "";
    if (typeof window === "undefined") return str; // SSR safe
    const doc = new DOMParser().parseFromString(str, "text/html");
    return doc.documentElement.textContent || "";
  }
  // React to route segment changes (back/forward, manual URL input)
 

 

  const pages = useMemo(
    () => buildPageList(currentPage, totalPages, 2),
    [currentPage, totalPages]
  );

  const getHref = (p: BlogPost) => {
    const slug = (p.slug ?? "").trim() || toSlug(p.title ?? "");
    return slug ? `/${slug}/` : "#";
  };

  const prevUrl =
    currentPage <= 2 ? "/blog/" : `/blog/page/${currentPage - 1}/`;
  const nextUrl = `/blog/page/${Math.min(totalPages, currentPage + 1)}/`;

  const { matchedBanners, isMobile } = useBanners();
  const { bannerRefs, trackClick } = useBannerTracking(matchedBanners);
  const topBanners = matchedBanners.filter((b) => b.position === "top");
  const rightBanners = matchedBanners.filter((b) => b.position === "right");

  return (

    <div className="blog-page style-5">
      <section className="all-news bg-light-gray blog-listing section-padding blog bg-transparent style-3 pt-0">
        <div className="container">
          <div className="display_ad">
            {false &&
              topBanners.map((banner, index) => (
                <a
                  key={banner.id}
                  ref={(el) => {
                    bannerRefs.current[index] = el;
                  }}
                  data-banner-id={banner.id}
                  href={banner.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner_ad_now"
                  onClick={() => trackClick(banner.id)}
                >
                  <div
                    className={isMobile ? "banner-mobile" : "banner-desktop"}
                  >
                    <Image
                      src={banner.image_url}
                      alt={banner.name}
                      width={isMobile ? 600 : 1200}
                      height={isMobile ? 300 : 200}
                      priority
                    />
                  </div>
                </a>
              ))}
          </div>
          <div
            className="section-head mb-60 style-5"
            style={{ margin: "30px 0px" }}
          >
            <div className="section-head mb-60 style-5">
              <h2>
                Valuable News, Reviews &amp; Advice From Marketplace Network 
              </h2>
            </div>

          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              {loading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <BlogCardSkelton key={i} />
                  ))}
                </>
              )}
              {!loading && blogPosts.length === 0 && !data.error && (
                <div className="text-center py-5">No posts found.</div>
              )}
              {!loading && blogPosts.length === 0 && data.error && (
                <div style={{ minHeight: 320, background: "#f8f9fa", borderRadius: 8 }} />
              )}
              {!loading &&
                blogPosts.map((post, index) => {
                  const href = getHref(post);
                  return (
                    <div
                      key={`${post.id ?? index}-${currentPage}`}
                      className="card border-0 bg-transparent rounded-0 border-bottom brd-gray pb-30 mb-30"
                    >
                      <div className="row">
                        <div className="col-lg-5 col-sm-6">
                          <div className="img img-cover">
                            <a href={href}>
                              <Image
                                src={post.image}
                                alt={post.title}
                                width={1024}
                                height={683}
                                className="w-100 h-auto"
                              />
                            </a>
                          </div>
                        </div>
                        <div className="col-lg-7 col-sm-6">
                          <div className="card-body p-0">
                            <small className="d-block date text">
                              <Link
                                href={"/author/tom/"}
                                className="text-uppercase border-end brd-gray pe-2 me-2 color-blue4"
                              >
                                Tom
                              </Link>
                              <a href={href} className="op-8">
                                {formatPostDate(post.date)}
                              </a>
                            </small>
                            <a href={href} className="card-title mb-10">
                              {post.title}
                            </a>

                            <p>{decodeHTML(post.excerpt)}</p>{" "}
                            <a
                              href={href}
                              className="btn rounded-pill bg-blue4 fw-bold text-white mt-10"
                            >
                              <small> Read More </small>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <nav className="blg-pagination" aria-label="Blog pagination">
                  {currentPage > 1 ? (
                    <Link href={prevUrl} className="blg-pagination__arrow" aria-label="Previous page">
                      <i className="bi bi-chevron-left" />
                    </Link>
                  ) : (
                    <span className="blg-pagination__arrow blg-pagination__arrow--disabled" aria-label="Previous page">
                      <i className="bi bi-chevron-left" />
                    </span>
                  )}

                  <div className="blg-pagination__pages">
                    {pages.map((p, i) =>
                      p === "…" ? (
                        <span key={`ellipsis-${i}`} className="blg-pagination__ellipsis">
                          …
                        </span>
                      ) : (
                        <Link
                          key={`page-${p}`}
                          href={p === 1 ? "/blog/" : `/blog/page/${p}/`}
                          aria-current={p === currentPage ? "page" : undefined}
                          className={`blg-pagination__num${p === currentPage ? " blg-pagination__num--active" : ""}`}
                        >
                          {p}
                        </Link>
                      )
                    )}
                  </div>

                  {currentPage < totalPages ? (
                    <Link href={nextUrl} className="blg-pagination__arrow" aria-label="Next page">
                      <i className="bi bi-chevron-right" />
                    </Link>
                  ) : (
                    <span className="blg-pagination__arrow blg-pagination__arrow--disabled" aria-label="Next page">
                      <i className="bi bi-chevron-right" />
                    </span>
                  )}
                </nav>
              )}
            </div>
            <div className="col-lg-3">
              <div className="display_ad listing_sticky">
                {false &&
                  rightBanners.map((banner, index) => (
                    <a
                      key={banner.id}
                      ref={(el) => {
                        bannerRefs.current[index] = el;
                      }}
                      data-banner-id={banner.id}
                      href={banner.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="banner_ad_now mb-0"
                      onClick={() => trackClick(banner.id)}
                    >
                      <div
                        className={
                          isMobile ? "banner-mobile" : "banner-desktop"
                        }
                      >
                        <Image
                          src={banner.image_url}
                          alt={banner.name}
                          width={isMobile ? 600 : 1200}
                          height={isMobile ? 300 : 200}
                          priority
                        />
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
