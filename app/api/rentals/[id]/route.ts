import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {awardReturnPoint,refundUnusedReward} from '@/lib/customer-rewards';
import {validateMember} from '@/lib/member-link';
import {isDate} from '@/lib/booking-availability';
export const dynamic='force-dynamic';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const {stockApplied:_a,stockReturned:_b,id:_id,rewardUsed:_r,rewardValue:_v,paidAmount:_p,action,...clean}=await req.json();
  try{
    const updated=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "Rental" WHERE id = ${id} FOR UPDATE`;
      const cur=await tx.rental.findUniqueOrThrow({where:{id}});
      if(clean.deposit!==undefined||clean.code!==undefined&&clean.code!==cur.code){
        const product=await tx.product.findUnique({where:{id:String(clean.code??cur.code)}});
        if(product)clean.deposit=product.rent;
        else clean.deposit=cur.deposit;
      }
      if(clean.promotion==='loyalty'&&!cur.rewardUsed)throw new Error('ใช้สิทธิ์เช่าฟรีผ่านปุ่มใช้10แต้มเท่านั้น');
      if(clean.promotion&&clean.promotion!=='loyalty'&&(clean.loyaltyGroup||cur.loyaltyGroup)&&await tx.rental.count({where:{userId:cur.userId,loyaltyGroup:clean.loyaltyGroup||cur.loyaltyGroup,rewardUsed:true,status:{not:'ยกเลิก'}}}))throw new Error('ใช้โปรโมชั่นอื่นร่วมกับสิทธิ์เช่าฟรีไม่ได้');
      if(cur.rewardUsed&&(clean.fee!==undefined&&clean.fee!==0||clean.promotion!==undefined&&clean.promotion!=='loyalty'))throw new Error('รายการใช้สิทธิ์ฟรีเปลี่ยนค่าเช่าหรือโปรโมชั่นไม่ได้');
      if(clean.loyaltyGroup!==undefined&&clean.loyaltyGroup!==cur.loyaltyGroup&&(cur.stockReturned||cur.rewardUsed))throw new Error('เปลี่ยนรายการสะสมแต้มไม่ได้หลังคืนหรือใช้สิทธิ์');
      if(action==='settle'||clean.paymentStatus==='ชำระแล้ว'&&cur.paymentStatus!=='ชำระแล้ว'){
        clean.paymentStatus='ชำระแล้ว';clean.paidAmount=(clean.fee??cur.fee)+(clean.fine??cur.fine)+(clean.damage??cur.damage);
      }
      if(clean.userId!==undefined&&clean.userId!==cur.userId){
        if(cur.online||cur.stockReturned||cur.rewardUsed)throw new Error('เปลี่ยนสมาชิกไม่ได้สำหรับรายการออนไลน์ คืนแล้ว หรือใช้สิทธิ์ฟรี');
        clean.userId=await validateMember(tx,clean.userId);
        if(clean.userId&&(!isDate(String(clean.start??cur.start))||!isDate(String(clean.end??cur.end))||(clean.end??cur.end)<=(clean.start??cur.start)))throw new Error('กรอกวันรับและวันคืนรูปแบบ YYYY-MM-DD เพื่อแจ้งเตือนสมาชิก');
      }
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
      if(clean.status==='ยกเลิก')await refundUnusedReward(tx,cur);
      if(['คืนแล้ว','ยกเลิก'].includes(clean.status)&&cur.stockApplied){
        const claimed=await tx.rental.updateMany({where:{id,stockApplied:true,stockReturned:false},data:{stockReturned:true}});
        if(claimed.count&&cur.code)await tx.product.update({where:{id:cur.code},data:{stockRent:{increment:1}}});
        if(claimed.count)await awardReturnPoint(tx,await tx.rental.findUniqueOrThrow({where:{id}}));
      }
      if(action==='settle'||clean.paymentStatus==='ชำระแล้ว')await awardReturnPoint(tx,await tx.rental.findUniqueOrThrow({where:{id}}));
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
      await refundUnusedReward(tx,cur);
      const claimed=await tx.rental.updateMany({where:{id,stockApplied:true,stockReturned:false},data:{stockReturned:true}});
      if(claimed.count&&cur.code)await tx.product.update({where:{id:cur.code},data:{stockRent:{increment:1}}});
      await tx.rental.delete({where:{id}});
    },{timeout:15000});
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'ไม่พบรายการ หรือรายการกำลังถูกแก้ไข'},{status:409});}
}
