/* eslint-disable */
/**
 * View a cached HTML page from Cloudflare KV.
 *
 * Usage:
 *   node scripts/view-kv.js /listings/caravans/nsw/
 *   node scripts/view-kv.js caravans-nsw-v1          (direct KV key)
 *   node scripts/view-kv.js /listings/caravans/nsw/ --variant 3
 *
 * Saves the HTML to kv-preview.html in the project root, then open it in your browser.
 *
 * Requires env vars (or a .env.local file):
 *   CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN
 */

const fs   = require('fs');
const path = require('path');

// ── Load .env.local if present ────────────────────────────────────────────────
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const CF_ACCOUNT_ID      = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN       = process.env.CF_API_TOKEN;

if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
  console.error('❌  Missing env vars: CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN');
  console.error('    Add them to .env.local or pass inline:');
  console.error('    CF_ACCOUNT_ID=x CF_KV_NAMESPACE_ID=y CF_API_TOKEN=z node scripts/view-kv.js /listings/caravans/nsw/');
  process.exit(1);
}

// ── Args ──────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const input   = args.find(a => !a.startsWith('--'));
const variant = args.includes('--variant') ? parseInt(args[args.indexOf('--variant') + 1]) : 1;

if (!input) {
  console.error('Usage: node scripts/view-kv.js <path-or-key> [--variant 1-5]');
  console.error('  Examples:');
  console.error('    node scripts/view-kv.js /listings/caravans/nsw/');
  console.error('    node scripts/view-kv.js /listings/caravans/nsw/ --variant 3');
  console.error('    node scripts/view-kv.js caravans-nsw-v2');
  process.exit(1);
}

// ── Path → slug (mirrors generate-sitemap-cache-simple.js) ───────────────────
function pathToSlug(p) {
  let s = p;
  if (s.startsWith('/listings/')) s = s.substring(10);
  s = s.replace(/^\/+|\/+$/g, '');
  s = s.replace(/\//g, '-');
  s = s.replace(/[^a-z0-9-]/g, '');
  if (s.length > 150) s = s.substring(0, 150);
  return s || 'home';
}

// ── Resolve KV key ────────────────────────────────────────────────────────────
let kvKey;
if (input.startsWith('/')) {
  // It's a URL path — convert to slug + variant
  const slug = pathToSlug(input);
  kvKey = `${slug}-v${variant}`;
  console.log(`\n📂 Path:    ${input}`);
  console.log(`🔑 KV key:  ${kvKey}`);
} else {
  // Already a KV key (e.g. caravans-nsw-v1)
  kvKey = input;
  console.log(`\n🔑 KV key:  ${kvKey}`);
}

// ── Fetch from KV ─────────────────────────────────────────────────────────────
async function fetchFromKV(key) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`CF API HTTP ${res.status}: ${txt.substring(0, 200)}`);
  }

  return res.text();
}

// ── List all variants for a slug ──────────────────────────────────────────────
async function listVariants(slug) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/keys?prefix=${encodeURIComponent(slug + '-v')}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.result || []).map(k => k.name);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🌐 Fetching from Cloudflare KV...`);

  const html = await fetchFromKV(kvKey);

  if (!html) {
    console.error(`\n❌  Key not found in KV: "${kvKey}"`);

    // Show which variants DO exist
    const slugBase = kvKey.replace(/-v\d+$/, '');
    const existing = await listVariants(slugBase);
    if (existing.length > 0) {
      console.log(`\n💡 Found these variants for "${slugBase}":`);
      existing.forEach(k => console.log(`   • ${k}`));
    } else {
      console.log(`\n💡 No variants found for "${slugBase}" — page may not be cached yet.`);
    }
    process.exit(1);
  }

  // ── Save HTML ──────────────────────────────────────────────────────────────
  const outPath = path.join(__dirname, '../kv-preview.html');
  fs.writeFileSync(outPath, html, 'utf8');

  const sizeKB = Math.round(html.length / 1024);
  console.log(`\n✅  Cached HTML found!`);
  console.log(`   Size:     ${sizeKB} KB`);
  console.log(`   Saved to: kv-preview.html`);
  console.log(`\n👉 Open kv-preview.html in your browser to view the cached page.`);

  // ── Quick stats ────────────────────────────────────────────────────────────
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match    = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) console.log(`   Title:    ${titleMatch[1].trim()}`);
  if (h1Match)    console.log(`   H1:       ${h1Match[1].trim()}`);

  // Show all 5 variants available
  const slugBase = kvKey.replace(/-v\d+$/, '');
  const existing = await listVariants(slugBase);
  if (existing.length > 0) {
    console.log(`\n📦 All cached variants for this page:`);
    existing.forEach(k => console.log(`   • ${k}`));
    console.log(`\n   To view a different variant:`);
    console.log(`   node scripts/view-kv.js ${input.startsWith('/') ? input : slugBase} --variant 2`);
  }
}

main().catch(err => {
  console.error('\n❌  Error:', err.message);
  process.exit(1);
});
