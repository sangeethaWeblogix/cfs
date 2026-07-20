/* eslint-disable */
/**
 * Regenerate Routes Mapping
 * 
 * Lists all keys in KV and rebuilds the routes-mapping JSON.
 * Run this after all batched cache generation jobs complete.
 * 
 * This script reads all KV keys and their metadata (which contains the original path),
 * groups them by path, and uploads a fresh routes-mapping.
 * 
 * IMPORTANT - OUTPUT FORMAT (DO NOT CHANGE):
 * {
 *   "/": ["homepage-v1", "homepage-v2", "homepage-v3", "homepage-v4"],
 *   "/listings/": ["listings-home-v1", "listings-home-v2", ...],
 *   "/listings/caravans/nsw/": ["caravans-nsw-v1", "caravans-nsw-v2", ...]
 * }
 * 
 * Values are ALWAYS arrays, never strings.
 * The worker depends on this format for variant selection.
 */

const https = require('https');

// Use native https instead of node-fetch — node-fetch v2's Gunzip decompressor
// crashes with "Premature close" on large Cloudflare KV key list responses.
function httpsGet(url, authToken) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept-Encoding': 'identity', // no gzip — avoids decompression issues
      },
    };
    https.get(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('JSON parse error: ' + raw.slice(0, 200))); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const EXCLUDED_KEYS = ['routes-mapping']; // Keys that aren't page variants

async function fetchKVKeysPage(url, attempt = 1) {
  try {
    const data = await httpsGet(url, CF_API_TOKEN);
    if (!data.success) {
      throw new Error(`KV list failed: ${JSON.stringify(data.errors)}`);
    }
    return data;
  } catch (err) {
    if (attempt < 4) {
      const delay = attempt * 3000;
      console.warn(`   ⚠️  Attempt ${attempt}/3 failed (${err.message}), retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return fetchKVKeysPage(url, attempt + 1);
    }
    throw err;
  }
}

async function listAllKVKeys() {
  let allKeys = [];
  let cursor = null;
  let page = 1;

  console.log('📥 Listing all KV keys (with metadata)...');

  while (true) {
    let url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/keys?limit=1000`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }

    const data = await fetchKVKeysPage(url);

    allKeys = allKeys.concat(data.result);

    console.log(`   Page ${page}: ${data.result.length} keys (total: ${allKeys.length})`);

    cursor = data.result_info?.cursor;
    if (!cursor || data.result.length === 0) {
      break;
    }
    page++;
  }

  return allKeys;
}

function buildMappingFromKeys(keyObjects) {
  const mapping = {};
  
  // Special slugs that don't follow /listings/slug/ pattern
  // These MUST match the slugs in generate-priority-pages.js
  const SPECIAL_SLUGS = {
    'homepage': '/',
    'listings-home': '/listings/'
  };
  
  // Filter to variant keys only (must end with -v{number})
  const variantKeyObjects = keyObjects.filter(keyObj => {
    if (EXCLUDED_KEYS.includes(keyObj.name)) return false;
    return /-v\d+$/.test(keyObj.name);
  });
  
  console.log(`\n📊 Found ${variantKeyObjects.length} variant keys out of ${keyObjects.length} total keys`);
  
  let metadataHits = 0;
  let metadataMisses = 0;
  
  for (const keyObj of variantKeyObjects) {
    const key = keyObj.name;
    const match = key.match(/^(.+)-v(\d+)$/);
    if (!match) continue;
    
    const slug = match[1];
    let path;
    
    // Priority 1: Use metadata path if available (most accurate)
    if (keyObj.metadata && keyObj.metadata.path) {
      path = keyObj.metadata.path;
      metadataHits++;
    }
    // Priority 2: Use special slug mapping for known pages
    else if (SPECIAL_SLUGS[slug]) {
      path = SPECIAL_SLUGS[slug];
      metadataMisses++;
    }
    // Priority 3: Fallback - reconstruct from slug (legacy keys without metadata)
    else {
      path = `/listings/${slug.replace(/-/g, '/')}/`;
      metadataMisses++;
    }
    
    if (!mapping[path]) {
      mapping[path] = [];
    }
    mapping[path].push(key);
  }
  
  console.log(`   🏷️  Metadata hits: ${metadataHits}, Fallback: ${metadataMisses}`);
  
  // Sort variants within each path (v1, v2, v3, v4)
  for (const path in mapping) {
    mapping[path].sort((a, b) => {
      const variantA = parseInt(a.match(/-v(\d+)$/)?.[1] || '0');
      const variantB = parseInt(b.match(/-v(\d+)$/)?.[1] || '0');
      return variantA - variantB;
    });
  }
  
  return mapping;
}

async function uploadMapping(mapping) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
  const mappingJson = JSON.stringify(mapping, null, 2);
  const sizeKB = Math.round(mappingJson.length / 1024);
  
  console.log(`\n⬆️  Uploading routes-mapping (${sizeKB}KB, ${Object.keys(mapping).length} paths)...`);
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: mappingJson,
        timeout: 60000
      });
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        if (attempt < 3) {
          console.error(`   ⚠️  Attempt ${attempt}/3 failed (invalid response), retrying...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error('Invalid JSON response from KV API');
      }
      
      if (result.success) {
        console.log('   ✅ Routes mapping uploaded successfully!');
        return true;
      }
      
      throw new Error(result.errors?.map(e => e.message).join(', ') || 'Upload failed');
      
    } catch (error) {
      if (attempt < 3) {
        console.error(`   ⚠️  Attempt ${attempt}/3 failed: ${error.message}, retrying...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`   ❌ Upload failed after 3 attempts: ${error.message}`);
      return false;
    }
  }
  return false;
}

async function main() {
  console.log('█'.repeat(60));
  console.log('📋 REGENERATE ROUTES MAPPING');
  console.log('█'.repeat(60));
  
  if (!CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID || !CF_API_TOKEN) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }
  
  try {
    // Step 1: List all keys (with metadata)
    const keyObjects = await listAllKVKeys();
    
    if (keyObjects.length === 0) {
      console.log('⚠️  No keys found in KV namespace');
      process.exit(0);
    }
    
    // Step 2: Build mapping using metadata for accurate paths
    const mapping = buildMappingFromKeys(keyObjects);
    
    console.log(`\n📊 Mapping summary:`);
    console.log(`   Total paths: ${Object.keys(mapping).length}`);
    const totalVariants = Object.values(mapping).reduce((sum, v) => sum + v.length, 0);
    console.log(`   Total variants: ${totalVariants}`);
    
    // Validate: all values must be arrays
    let formatIssues = 0;
    for (const path in mapping) {
      if (!Array.isArray(mapping[path])) {
        console.error(`   ⚠️  Non-array value for path: ${path}`);
        mapping[path] = [mapping[path]]; // Auto-fix
        formatIssues++;
      }
    }
    if (formatIssues > 0) {
      console.log(`   🔧 Auto-fixed ${formatIssues} non-array values`);
    }
    
    // Show priority pages
    const priorityPaths = ['/', '/listings/'];
    for (const p of priorityPaths) {
      if (mapping[p]) {
        console.log(`   ${p} → [${mapping[p].join(', ')}]`);
      } else {
        console.log(`   ⚠️  ${p} NOT FOUND in mapping`);
      }
    }
    
    // Step 3: Upload
    const success = await uploadMapping(mapping);
    
    console.log('\n' + '█'.repeat(60));
    if (success) {
      console.log('✨ ROUTES MAPPING REGENERATED SUCCESSFULLY!');
    } else {
      console.log('❌ ROUTES MAPPING REGENERATION FAILED');
      process.exit(1);
    }
    console.log('█'.repeat(60));
    
  } catch (error) {
    console.error(`\n💥 Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
