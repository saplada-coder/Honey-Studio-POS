import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRentPrices } from '@/lib/product-details';
import {normalizeImportedProduct} from '@/lib/product-import';

export const dynamic = "force-dynamic";

// รายการสินค้าทั้งหมด
export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(products);
}

// เพิ่มสินค้าใหม่
export async function POST(req: Request) {
  const body = await req.json();
  try{normalizeImportedProduct(body);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'ข้อมูลสินค้าไม่ถูกต้อง'},{status:400});}
  try {body.rentPrices=validateRentPrices(body.rentPrices);} catch {return NextResponse.json({error:'ราคาเช่าตามวันไม่ถูกต้อง: ใช้จำนวนวัน 2–365 ไม่ซ้ำ และราคาเป็นจำนวนเต็มตั้งแต่ 0 บาท'},{status:400});}
  const created = await prisma.product.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
