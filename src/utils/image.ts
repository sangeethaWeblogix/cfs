const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;

export function fixImageUrl(url?: string): string {
  if (!url) return "/placeholder.jpg"; // fallback image
  if (url.startsWith("https")) return url;
  return `${API_BASE}${url}`;
}
