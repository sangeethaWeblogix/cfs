import { cache } from "react";

function toTitleCase(slug: string): string {
  return slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function normalizeMpnProduct(raw: any) {
  const toRegion = (val: string) =>
    val ? { value: val, slug: val.toLowerCase().replace(/\s+/g, "-"), label: val } : undefined;

  const specs = [
    { label: "Make",               value: raw.make },
    { label: "Model",              value: raw.model },
    { label: "Years",              value: raw.year != null ? String(raw.year) : null },
    { label: "Conditions",         value: raw.condition },
    { label: "Length",             value: raw.length != null ? `${raw.length}ft` : null },
    { label: "ATM",                value: raw.atm != null ? `${raw.atm} kg` : null },
    { label: "Tare Mass",          value: raw.tare_mass != null ? `${raw.tare_mass} kg` : null },
    { label: "Ball Weight",        value: raw.ball_weight != null ? `${raw.ball_weight} kg` : null },
    { label: "Sleeps",             value: raw.sleep != null ? String(raw.sleep) : null },
    { label: "Axle Configuration", value: raw.axle_configuration },
    { label: "Suspension",         value: raw.suspension },
    { label: "Tyre Size",          value: raw.tyre_size },
    { label: "Brakes",             value: raw.brakes },
    { label: "Fridge",             value: raw.fridge },
    { label: "GPS",                value: raw.gps },
    { label: "Toilet",             value: raw.toilet },
    { label: "Shower",             value: raw.shower },
    { label: "Location",           value: raw.state ? toTitleCase(raw.state) : null },
  ].filter((s) => s.value != null && s.value !== "");

  const cats = Array.isArray(raw.category)
    ? raw.category.map((c: any) => {
        const name = typeof c === "string" ? c : (c?.name ?? c?.label ?? c?.value ?? "");
        return { name, label: name, value: name, slug: typeof c === "object" ? c?.slug : undefined };
      })
    : [];

  return {
    data: {
      product_details: {
        id: raw.source_id || String(raw.id),
        slug: raw.slug,
        name: raw.title,
        title: raw.title,
        sku: raw.sku,
        description: raw.description,
        image_url: Array.isArray(raw.images_full) ? raw.images_full : [],
        image: Array.isArray(raw.images_full) ? raw.images_full : [],
        regular_price: raw.regular_price,
        sale_price: raw.sale_price,
        seller_type: raw.seller_type,
        region: raw.region ? toRegion(raw.region) : undefined,
        suburb: raw.suburb ? toRegion(raw.suburb) : undefined,
        location: raw.location,
        categories: cats,
        attribute_urls: specs,
      },
    },
    seo: {
      metatitle: raw.seo_title || "",
      metadescription: raw.seo_description || "",
    },
  };
}

// React cache() dedupes identical slug calls within a single request, so the
// root layout's JSON-LD lookup and the page's own render share one network call.
export const fetchProductDetail = cache(async (slug: string) => {
  const MPN_BASE = process.env.MPN_API_BASE;
  const CFS_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
  const API_KEY  = process.env.CFS_API_KEY;

  // 1. Try new MPN API first
  if (MPN_BASE) {
    try {
      const res = await fetch(
        `${MPN_BASE}/${encodeURIComponent(slug)}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            ...(API_KEY && { "X-Secret-Key": API_KEY }),
          },
        }
      );
      if (res.ok) {
        const raw = await res.json();
        if (raw?.slug) return normalizeMpnProduct(raw);
      }
    } catch {
      // fall through to CFS fallback
    }
  }

  // 2. Fallback to old CFS API
  try {
    const res = await fetch(
      `${CFS_BASE}/product-detail-new/?slug=${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(API_KEY && { "X-Secret-Key": API_KEY }),
        },
      }
    );
    if (!res.ok) return null;
    const raw = await res.text();
    const idx = raw.indexOf('{"');
    const parsed = JSON.parse(idx >= 0 ? raw.substring(idx) : raw);
    if (parsed?.slug) return normalizeMpnProduct(parsed);
    return parsed;
  } catch {
    return null;
  }
});
