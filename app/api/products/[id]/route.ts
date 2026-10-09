import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRentPrices } from '@/lib/product-details';
import {normalizeImportedProduct} from '@/lib/product-import';
import {preserveStockPhotos} from '@/lib/stock-trash';

export const dynamic = "force-dynamic";

// แก้ไขสินค้า (เช่น ปรับสตอก/สถานะ)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const current=await prisma.product.findUnique({where:{id},select:{importedAustralia:true,manufactureDate:true,expiryDate:true}});
  if(!current)return NextResponse.json({error:'ไม่พบสินค้า'},{status:404});
  try{normalizeImportedProduct(body,current.importedAustralia,current);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'ข้อมูลสินค้าไม่ถูกต้อง'},{status:400});}
  if('rentPrices' in body){try {body.rentPrices=validateRentPrices(body.rentPrices);} catch {return NextResponse.json({error:'ราคาเช่าตามวันไม่ถูกต้อง: ใช้จำนวนวัน 2–365 ไม่ซ้ำ และราคาเป็นจำนวนเต็มตั้งแต่ 0 บาท'},{status:400});}}
  const updated = await prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id=${id} FOR UPDATE`;
    const before=await tx.product.findUniqueOrThrow({where:{id}});
    await preserveStockPhotos(tx,before,body);
    return tx.product.update({where:{id},data:body});
  });
  return NextResponse.json(updated);
}

// ลบสินค้า
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id=${id} FOR UPDATE`;
    const product=await tx.product.findUniqueOrThrow({where:{id}});
    await tx.stockTrash.create({data:{kind:'product',productId:id,name:product.name,snapshot:JSON.stringify(product)}});
    await tx.product.delete({where:{id}});
  });
  return NextResponse.json({ ok: true });
}
