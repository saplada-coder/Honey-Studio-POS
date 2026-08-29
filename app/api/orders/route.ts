import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, isOwnRecord } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await prisma.order.findMany({ orderBy: { id: "desc" } });
  // role "ลูกค้า" ต้องเห็นเฉพาะออเดอร์ของตัวเอง — กรองที่เซิร์ฟเวอร์
  // (เดิมกรองที่หน้าเว็บอย่างเดียว ลูกค้าเปิด DevTools ยิง API ตรงจะเห็นของทุกคน)
  const me = await currentUser();
  if (me?.role === "ลูกค้า") {
    return NextResponse.json(orders.filter((o) => isOwnRecord(o.cust, me.name)));
  }
  return NextResponse.json(orders);
}

// สร้างคำสั่งซื้อ — ถ้าเป็นการ "ขาย" และเลือกสินค้า (มี code) จะตัดสต็อกขายให้อัตโนมัติ 1 ชิ้น
export async function POST(req: Request) {
  const body = await req.json();
  const code = String(body.code || "").trim();

  let applied = false;
  if (body.type === "ขาย" && code) {
    const prod = await prisma.product.findUnique({ where: { id: code } });
    if (prod && (prod.stockSell ?? 0) > 0) {
      await prisma.product.update({ where: { id: code }, data: { stockSell: prod.stockSell - 1 } });
      applied = true;
    }
  }

  const { stockApplied: _a, ...clean } = body;
  const created = await prisma.order.create({ data: { ...clean, stockApplied: applied } });
  return NextResponse.json(created, { status: 201 });
}
