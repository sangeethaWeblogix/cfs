import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Called by WordPress when a product/listing is saved/updated.
// Immediately purges ISR cache so fresh images/data show without waiting 24hr.
//
// Usage:
//   POST /api/revalidate?secret=YOUR_SECRET
//   Body: { "slug": "pro-rv-dingo-13ft6-touring-hybrid-ensuite-outdoor-kitchen" }
//
// Revalidate all pages (full site cache purge):
//   POST /api/revalidate?secret=YOUR_SECRET
//   Body: { "all": true }
//
// Set REVALIDATION_SECRET in .env.local / Vercel env vars.

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.REVALIDATION_SECRET || secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, all } = body as { slug?: string; all?: boolean };

    if (all) {
      // Purge all product detail pages; mark listing data stale (stale-on-error via unstable_cache)
      revalidatePath("/[slug]", "page");
      revalidateTag("listings", "days");
      return NextResponse.json({ revalidated: true, scope: "all pages" });
    }

    if (!slug) {
      return NextResponse.json({ error: "slug or all required" }, { status: 400 });
    }

    // Purge specific product detail page; mark listing data stale (not purged)
    revalidatePath(`/${slug}`, "page");
    revalidateTag("listings", "days");
    return NextResponse.json({ revalidated: true, paths: [`/${slug}`, "/listings"] });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
