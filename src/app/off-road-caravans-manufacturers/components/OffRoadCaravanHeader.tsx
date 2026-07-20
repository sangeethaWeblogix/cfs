import React from "react";
import Link from "next/link";

const OffRoadCaravanHeader = () => {
  return (
    <div className="sc_recent_news sc_recent_news_style_news-announce">
      <article className="post_item post_size_big post hover14">
        <div className="post_featured with_thumb hover_simple post_featured_bg buzzstone_inline_210659395">
          <div className="post_info">
            <h1 className="post_title entry-title">
              Best <span>Off-Road Caravan</span> Manufacturers You Haven&apos;t
              Heard Of
            </h1>
            <p>
              Comprehensive information that helps our users research in the
              ever growing off road caravan marketplace in Australia.
            </p>
            <div>
              <Link
                href="#"
                className="btn rounded-pill hover-blue4 fw-bold mt-30 px-5 big-button border-blue4"
              >
                <small>
                  Hybrid Off Road, Semi Off Road, Full Off Road &amp; Extreme
                  Off Road Caravan Manufacturers
                </small>
              </Link>
            </div>
            <h2>
              <span>Superior Craftsmanship</span>
              <span>
                <em>*</em>Exceptional Workmanship
              </span>
              <span>
                <em>*</em>Hidden Gems
              </span>
            </h2>
            <div className="info top_cta_container">
              <div
                className="top_cta text-center"
                style={{ backgroundColor: "#000000" }}
              >
                <h4>
                  A SERIOUS COMPETITIVE EDGE THAT THE BIGGER PLAYERS WITH
                  MASSIVE COSTS &amp; PROFITS SIMPLY CANNOT MATCH.
                </h4>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default OffRoadCaravanHeader;
