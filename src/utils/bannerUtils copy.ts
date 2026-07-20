export function extractPathname(url: string): string {
  try {
    const formatted = url.startsWith("http") ? url : `https://${url}`;

    const { pathname } = new URL(formatted);

    return pathname.replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function parseExcludedUrls(excluded_urls?: string): string[] {
  if (!excluded_urls) return [];

  return excluded_urls
    .split(",")
    .map((url) => extractPathname(url.trim()))
    .filter(Boolean);
}

type Banner = {
  page_url: string;
  url_match_type: "exact" | "contains";
  excluded_urls?: string;
};

export function shouldShowBanner(
  currentPathname: string,
  banner: Banner,
): boolean {
  // Normalize current path
  const cleanCurrent = currentPathname.replace(/\/$/, "") || "/";

  const bannerPageUrl = banner.page_url || "";
  
  // Extract just the pathname from banner's page_url
  const includePath = extractPathname(bannerPageUrl).replace(/\/$/, "") || "/";
  
  const excludedPaths = parseExcludedUrls(banner.excluded_urls);

  // Check excluded URLs
  if (
    excludedPaths.some((path) =>
      cleanCurrent === path || cleanCurrent.includes(path)
    )
  ) {
    return false;
  }

  if (banner.url_match_type === "exact") {
    return cleanCurrent === includePath;
  }

  if (banner.url_match_type === "contains") {
    // Home page special case: "/" contains everything — so match exactly
    if (cleanCurrent === "" || cleanCurrent === "/") {
      return includePath === "" || includePath === "/";
    }
    return cleanCurrent.includes(includePath);
  }

  return false;
}