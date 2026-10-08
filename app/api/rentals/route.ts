import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, isOwnRecord } from "@/lib/session";
import {isDate,remainingForDates} from '@/lib/booking-availability';
import {validateMember} from '@/lib/member-link';

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
  const code = String(body.code || "").trim();

  // ไม่ให้ฟอร์มส่ง flag มาเองได้ — ระบบเป็นคนกำหนด
  const { stockApplied: _a, stockReturned: _b, rewardUsed:_r,rewardValue:_v,paidAmount:_p,...clean } = body;
  try{
    const created=await prisma.$transaction(async tx=>{
      const userId=await validateMember(tx,body.userId,{name:body.cust,phone:body.phone});
      if(userId&&(!isDate(String(body.start||''))||!isDate(String(body.end||''))||body.end<=body.start))throw new Error('รายการสมาชิกต้องระบุวันรับและวันคืนเป็นวันที่จริง โดยวันคืนหลังวันรับ');
      if(code){
        await tx.$queryRaw`SELECT id FROM "Product" WHERE id=${code} FOR UPDATE`;
        if(isDate(String(body.start||''))&&isDate(String(body.end||''))){
          const product=await tx.product.findUnique({where:{id:code}});
          const reservations=await tx.rental.findMany({where:{code,stockReturned:false,status:{notIn:['คืนแล้ว','ยกเลิก']}}});
          if(!product||remainingForDates(product,reservations,body.start,body.end)<1)throw new Error('ชุดมีการจองทับช่วงวันที่เลือก');
        }
        const claimed=await tx.product.updateMany({where:{id:code,type:{in:['เช่า','ทั้งคู่']},stockRent:{gt:0},status:{notIn:['ซัก','ซ่อม','ปลดสต็อก']}},data:{stockRent:{decrement:1}}});
        if(!claimed.count)throw new Error('ชุดนี้ไม่มีสต๊อกพร้อมเช่า');
      }
      const paidAmount=body.paymentStatus==='ชำระแล้ว'?Number(body.fee||0)+Number(body.fine||0)+Number(body.damage||0):0;
      if(clean.promotion==='loyalty')throw new Error('ใช้สิทธิ์ฟรีผ่านปุ่มแลก10แต้มเท่านั้น');
      if(clean.loyaltyGroup&&clean.promotion&&await tx.rental.count({where:{userId,loyaltyGroup:clean.loyaltyGroup,rewardUsed:true,status:{not:'ยกเลิก'}}}))throw new Error('รายการเช่านี้ใช้สิทธิ์ฟรีแล้ว ใช้โปรโมชั่นอื่นร่วมกันไม่ได้');
      return tx.rental.create({data:{...clean,userId,paidAmount,online:false,code,stockApplied:!!code,stockReturned:false}});
    },{timeout:15000});
    return NextResponse.json(created,{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'บันทึกไม่สำเร็จ'},{status:409});}
}
