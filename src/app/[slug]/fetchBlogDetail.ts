 import { cache } from "react";
 import { unstable_cache } from "next/cache";

 const MPN_API_KEY = process.env.CFS_API_KEY;
 const FETCH_TIMEOUT_MS = 8000;
 const MAX_ATTEMPTS = 3;
 // Back-to-back retries all hit the same bot challenge (logs show 3 attempts within 5ms).
 const RETRY_DELAY_MS = 400;
 const REVALIDATE_S = 300;

 class PostNotFound extends Error {}

 async function fetchWithTimeout(url: string) {
   const controller = new AbortController();
   const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
   try {
     return await fetch(url, {
       headers: {
         Accept: "application/json",
         ...(MPN_API_KEY && { Authorization: `Bearer ${MPN_API_KEY}` }),
       },
       signal: controller.signal,
     });
   } finally {
     clearTimeout(timer);
   }
 }

 // Throws on 404 and on exhausted retries (instead of returning null) so
 // unstable_cache below never stores a missing post or a bot-challenge failure.
 async function loadBlogDetail(slug: string, seed?: number) {
   const url = `https://admin.marketplacenetwork.com.au/wp-json/mpn/v1/blog/caravans/${encodeURIComponent(slug)}${seed ? `?seed=${seed}` : ""}`;

   let lastErr: unknown;
   for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
     if (attempt > 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt - 1)));
     try {
       const res = await fetchWithTimeout(url);
       if (res.status === 404) {
         throw new PostNotFound();
       }
       if (!res.ok) {
         lastErr = new Error(`blog-detail-new status ${res.status}`);
         continue;
       }
       const raw = await res.text();
       if (raw.includes("sgcaptcha") || raw.trimStart().startsWith("<html")) {
         console.error(`[fetchBlogDetail] Bot challenge blocked request | slug="${slug}" | attempt=${attempt}`);
         lastErr = new Error("sgcaptcha bot challenge");
         continue;
       }
       const idx = raw.indexOf('{"');
       return JSON.parse(idx >= 0 ? raw.substring(idx) : raw);
     } catch (err) {
       if (err instanceof PostNotFound) throw err;
       lastErr = err;
     }
   }

   console.error(`[fetchBlogDetail] All ${MAX_ATTEMPTS} attempts failed | slug="${slug}" |`, lastErr);
   throw lastErr instanceof Error ? lastErr : new Error("blog-detail fetch failed");
 }

 // Good responses are cached for REVALIDATE_S (a stale copy keeps being served if a
 // refresh fails) and purged on demand via the blog:<slug> tag (see /api/revalidate).
 // The seed is part of the key, so the featured-caravans shuffle still varies.
 const loadBlogDetailCached = (slug: string, seed?: number) =>
   unstable_cache(() => loadBlogDetail(slug, seed), ["blog-detail", slug, String(seed ?? "")], {
     revalidate: REVALIDATE_S,
     tags: [`blog:${slug}`, "blog-detail"],
   })();

 // cache() dedupes identical (slug, seed) calls within a single request, so
 // generateMetadata + layout + page no longer each hit the API separately
 // (as long as they pass the same seed). Passing a seed is what makes the
 // backend shuffle category_featured_products — without one it returns the
 // same set every time.
 export const fetchBlogDetail = cache(async (slug: string, seed?: number) => {
   try {
     return await loadBlogDetailCached(slug, seed);
   } catch {
     return null;
   }
 });
