/* eslint-disable */
/**
 * Priority Pages Generation Script
 * Generates HTML cache for homepage and listings home using Puppeteer
 * REQUIRES PUPPETEER
 * 
 * IMPORTANT - SLUG FORMAT (DO NOT CHANGE):
 * Homepage:  homepage-v1, homepage-v2, homepage-v3, homepage-v4, homepage-v5
 * Listings:  listings-home-v1, listings-home-v2, listings-home-v3, listings-home-v4, listings-home-v5
 *
 * Routes-mapping format (DO NOT CHANGE):
 * { "/": ["homepage-v1", "homepage-v2", ...], "/listings/": ["listings-home-v1", ...] }
 * Values are ALWAYS arrays, never strings.
 */

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const VERCEL_BASE_URL = process.env.VERCEL_BASE_URL || 'https://caravansforsale-main-live.vercel.app';
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://www.caravansforsale.com.au';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CF_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const TARGET_PAGE = process.env.TARGET_PAGE || 'all';

// SKIP_ROUTES_UPDATE: When running in parallel with other generation jobs,
// skip routes mapping update to avoid race conditions.
// The update-routes-mapping job will handle it after all jobs complete.
const SKIP_ROUTES_UPDATE = process.env.SKIP_ROUTES_UPDATE === 'true';

// REQUIRE_FULL_SUCCESS: set by the post-deploy canary run (post-deploy-warmup.yml).
// That run only generates 10 variants total (homepage + /listings/), so it's cheap
// to require a perfectly clean render before trusting the new deployment. When set,
// current-build-id is left untouched unless every single variant succeeds with no
// errors — this is what stops a broken deploy from ever going live to real traffic.
// Not set during the weekly full url.csv rebuild (individual pages there already
// have their own per-variant error skip; a single flaky listing shouldn't block
// the whole site's cache from refreshing).
const REQUIRE_FULL_SUCCESS = process.env.REQUIRE_FULL_SUCCESS === 'true';

const LISTINGS_VARIANTS = 7;
const KV_UPLOAD_RETRIES = 3;
const KV_RETRY_DELAY = 2000;

const STATIC_PAGES = [
  { 
    path: '/', 
    slug: 'homepage',
    variants: LISTINGS_VARIANTS,
    id: 'homepage'
  },
  { 
    path: '/listings/', 
    slug: 'listings-home',
    variants: LISTINGS_VARIANTS,
    id: 'listings'
  },
];

async function uploadToKV(key, value, metadata = null) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${key}`;
  
  for (let attempt = 1; attempt <= KV_UPLOAD_RETRIES; attempt++) {
    try {
      let requestOptions;
      
      if (metadata) {
        const boundary = '----CFSFormBoundary' + Date.now();
        let bodyStr = '';

        // Value part
        bodyStr += `--${boundary}\r\n`;
        bodyStr += `Content-Disposition: form-data; name="value"; filename="blob"\r\n`;
        bodyStr += `Content-Type: text/html\r\n\r\n`;
        bodyStr += value;
        bodyStr += `\r\n`;

        // Metadata part
        bodyStr += `--${boundary}\r\n`;
        bodyStr += `Content-Disposition: form-data; name="metadata"\r\n`;
        bodyStr += `Content-Type: application/json\r\n\r\n`;
        bodyStr += JSON.stringify(metadata);
        bodyStr += `\r\n`;

        bodyStr += `--${boundary}--\r\n`;

        // Convert to Buffer so node-fetch sends Content-Length instead of
        // Transfer-Encoding: chunked — Cloudflare KV closes chunked connections
        // prematurely on large payloads (>30KB), causing "Premature close" errors.
        const bodyBuffer = Buffer.from(bodyStr, 'utf8');

        requestOptions = {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': String(bodyBuffer.length),
            'Connection': 'close'
          },
          body: bodyBuffer,
          timeout: 60000
        };
      } else {
        // Convert to Buffer — same reason as above (prevents chunked encoding)
        const bodyBuffer = Buffer.from(value, 'utf8');
        requestOptions = {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'text/plain',
            'Content-Length': String(bodyBuffer.length),
            'Connection': 'close'
          },
          body: bodyBuffer,
          timeout: 60000
        };
      }
      
      const response = await fetch(url, requestOptions);
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        if (attempt < KV_UPLOAD_RETRIES) {
          console.error(`   ⚠️  KV upload attempt ${attempt}/${KV_UPLOAD_RETRIES} failed (invalid response), retrying in ${KV_RETRY_DELAY/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, KV_RETRY_DELAY));
          continue;
        }
        console.error(`   ❌ KV upload error after ${KV_UPLOAD_RETRIES} attempts: Invalid JSON response`);
        return false;
      }
      
      if (result.success) {
        return true;
      }
      
      const errorMsg = result.errors?.map(e => e.message).join(', ') || 'Unknown error';
      if (attempt < KV_UPLOAD_RETRIES) {
        console.error(`   ⚠️  KV upload attempt ${attempt}/${KV_UPLOAD_RETRIES} failed: ${errorMsg}, retrying in ${KV_RETRY_DELAY/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, KV_RETRY_DELAY));
        continue;
      }
      console.error(`   ❌ KV upload error after ${KV_UPLOAD_RETRIES} attempts: ${errorMsg}`);
      return false;
      
    } catch (error) {
      if (attempt < KV_UPLOAD_RETRIES) {
        console.error(`   ⚠️  KV upload attempt ${attempt}/${KV_UPLOAD_RETRIES} failed: ${error.message}, retrying in ${KV_RETRY_DELAY/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, KV_RETRY_DELAY));
        continue;
      }
      console.error(`   ❌ KV upload error after ${KV_UPLOAD_RETRIES} attempts: ${error.message}`);
      return false;
    }
  }
  
  return false;
}

// ============================================
// ERROR PAGE DETECTION
// If your app shows a new error UI, add its unique text here.
// These pages will be skipped and never written to KV.
// ============================================
function isErrorPage(html) {
  const errorSignatures = [
    // Image 1: API/listing load failure
    "Sorry, something went wrong",
    "We couldn't load the listings at this moment",
    // Image 2: Service error
    "Service error",
    "Our listing service encountered an error",
    // Image 3: Generic error page (Oops variant)
    "Oops! Something went wrong",
    "temporarily unavailable",
    // Next.js unhandled exception
    "Application error: a client-side exception has occurred",
    // Generic fallback
    "This page could not be found",
  ];

  for (const sig of errorSignatures) {
    if (html.includes(sig)) {
      return sig; // returns the matched string for logging
    }
  }
  return false; // not an error page
}

async function generatePageVariant(page, variantNumber, browser) {
  let url = `${VERCEL_BASE_URL}${page.path}`;
  if (page.variants > 1) {
    url += `?shuffle_seed=${variantNumber}`;
  }
  
  // KV key format: {slug}-v{number}  (e.g., homepage-v1, listings-home-v2)
  const kvKey = page.variants > 1 ? `${page.slug}-v${variantNumber}` : page.slug;
  
  console.log(`\n🔄 Generating: ${page.path} (variant ${variantNumber})`);
  console.log(`   Slug: ${kvKey}`);
  console.log(`   URL: ***?shuffle_seed=${variantNumber}`);
  
  try {
    const browserPage = await browser.newPage();
    await browserPage.setViewport({ width: 1920, height: 1080 });
    
    console.log(`   🌐 Using Puppeteer...`);

    const fetchStart = Date.now();

    // Use 'load' instead of 'networkidle2'.
    // ?shuffle_seed=N forces a dynamic RSC render on Vercel; analytics/polling scripts
    // keep the network connection count above 2 indefinitely, causing networkidle2 to
    // wait the full 60s and then timeout. 'load' fires as soon as the page and its
    // static resources are ready — the 5s extra wait handles JS-driven rendering.
    // Retry once on timeout: dynamic RSC renders can be slow on cold Vercel functions.
    let html;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`   🔁 Retry attempt ${attempt}...`);
          await browserPage.goto('about:blank');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        await browserPage.goto(url, {
          waitUntil: 'load',
          timeout: 60000
        });
        break; // success — exit retry loop
      } catch (err) {
        if (attempt < 2 && err.message.includes('timeout')) {
          console.warn(`   ⚠️  Navigation timeout on attempt ${attempt}, retrying...`);
          continue;
        }
        throw err; // non-timeout error or last attempt — propagate
      }
    }

    // Wait for dynamic content to finish rendering
    await new Promise(resolve => setTimeout(resolve, 5000));

    html = await browserPage.content();
    await browserPage.close();
    
    const fetchDuration = Math.round((Date.now() - fetchStart) / 1000);
    console.log(`   ⏱️  Fetched in ${fetchDuration}s`);
    
    if (!html.includes('</html>')) {
      throw new Error('Invalid HTML response (no closing </html> tag)');
    }

    // Check for error pages — must never be cached
    const errorMatch = isErrorPage(html);
    if (errorMatch) {
      console.log(`   🚫 Skipping: Error page detected ("${errorMatch}")`);
      return {
        path: page.path,
        slug: kvKey,
        variant: variantNumber,
        status: 'skipped_error'
      };
    }
    
    // ============================================
    // IMAGE OPTIMIZATION ONLY (NO SEO TAGS)
    // ============================================
    
    // Add performance optimizations for images
    const imageOptimizations = `
    <link rel="dns-prefetch" href="https://caravansforsale.imagestack.net" />
    <link rel="preconnect" href="https://caravansforsale.imagestack.net" crossorigin />`;
    
    // Extract and preload first 6 images
    const imageMatches = [...html.matchAll(/src="([^"]+\/(CFS-[^/]+)\/[^"]+\.(jpg|jpeg|png|webp))"/gi)];
    const firstImages = imageMatches.slice(0, 6).map(match => {
      const imgPath = match[1];
      if (imgPath.includes('caravansforsale.imagestack.net')) {
        return imgPath;
      }
      const fileName = imgPath.split('/').slice(-2).join('/');
      return `https://caravansforsale.imagestack.net/800x800/${fileName}`;
    });
    
    const preloadLinks = firstImages
      .map(url => `<link rel="preload" as="image" href="${url}" fetchpriority="high" />`)
      .join('\n');
    
    // Inject ONLY image optimization tags (NO SEO!)
    const performanceTags = `${imageOptimizations}
    ${preloadLinks}`;
    
    html = html.replace('</head>', `${performanceTags}\n</head>`);
    
    // Remove any noindex tags if present
    html = html.replace(/<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/gi, '');
    
    const sizeKB = Math.round(html.length / 1024);
    console.log(`   ⬆️  Uploading (${sizeKB}KB)...`);
    
    const uploadStart = Date.now();
    const uploaded = await uploadToKV(kvKey, html);
    const uploadDuration = Math.round((Date.now() - uploadStart) / 1000);
    
    if (uploaded) {
      console.log(`   ✅ Success! Uploaded in ${uploadDuration}s`);
      return {
        path: page.path,
        slug: kvKey,
        variant: variantNumber,
        status: 'success',
        size: sizeKB + 'KB'
      };
    } else {
      throw new Error('KV upload returned false');
    }
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return {
      path: page.path,
      slug: kvKey,
      variant: variantNumber,
      status: 'failed',
      error: error.message
    };
  }
}

async function generateStaticPages() {
  console.log('\n' + '█'.repeat(70));
  console.log('🎯 PRIORITY PAGES GENERATION (With Puppeteer)');
  console.log('█'.repeat(70));
  console.log(`📍 Vercel URL: ${VERCEL_BASE_URL}`);
  console.log(`📍 Production: ${PRODUCTION_DOMAIN}`);
  console.log(`🎯 Target: ${TARGET_PAGE || 'all'}`);
  console.log(`🔢 Variants: ${LISTINGS_VARIANTS}`);
  if (SKIP_ROUTES_UPDATE) {
    console.log(`⏭️  Routes mapping update: SKIPPED (parallel mode)`);
  }
  console.log('█'.repeat(70));
  
  // Filter pages based on target
  let pagesToGenerate = STATIC_PAGES;
  if (TARGET_PAGE && TARGET_PAGE !== 'all') {
    pagesToGenerate = STATIC_PAGES.filter(p => p.id === TARGET_PAGE);
    
    if (pagesToGenerate.length === 0) {
      console.error(`\n❌ Unknown target page: ${TARGET_PAGE}`);
      console.error(`   Valid options: homepage, listings, all`);
      process.exit(1);
    }
    
    console.log(`\n🎯 Generating only: ${pagesToGenerate[0].path}\n`);
  } else {
    console.log(`\n📋 Generating all ${pagesToGenerate.length} pages\n`);
  }
  
  const results = {
    success: 0,
    failed: 0,
    pages: [],
    errors: []
  };
  
  const startTime = Date.now();
  
  console.log('='.repeat(70));
  console.log('🌐 Launching headless browser...');
  console.log('='.repeat(70));
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  console.log('✅ Browser launched!\n');
  
  try {
    let totalGenerated = 0;
    const totalVariants = pagesToGenerate.reduce((sum, page) => sum + page.variants, 0);
    
    for (const page of pagesToGenerate) {
      console.log('\n' + '-'.repeat(70));
      console.log(`📍 Processing: ${page.path}`);
      console.log('-'.repeat(70));
      
      for (let variant = 1; variant <= page.variants; variant++) {
        totalGenerated++;
        const progress = Math.round((totalGenerated / totalVariants) * 100);
        
        console.log(`\n[${totalGenerated}/${totalVariants}] Progress: ${progress}%`);
        
        const result = await generatePageVariant(page, variant, browser);
        
        if (result.status === 'success') {
          results.success++;
          results.pages.push(result);
        } else if (result.status === 'skipped_error') {
          results.skipped_error = (results.skipped_error || 0) + 1;
          console.log(`   🚫 Variant ${result.variant} was an error page, not cached`);
        } else {
          results.failed++;
          results.errors.push(result);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } finally {
    console.log('\n' + '='.repeat(70));
    console.log('🔒 Closing browser...');
    await browser.close();
    console.log('✅ Browser closed');
    console.log('='.repeat(70));
  }
  
  // Update routes mapping (merge with existing)
  // Skip if SKIP_ROUTES_UPDATE is set (parallel mode)
  if (SKIP_ROUTES_UPDATE) {
    console.log('\n' + '='.repeat(70));
    console.log('⏭️  SKIPPING ROUTES MAPPING UPDATE (Parallel mode - SKIP_ROUTES_UPDATE=true)');
    console.log('   The update-routes-mapping job will rebuild from KV metadata after all jobs complete.');
    console.log('='.repeat(70));
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('📋 Updating routes mapping (Merging with existing)...');
    console.log('='.repeat(70));
    
    // Load existing mapping first
    let mapping = {};
    try {
      const existingMappingUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/routes-mapping`;
      const existingResponse = await fetch(existingMappingUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`
        }
      });
      
      if (existingResponse.ok) {
        const existingText = await existingResponse.text();
        mapping = JSON.parse(existingText);
        console.log(`\n✅ Loaded existing mapping with ${Object.keys(mapping).length} paths`);
      } else {
        console.log(`\nℹ️  No existing mapping found, starting fresh`);
      }
    } catch (error) {
      console.log(`\n⚠️  Could not load existing mapping: ${error.message}`);
      console.log(`   Starting with empty mapping`);
    }
    
    // Normalize any legacy string values to arrays
    for (const path in mapping) {
      if (typeof mapping[path] === 'string') {
        mapping[path] = [mapping[path]];
      }
    }
    
    // Update/add priority pages to mapping
    // ALWAYS use arrays for consistency with worker and regenerate-routes-mapping
    for (const page of pagesToGenerate) {
      const variants = [];
      for (let i = 1; i <= page.variants; i++) {
        variants.push(`${page.slug}-v${i}`);
      }
      mapping[page.path] = variants;
    }
    
    console.log('\n📍 Updated routes mapping (showing priority pages only):');
    const priorityMapping = {};
    for (const page of pagesToGenerate) {
      priorityMapping[page.path] = mapping[page.path];
    }
    console.log(JSON.stringify(priorityMapping, null, 2));
    
    console.log(`\n📊 Total paths in mapping: ${Object.keys(mapping).length}`);
    
    const mappingJson = JSON.stringify(mapping, null, 2);
    const sizeKB = Math.round(mappingJson.length / 1024);
    console.log(`📦 Mapping size: ${sizeKB}KB`);
    
    console.log('\n⬆️  Uploading merged routes mapping...');
    const mappingUploaded = await uploadToKV('routes-mapping', mappingJson);
    
    if (mappingUploaded) {
      console.log('✅ Routes mapping uploaded successfully!');
    } else {
      console.error('❌ Routes mapping upload failed');
    }
  }
  
  // ============================================
  // STORE CURRENT BUILD-ID IN KV — gated on a clean run
  // ============================================
  // The worker reads 'current-build-id' to detect when KV HTML is stale after a
  // Vercel redeployment. It compares this value against the buildId embedded in the
  // HTML (__NEXT_DATA__). A mismatch means Vercel has been redeployed since the last
  // KV generation → worker bypasses KV and serves fresh HTML from Vercel instead.
  // This prevents the "first filter apply fails after deploy" RSC navigation bug.
  //
  // When REQUIRE_FULL_SUCCESS is set, this write is the ONLY thing that switches
  // the live site over to a new deployment's cache. If anything failed or came
  // back as an error page, we deliberately skip this write — current-build-id
  // stays at its old value, so the worker keeps serving the previous, still-correct
  // cached HTML instead of falling through to a possibly-broken origin.
  const successfulPages = results.pages.filter(p => p.status === 'success');
  const totalVariantsRequested = pagesToGenerate.reduce((sum, page) => sum + page.variants, 0);
  const cleanRun = results.failed === 0 && (results.skipped_error || 0) === 0 && results.success === totalVariantsRequested;
  results.canaryFailed = REQUIRE_FULL_SUCCESS && !cleanRun;

  if (results.canaryFailed) {
    console.error('\n' + '█'.repeat(70));
    console.error('🚫 CANARY FAILED — current-build-id will NOT be updated.');
    console.error(`   Requested: ${totalVariantsRequested} variants | Success: ${results.success} | Failed: ${results.failed} | Error pages skipped: ${results.skipped_error || 0}`);
    console.error('   The live site keeps serving the previous (last known-good) cache.');
    console.error('   Fix the failure above, confirm the deploy is healthy, then re-run this workflow.');
    console.error('█'.repeat(70));
  } else if (successfulPages.length > 0) {
    // Read back one of the successfully generated HTML pages to extract the buildId
    try {
      const sampleKey = successfulPages[0].slug;
      const sampleUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(sampleKey)}`;
      const sampleRes = await fetch(sampleUrl, {
        headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
      });
      if (sampleRes.ok) {
        const sampleHtml = await sampleRes.text();
        const buildIdMatch = sampleHtml.match(/"buildId":"([^"]+)"/);
        if (buildIdMatch) {
          const buildId = buildIdMatch[1];
          const stored = await uploadToKV('current-build-id', buildId);
          if (stored) {
            console.log(`\n✅ Stored current-build-id: ${buildId}`);
          } else {
            console.error('\n⚠️  Failed to store current-build-id in KV');
          }
        } else {
          console.warn('\n⚠️  Could not extract buildId from generated HTML');
        }
      }
    } catch (err) {
      console.error(`\n⚠️  current-build-id update failed: ${err.message}`);
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const totalVariants = pagesToGenerate.reduce((sum, page) => sum + page.variants, 0);

  console.log('\n' + '█'.repeat(70));
  console.log('📊 GENERATION COMPLETE');
  console.log('█'.repeat(70));
  console.log(`🎯 Target: ${TARGET_PAGE || 'all'}`);
  console.log(`✅ Success: ${results.success} variants`);
  console.log(`❌ Failed: ${results.failed} variants`);
  console.log(`🔄 Total variants generated: ${totalVariants}`);
  console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
  console.log(`📦 Average: ${Math.round(duration / totalVariants * 10) / 10}s per variant`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(err => {
      console.log(`   ${err.path} (v${err.variant}): ${err.error}`);
    });
  }
  
  console.log('\n✨ Done!\n');
  
  return results;
}

if (require.main === module) {
  generateStaticPages()
    .then((results) => {
      if (results.failed > 0 || results.canaryFailed) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { generateStaticPages };
