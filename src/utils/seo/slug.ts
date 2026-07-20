// utils/slug.ts
export const toSlug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/['’′]/g, "") // remove apostrophes/prime
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
