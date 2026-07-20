// src/app/blog/page/[page]/page.tsx
"use client";
// export const dynamic = "force-dynamic"
;
import React, {  useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {  type BlogPost, type BlogPageResult } from "@/api/blog/api";
import { formatPostDate } from "@/utils/date";
import { toSlug } from "@/utils/seo/slug";
import BlogCardSkelton from "../../components/blogCardSkeleton";

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
  const [navigating, setNavigating] = useState(false);
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

  return (
    <div className="blog-page style-5">
      <section className="all-news bg-light-gray blog-listing section-padding pt-0 blog bg-transparent style-3">
        <div className="author_overall">
          <div className="container">
            <div className="section-head mb-60 style-5">
              <div className="author_head">
                <div className="author-avatar">
                  <Image
                    src="/images/avathar.jpg"
                    alt="Avatar"
                    width={200} // set your desired width
                    height={200} // set your desired height
                    priority // optional, loads image faster
                  />
                </div>
                <div>
                  <h1 className="author-name">Tom</h1>
                  <h5 className="author-tagline">
                    Author at Caravans For Sale
                  </h5>
                </div>
              </div>

              <div className="author-info">
                <p>
                  Tom is a passionate caravan enthusiast and content writer at{" "}
                  <Link href="https://www.caravansforsale.com.au/">
                    CaravansForSale.com.au
                  </Link>{" "}
                  — Australia’s trusted destination for buying, selling, and
                  researching caravans.
                </p>
                <p>
                  He helps Australians make informed decisions across every
                  stage of the caravan journey, from choosing the right model to
                  comparing prices and discovering hidden gems from regional
                  manufacturers.
                </p>
                <p>
                  Tom’s articles focus on off-road caravans, touring models,
                  hybrids, and family-friendly designs, offering practical
                  insights tailored to Australian conditions, travel habits, and
                  market trends.
                </p>
                <p>
                  With a genuine love for the outdoors, Tom’s writing reflects
                  Australia’s caravan lifestyle — adventure, community, and
                  freedom on the open road.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              {loading && (
                <div className="text-center py-5">Loading posts…</div>
              )}

              {!loading && blogPosts.length === 0 && (
                <div className="text-center py-5">No posts found.</div>
              )}
              {loading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <BlogCardSkelton key={i} />
                  ))}
                </>
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
                        <div className="col-lg-5">
                          <div className="img img-cover">
                            <Link href={href}>
                              <Image
                                src={post.image}
                                alt={post.title}
                                width={1024}
                                height={683}
                                className="w-100 h-auto"
                              />
                            </Link>
                          </div>
                        </div>
                        <div className="col-lg-7">
                          <div className="card-body p-0">
                            <small className="d-block date text">
                              <Link
                                href={"/author/tom/"}
                                className="text-uppercase border-end brd-gray pe-2 me-2 color-blue4"
                              >
                                Tom
                              </Link>
                              <Link href={href} className="op-8">
                                {formatPostDate(post.date)}
                              </Link>
                            </small>
                            <Link href={href} className="card-title mb-10">
                              {post.title}
                            </Link>
                            <p>{decodeHTML(post.excerpt)}</p>{" "}
                            <Link
                              href={href}
                              onClick={() => setNavigating(true)}
                              className="btn rounded-pill bg-blue4 fw-bold text-white mt-10"
                            >
                              <small> Read More </small>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <nav
                  className="pagination style-5 color-4 justify-content-center mt-20 d-flex align-items-center gap-2 flex-wrap"
                  aria-label="Blog pagination"
                >
                  {/* Prev */}
                  {currentPage > 1 ? (
                    <Link
                      href={prevUrl}
                      className="prev page-numbers px-3 py-1 border rounded"
                    >
                      « prev
                    </Link>
                  ) : (
                    <span className="prev page-numbers px-3 py-1 border rounded disabled opacity-50">
                      « prev
                    </span>
                  )}

                  {/* Numbered */}
                  {pages.map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-2">
                        …
                      </span>
                    ) : (
                      <Link
                        key={`page-${p}`}
                        href={p === 1 ? "/blog/" : `/blog/page/${p}/`}
                        aria-current={p === currentPage ? "page" : undefined}
                        className={`page-numbers px-3 py-1 border rounded ${
                          p === currentPage ? "current fw-bold" : ""
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                  {/* Next */}
                  {currentPage < totalPages ? (
                    <Link
                      href={nextUrl}
                      className="next page-numbers px-3 py-1 border rounded"
                    >
                      next »
                    </Link>
                  ) : (
                    <span className="next page-numbers px-3 py-1 border rounded disabled opacity-50">
                      next »
                    </span>
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
      {navigating && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
          }}
          aria-live="polite"
        >
          <div className="text-center">
            <div className="spinner-border" role="status" />
            <div className="mt-2 fw-semibold">Loading…</div>
          </div>
        </div>
      )}
    </div>
  );
}
