import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, isOwnRecord } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const rentals = await prisma.rental.findMany({ orderBy: { id: "asc" } });
  // role "ลูกค้า" ต้องเห็นเฉพาะการเช่าของตัวเอง — กรองที่เซิร์ฟเวอร์ (ดูคำอธิบายใน /api/orders)
  const me = await currentUser();
  if (me?.role === "ลูกค้า") {
    return NextResponse.json(rentals.filter((r) => isOwnRecord(r.cust, me.name)));
  }
  return NextResponse.json(rentals);
}

// สร้างการเช่าใหม่ — ถ้ามีรหัสชุดตรงกับสินค้า จะตัดสต็อกเช่าให้อัตโนมัติ 1 ชิ้น
export async function POST(req: Request) {
  const body = await req.json();
  const code = String(body.code || "").trim();

  // ไม่ให้ฟอร์มส่ง flag มาเองได้ — ระบบเป็นคนกำหนด
  const { stockApplied: _a, stockReturned: _b, ...clean } = body;
  try{
    const created=await prisma.$transaction(async tx=>{
      if(code){
        const claimed=await tx.product.updateMany({where:{id:code,type:{in:['เช่า','ทั้งคู่']},stockRent:{gt:0},status:{notIn:['ซัก','ซ่อม','ปลดสต็อก']}},data:{stockRent:{decrement:1}}});
        if(!claimed.count)throw new Error('ชุดนี้ไม่มีสต๊อกพร้อมเช่า');
      }
      return tx.rental.create({data:{...clean,code,stockApplied:!!code,stockReturned:false}});
    },{timeout:15000});
    return NextResponse.json(created,{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'บันทึกไม่สำเร็จ'},{status:409});}
}
