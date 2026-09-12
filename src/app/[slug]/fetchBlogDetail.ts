 import { cache } from "react";
 
 const MPN_API_KEY = process.env.CFS_API_KEY;
 const FETCH_TIMEOUT_MS = 8000;
 const MAX_ATTEMPTS = 3;
 
 async function fetchWithTimeout(url: string) {
   const controller = new AbortController();
   const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
   try {
     return await fetch(url, {
       cache: "no-store",
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
 
 // cache() dedupes identical slug calls within a single request, so
 // generateMetadata + layout + page no longer each hit the API separately.
 export const fetchBlogDetail = cache(async (slug: string) => {
   const url = `https://admin.marketplacenetwork.com.au/wp-json/mpn/v1/blog/caravans/${encodeURIComponent(slug)}`;
 
   let lastErr: unknown;
   for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
     try {
       const res = await fetchWithTimeout(url);
       if (res.status === 404) {
         return null;
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
       lastErr = err;
     }
   }
 
   console.error(`[fetchBlogDetail] All ${MAX_ATTEMPTS} attempts failed | slug="${slug}" |`, lastErr);
   return null;
 });
 