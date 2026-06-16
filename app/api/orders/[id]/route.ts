import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.order.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

// ลบคำสั่งซื้อ — ถ้าเคยตัดสต็อกขายไว้ (ยกเลิกการขาย) ให้คืนสต็อกขายกลับ 1 ชิ้น
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cur = await prisma.order.findUnique({ where: { id } });
  if (cur && cur.stockApplied && cur.code) {
    const prod = await prisma.product.findUnique({ where: { id: cur.code } });
    if (prod) await prisma.product.update({ where: { id: cur.code }, data: { stockSell: (prod.stockSell ?? 0) + 1 } });
  }
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
