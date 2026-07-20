/**
 * Client-safe (fs-free) copy of the curated indexable-URLs list.
 *
 * `./indexable-urls.ts` reads src/app/url.csv via Node's `fs` module at import
 * time — that only works in server-side code (page.tsx, meta.ts). Importing it
 * into a "use client" component would either break the build or silently pull
 * in an empty set, since `fs` isn't available in the browser bundle.
 *
 * This module instead imports a plain JSON snapshot of the same data
 * (cfs-paths/indexable-urls.json), which is safe to bundle client-side just
 * like the other cfs-paths/*.json files already used throughout the app.
 *
 * IMPORTANT: this JSON is a generated snapshot of url.csv, not a live read of
 * it. If url.csv changes, re-run `node scripts/generate-indexable-urls-json.js`
 * to keep this in sync — otherwise the client's indexed/noindex determination
 * can drift out of sync with the server's.
 */
import indexableUrlsData from "../../../cfs-paths/indexable-urls.json";

export const INDEXABLE_URLS_CLIENT: Set<string> = new Set(
  indexableUrlsData as string[]
);
