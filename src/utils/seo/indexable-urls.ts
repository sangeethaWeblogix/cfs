import fs from "fs";
import path from "path";

function buildIndexableSet(): Set<string> {
  try {
    const filePath = path.join(process.cwd(), "src/app/url.csv");
    const content = fs.readFileSync(filePath, "utf-8");
    const BASE = "https://www.caravansforsale.com.au";
    const set = new Set<string>();
    for (const line of content.split(/\r?\n/).slice(1)) {
      const url = line.split("\t")[1]?.trim();
      if (!url) continue;
      let p = url.startsWith(BASE) ? url.slice(BASE.length) : url;
      if (!p.endsWith("/")) p += "/";
      set.add(p);
    }
    return set;
  } catch {
    return new Set();
  }
}

export const INDEXABLE_URLS: Set<string> = buildIndexableSet();
