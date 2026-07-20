import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// url.csv is the curated list of /listings/ URLs that are actually meant to
// be indexed/crawled — everything else (condition-only pages, deep filter
// combos, etc.) gets a stripped-down hero (no banner image, no description)
// on the demo pages. Parsed once per server instance, not per request.
let indexedPaths: Set<string> | null = null;

function normalize(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+/, "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");
}

function loadIndexedPaths(): Set<string> {
  if (indexedPaths) return indexedPaths;
  const csvPath = path.join(process.cwd(), "src", "app", "url.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const set = new Set<string>();
  for (const line of raw.split("\n").slice(1)) {
    const url = line.split("\t")[1];
    if (url) set.add(normalize(url));
  }
  indexedPaths = set;
  return set;
}

export async function GET(request: NextRequest) {
  const targetPath = request.nextUrl.searchParams.get("path") ?? "";
  const indexed = loadIndexedPaths().has(normalize(targetPath));
  return NextResponse.json({ indexed });
}
