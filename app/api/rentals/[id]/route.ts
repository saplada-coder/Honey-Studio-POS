import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {awardReturnPoint} from '@/lib/customer-rewards';
export const dynamic='force-dynamic';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {stockApplied:_a,stockReturned:_b,id:_id,...clean}=await req.json();
  try{
    const updated=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "Rental" WHERE id = ${id} FOR UPDATE`;
      const cur=await tx.rental.findUniqueOrThrow({where:{id}});
      if(cur.stockApplied&&clean.code!==undefined&&clean.code!==cur.code)throw new Error('เปลี่ยนรหัสชุดไม่ได้หลังตัดสต๊อก กรุณาคืนรายการเดิมก่อน');
      if(cur.stockReturned&&clean.status&&clean.status!=='คืนแล้ว')throw new Error('รายการคืนแล้ว กรุณาสร้างการเช่าใหม่');
      if(cur.online&&['รับชุดแล้ว','กำลังเช่า'].includes(clean.status)&&!cur.stockApplied){
        if(cur.paymentStatus!=='ชำระแล้ว')throw new Error('ตรวจและยืนยันชำระเงินก่อนส่งชุด');
        if(cur.status==='ยกเลิก')throw new Error('รายการยกเลิกแล้ว');
        const claimed=await tx.product.updateMany({where:{id:cur.code,stockRent:{gt:0},status:{notIn:['ซัก','ซ่อม','ปลดสต็อก']}},data:{stockRent:{decrement:1}}});
        if(!claimed.count)throw new Error('ยังไม่มีชุดพร้อมส่งให้ลูกค้า');
        await tx.rental.update({where:{id},data:{stockApplied:true}});
      }
      if(cur.online&&!cur.stockApplied&&clean.status==='คืนแล้ว')throw new Error('ยังไม่ได้ส่งชุดให้ลูกค้า');
      await tx.rental.update({where:{id},data:clean});
      if(clean.status==='คืนแล้ว'&&cur.stockApplied){
        const claimed=await tx.rental.updateMany({where:{id,stockApplied:true,stockReturned:false},data:{stockReturned:true}});
        if(claimed.count&&cur.code)await tx.product.update({where:{id:cur.code},data:{stockRent:{increment:1}}});
        if(claimed.count)await awardReturnPoint(tx,await tx.rental.findUniqueOrThrow({where:{id}}));
      }
      return tx.rental.findUniqueOrThrow({where:{id}});
    },{timeout:15000});
    return NextResponse.json(updated);
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'แก้ไขไม่สำเร็จ'},{status:409});}
}
export async function DELETE(_req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  try{
    await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "Rental" WHERE id = ${id} FOR UPDATE`;
      const cur=await tx.rental.findUniqueOrThrow({where:{id}});
      const claimed=await tx.rental.updateMany({where:{id,stockApplied:true,stockReturned:false},data:{stockReturned:true}});
      if(claimed.count&&cur.code)await tx.product.update({where:{id:cur.code},data:{stockRent:{increment:1}}});
      await tx.rental.delete({where:{id}});
    },{timeout:15000});
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'ไม่พบรายการ หรือรายการกำลังถูกแก้ไข'},{status:409});}
}
