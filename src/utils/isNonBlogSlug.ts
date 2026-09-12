// Slugs that browsers/crawlers request automatically — never real blog posts.
// Bail out before touching the API to avoid noisy 404 log spam.
const NON_BLOG_SLUG_PATTERN = /\.(png|jpg|jpeg|gif|ico|svg|xml|txt|json|webp|bmp|css|js|woff|woff2|ttf|eot|mov|mp4|avi|mkv|webm|wmv|flv|mp3|wav|pdf|zip)$/i;
const NON_BLOG_EXACT = new Set(['wp-json', 'wp-admin', 'wp-login', 'wp-login.php', 'favicon.ico', 'robots.txt', 'sitemap.xml']);

export function isNonBlogSlug(slug: string): boolean {
  return NON_BLOG_SLUG_PATTERN.test(slug) || NON_BLOG_EXACT.has(slug);
}
