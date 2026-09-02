import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  const searchParams = new URL(request.url).searchParams.toString();
  const listingsUrl = `${protocol}://${host}/listings/${slug.join('/')}/${searchParams ? '?' + searchParams : ''}`;

  try {
    // CFS_BYPASS_TOKEN is added so the Cloudflare WAF Skip rule ("Allow Worker subrequests")
    // lets this Vercel-origin self-fetch through the geo-block. Without it, Vercel's non-AU IP
    // triggers the WAF block and this fetch returns the Cloudflare block page HTML.
    const bypassToken = process.env.CFS_BYPASS_TOKEN || '';
    const pageRes = await fetch(listingsUrl, {
      headers: {
        'x-internal-render': '1',
        ...(bypassToken && { 'x-cfs-worker-token': bypassToken }),
        'user-agent': request.headers.get('user-agent') || 'next-internal',
        'accept': 'text/html',
      },
      cache: 'no-store',
    });

    const html = await pageRes.text();
    // Guard: if we still got a block page (token missing/wrong), return a generic gone page
    if (!html.includes('__NEXT_DATA__') && html.includes('you have been blocked')) {
      return new Response('<html><body>Gone</body></html>', {
        status: 410,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' },
      });
    }

    return new Response(html, {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    // Return a proper body so node-fetch (warmup script) doesn't throw "Premature close"
    // on a null-body 410 with no Content-Length header.
    return new Response('<html><body>Gone</body></html>', {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-store',
      },
    });
  }
}
