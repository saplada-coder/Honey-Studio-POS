import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rentals = await prisma.rental.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rentals);
}

// สร้างการเช่าใหม่ — ถ้ามีรหัสชุดตรงกับสินค้า จะตัดสต็อกเช่าให้อัตโนมัติ 1 ชิ้น
export async function POST(req: Request) {
  const body = await req.json();
  const code = String(body.code || "").trim();

  let applied = false;
  if (code) {
    const prod = await prisma.product.findUnique({ where: { id: code } });
    if (prod && (prod.stockRent ?? 0) > 0) {
      await prisma.product.update({ where: { id: code }, data: { stockRent: prod.stockRent - 1 } });
      applied = true; // ตัดสต็อกสำเร็จ → ทำเครื่องหมายไว้ (กันตัด/คืนซ้ำ)
    }
  }

  // ไม่ให้ฟอร์มส่ง flag มาเองได้ — ระบบเป็นคนกำหนด
  const { stockApplied: _a, stockReturned: _b, ...clean } = body;
  const created = await prisma.rental.create({ data: { ...clean, stockApplied: applied, stockReturned: false } });
  return NextResponse.json(created, { status: 201 });
}
