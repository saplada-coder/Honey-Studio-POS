import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, isOwnRecord } from "@/lib/session";
import {createStaffRental} from '@/lib/staff-rental';

export const dynamic = "force-dynamic";

export async function GET() {
  const rentals = await prisma.rental.findMany({ orderBy: { id: "asc" } });
  // role "ลูกค้า" ต้องเห็นเฉพาะการเช่าของตัวเอง — กรองที่เซิร์ฟเวอร์ (ดูคำอธิบายใน /api/orders)
  const me = await currentUser();
  if (me?.role === "ลูกค้า") {
    return NextResponse.json(rentals.filter((r) => r.userId?r.userId===me.id:!r.online&&isOwnRecord(r.cust, me.name)));
  }
  return NextResponse.json(rentals);
}

// สร้างการเช่าใหม่ — ถ้ามีรหัสชุดตรงกับสินค้า จะตัดสต็อกเช่าให้อัตโนมัติ 1 ชิ้น
export async function POST(req: Request) {
  const body = await req.json();
  try{
    const {additionalItems=[],...main}=body;
    if(!Array.isArray(additionalItems)||additionalItems.length>30)throw new Error('เพิ่มรายการเช่าได้สูงสุด 30 รายการ');
    if(additionalItems.some(item=>!item||typeof item!=='object'))throw new Error('รายการสินค้าไม่ถูกต้อง');
    if(main.promotion==='bogo'&&additionalItems.filter(item=>item.free===true).length!==1)throw new Error('กรุณาเลือกสินค้าแถม 1 ชิ้นสำหรับโปร 1 แถม 1');
    const created=await prisma.$transaction(async tx=>{
      const group=additionalItems.length?(main.loyaltyGroup||main.id):main.loyaltyGroup;
      const first=await createStaffRental(tx,{...main,loyaltyGroup:group});
      for(const [index,item] of additionalItems.entries()){
        if(!item.code)throw new Error('กรุณาเลือกสินค้าในรายการเช่าเพิ่มเติม');
        const product=await tx.product.findUniqueOrThrow({where:{id:String(item.code)}});
        const free=main.promotion==='bogo'&&item.free===true;
        if(!free&&(!Number.isInteger(Number(item.fee))||Number(item.fee)<0))throw new Error('ค่าเช่าต้องเป็นจำนวนเต็มตั้งแต่ 0 บาท');
        await createStaffRental(tx,{...main,id:`${main.id}-${index+2}`,loyaltyGroup:group,code:product.id,item:free?`${product.name} (สินค้าแถมคู่กับ ${main.code||main.item})`:product.name,fee:free?0:Number(item.fee),deposit:Number(item.deposit),discount:0,fine:0,damage:0,promotion:free?'bogo':''});
      }
      return first;
    },{timeout:15000});
    return NextResponse.json(created,{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'บันทึกไม่สำเร็จ'},{status:409});}
}
