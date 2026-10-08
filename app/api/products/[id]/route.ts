import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRentPrices } from '@/lib/product-details';

export const dynamic = "force-dynamic";

// แก้ไขสินค้า (เช่น ปรับสตอก/สถานะ)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if('rentPrices' in body){try {body.rentPrices=validateRentPrices(body.rentPrices);} catch {return NextResponse.json({error:'ราคาเช่าตามวันไม่ถูกต้อง: ใช้จำนวนวัน 2–365 ไม่ซ้ำ และราคาเป็นจำนวนเต็มตั้งแต่ 0 บาท'},{status:400});}}
  const updated = await prisma.product.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

// ลบสินค้า
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
