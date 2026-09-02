/**
 * clear-noindex-kv-entries.js
 *
 * Removes specific KV HTML cache entries (and their routes-mapping entry) for
 * a URL that should never have been cached — typically a noindex/0-result page
 * that ended up with stale or poisoned HTML in KV.
 *
 * Usage:
 *   node scripts/clear-noindex-kv-entries.js /listings/australian-off-road/used-condition/touring-category/victoria-state/
 *
 * Requires env vars (same as the cache generator):
 *   CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN
 */

const CF_ACCOUNT_ID      = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN       = process.env.CF_API_TOKEN;
const VARIANT_COUNT      = 7;

if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
  console.error('ERROR: CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, and CF_API_TOKEN must be set.');
  process.exit(1);
}

const urlPath = process.argv[2];
if (!urlPath || !urlPath.startsWith('/listings/')) {
  console.error('Usage: node scripts/clear-noindex-kv-entries.js /listings/<slug>/');
  process.exit(1);
}

// Must match pathToSlug() in generate-affected-html-cache.js exactly
function pathToSlug(p) {
  let s = p;
  if (s.startsWith('/listings/')) s = s.substring(10);
  s = s.replace(/^\/+|\/+$/g, '');
  s = s.replace(/\//g, '-');
  s = s.replace(/[^a-z0-9-]/g, '');
  if (s.length > 150) s = s.substring(0, 150);
  return s || 'home';
}

const KV_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}`;
const HEADERS  = { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' };

async function deleteKey(key) {
  const res = await fetch(`${KV_BASE}/values/${encodeURIComponent(key)}`, { method: 'DELETE', headers: HEADERS });
  const ok = res.status === 200 || res.status === 404; // 404 = already gone, that's fine
  console.log(`  DELETE ${key} → ${res.status} ${ok ? '✓' : '✗'}`);
  return ok;
}

async function removeFromRoutesMapping(path) {
  // Fetch current mapping
  const res = await fetch(`${KV_BASE}/values/routes-mapping`, { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } });
  if (!res.ok) { console.error('  Could not fetch routes-mapping:', res.status); return; }
  const mapping = JSON.parse(await res.text());

  const normalised = path.endsWith('/') ? path : `${path}/`;
  if (!mapping[normalised]) {
    console.log(`  routes-mapping: ${normalised} not found — nothing to remove`);
    return;
  }

  delete mapping[normalised];

  // Write back
  const body = JSON.stringify(mapping, null, 2);
  const putRes = await fetch(`${KV_BASE}/values/routes-mapping`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'text/plain' },
    body,
  });
  console.log(`  routes-mapping updated → ${putRes.status} ${putRes.ok ? '✓' : '✗'}`);
}

async function main() {
  const slug = pathToSlug(urlPath);
  console.log(`\nClearing KV entries for: ${urlPath}`);
  console.log(`Slug: ${slug}\n`);

  // Delete all variant HTML entries
  for (let v = 1; v <= VARIANT_COUNT; v++) {
    await deleteKey(`${slug}-v${v}`);
  }

  // Remove from routes-mapping so the Worker falls through to Vercel
  console.log('\nUpdating routes-mapping...');
  await removeFromRoutesMapping(urlPath);

  console.log('\nDone. The Worker will now pass this URL through to Vercel origin.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
