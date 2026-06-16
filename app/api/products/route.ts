import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// รายการสินค้าทั้งหมด
export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(products);
}

// เพิ่มสินค้าใหม่
export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.product.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
