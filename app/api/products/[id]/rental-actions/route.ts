import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/session';
import { rentalPrice } from '@/lib/product-details';
import {remainingForDates} from '@/lib/booking-availability';
import {awardReturnPoint} from '@/lib/customer-rewards';
import {validateMember} from '@/lib/member-link';
export const dynamic='force-dynamic';
const staffRoles=['เจ้าของ','ผู้ดูแลระบบ','พนักงานขาย'];
async function staff(){const user=await currentUser();return user&&staffRoles.includes(user.role)?user:null;}
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  if(!await staff())return NextResponse.json({error:'เฉพาะพนักงานที่ล็อกอิน'},{status:403});
  const {id}=await params;
  const product=await prisma.product.findUnique({where:{id}});
  if(!product)return NextResponse.json({error:'ไม่พบสินค้า'},{status:404});
  const rentals=await prisma.rental.findMany({where:{code:id,stockApplied:true,stockReturned:false,status:{not:'คืนแล้ว'}},select:{id:true,cust:true,start:true,end:true,status:true},orderBy:{createdAt:'desc'}});
  const bookings=await prisma.rental.findMany({where:{code:id,online:true,stockApplied:false,stockReturned:false,paymentStatus:'ชำระแล้ว',status:{notIn:['คืนแล้ว','ยกเลิก']}},select:{id:true,cust:true,start:true,end:true,status:true},orderBy:{start:'asc'}});
  return NextResponse.json({stockRent:product.stockRent,stockSell:product.stockSell,status:product.status,rentals,bookings});
}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await staff();if(!user)return NextResponse.json({error:'เฉพาะพนักงานที่ล็อกอิน'},{status:403});
  const {id}=await params;
  try{
    const body=await req.json();
    if(body.action==='rent'){
      const days=Number(body.days),cust=String(body.cust||'').trim(),start=String(body.start||'');
      const date=new Date(start+'T00:00:00Z');
      if(!Number.isInteger(days)||days<1||days>365||!cust||cust.length>200||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==start)return NextResponse.json({error:'กรอกชื่อลูกค้า วันที่รับ และจำนวนวัน 1–365'},{status:400});
      const end=new Date(date.getTime()+days*86400000).toISOString().slice(0,10);
      const rental=await prisma.$transaction(async tx=>{
        const userId=await validateMember(tx,body.userId,{name:cust,phone:body.phone});
        await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${id} FOR UPDATE`;
        const product=await tx.product.findUnique({where:{id}});
        if(!product||!['เช่า','ทั้งคู่'].includes(product.type)||['ซัก','ซ่อม','ปลดสต็อก'].includes(product.status))throw new Error('ชุดนี้ยังไม่พร้อมเช่า');
        const reservations=await tx.rental.findMany({where:{code:id,stockReturned:false,status:{notIn:['คืนแล้ว','ยกเลิก']}}});
        if(remainingForDates(product,reservations,start,end)<1)throw new Error('ชุดมีการจองทับช่วงวันที่เลือก');
        const claimed=await tx.product.updateMany({where:{id,stockRent:{gt:0}},data:{stockRent:{decrement:1}}});
        if(!claimed.count)throw new Error('สต๊อกเช่าหมดแล้ว กรุณาตรวจใหม่');
        const fee=rentalPrice(product,days),paid=body.paymentStatus==='ชำระแล้ว';
        return tx.rental.create({data:{id:'R-'+randomUUID(),userId,code:id,item:product.name,cust,phone:String(body.phone||'').slice(0,40),start,end,fee,paidAmount:paid?fee:0,paymentStatus:paid?'ชำระแล้ว':'รอชำระ',loyaltyGroup:String(body.loyaltyGroup||'').slice(0,100),deposit:product.rent,status:'รับชุดแล้ว',inspector:user.name,stockApplied:true,stockReturned:false}});
      },{timeout:15000});
      return NextResponse.json({ok:true,rental},{status:201});
    }
    if(body.action==='return'){
      const rentalId=String(body.rentalId||'');
      await prisma.$transaction(async tx=>{
        const returned=await tx.rental.updateMany({where:{id:rentalId,code:id,stockApplied:true,stockReturned:false,status:{not:'คืนแล้ว'}},data:{status:'คืนแล้ว',stockReturned:true,inspector:user.name,condition:String(body.condition||'').slice(0,1000)}});
        if(!returned.count)throw new Error('รายการนี้คืนแล้ว หรือไม่ตรงกับชุดที่สแกน');
        await tx.product.update({where:{id},data:{stockRent:{increment:1}}});
        await awardReturnPoint(tx,await tx.rental.findUniqueOrThrow({where:{id:rentalId}}));
      },{timeout:15000});
      return NextResponse.json({ok:true});
    }
    return NextResponse.json({error:'เลือกรายการเช่าหรือคืน'},{status:400});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'บันทึกไม่สำเร็จ'},{status:409});}
}
