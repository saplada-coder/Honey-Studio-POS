import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

// อัปโหลดรูปขึ้น Vercel Blob แล้วคืน URL
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "ยังไม่ได้เชื่อม Vercel Blob (ไม่มี token)" }, { status: 503 });
  }
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`products/${Date.now()}-${safe}`, file, { access: "public" });
  return NextResponse.json({ url: blob.url });
}
