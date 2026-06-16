import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// คืนสต็อกเช่าให้สินค้า 1 ชิ้น (ใช้ตอนคืนชุด/ลบการเช่า)
async function returnStock(code: string) {
  const c = String(code || "").trim();
  if (!c) return;
  const prod = await prisma.product.findUnique({ where: { id: c } });
  if (prod) await prisma.product.update({ where: { id: c }, data: { stockRent: (prod.stockRent ?? 0) + 1 } });
}

// แก้สถานะการเช่า (เลื่อนสถานะถัดไป) — ถ้าเปลี่ยนเป็น "คืนแล้ว" จะคืนสต็อกให้อัตโนมัติ
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const cur = await prisma.rental.findUnique({ where: { id } });

  // ไม่ให้ฟอร์มแก้ flag เอง
  const { stockApplied: _a, stockReturned: _b, ...clean } = body;
  const updated = await prisma.rental.update({ where: { id }, data: clean });

  // คืนสต็อกครั้งเดียว เมื่อสถานะกลายเป็น "คืนแล้ว" และเคยตัดสต็อกไว้
  if (cur && body.status === "คืนแล้ว" && cur.stockApplied && !cur.stockReturned) {
    await returnStock(updated.code || cur.code);
    await prisma.rental.update({ where: { id }, data: { stockReturned: true } });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cur = await prisma.rental.findUnique({ where: { id } });
  // ถ้าลบการเช่าที่ยังตัดสต็อกค้างอยู่ (ยังไม่คืน) ให้คืนสต็อกกลับเข้าคลัง
  if (cur && cur.stockApplied && !cur.stockReturned) await returnStock(cur.code);
  await prisma.rental.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
