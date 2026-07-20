// src/app/api/cf7/[id]/route.ts
import { NextResponse } from "next/server";
const API_BASE = process.env.NEXT_PUBLIC_CFS_API_BASE;
const API_KEY = process.env.CFS_API_KEY; // ✅ Add this

export const fetchCaravanList = async () => {
  const res = await fetch(`${API_BASE}/get-caravans-by-type`, {
    cache: "no-store",
  });

  const json = await res.json();
  return json?.categories || [];
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  // ✅ single slash; no trailing double slashes
  const endpoint = `https://admin.caravansforsale.com.au/wp-json/contact-form-7/v1/contact-forms/${id}/feedback`;

  const formData = await req.formData();
  const resp = await fetch(endpoint, {
    method: "POST",
    body: formData,
    headers: {
        Accept: "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }), // ✅ API key added
      }, // ask for JSON explicitly
  });

  // Return whatever CF7 returns; don’t assume JSON blindly
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } else {
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: { "content-type": ct || "text/plain" },
    });
  }
}
