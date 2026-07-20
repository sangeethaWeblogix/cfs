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
    const pageRes = await fetch(listingsUrl, {
      headers: {
        'x-internal-render': '1',
        'user-agent': request.headers.get('user-agent') || 'next-internal',
        'accept': 'text/html',
      },
      cache: 'no-store',
    });

    const html = await pageRes.text();

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
