import Home from "./home";
import "../globals.css";
 import { fetchStateBasedCaravans } from "@/api/homeApi/state/api";
import { fetchRequirements } from "@/api/postRquirements/api";
import { fetchHomePage } from "@/api/home/api";
import { fetchTypeCounts } from "@/api/homeApi/typeCounts/api";
import { fetchHomeFeatured } from "@/api/homeApi/featured/api";
import { fetchBlogs } from "@/api/blog/api";

const FEATURED_SEED_MAX = 15;

export const revalidate = 86400;

export default async function HomeDemoPage() {
  const featuredSeed = Math.floor(Math.random() * FEATURED_SEED_MAX) + 1;

  const [
    stateBands,
    requirements,
    homeblog,
    typeCounts,
    featuredAll,
    featuredNew,
    featuredUsed,
    blogPosts,
  ] = await Promise.all([
    fetchStateBasedCaravans(),
    fetchRequirements(),
    fetchHomePage(),
    fetchTypeCounts(),
    fetchHomeFeatured({ type: "all", seed: featuredSeed }),
    fetchHomeFeatured({ type: "new", seed: featuredSeed }),
    fetchHomeFeatured({ type: "used", seed: featuredSeed }),
    fetchBlogs(1),
  ]);

  return (
    <Home
      stateBands={stateBands}
      requirements={requirements}
      homeblog={homeblog?.latest_posts ?? []}
      typeCounts={typeCounts}
      featuredAll={featuredAll}
      featuredNew={featuredNew}
      featuredUsed={featuredUsed}
      blogPosts={blogPosts.items}
      visitorIp=""
    />
  );
}
