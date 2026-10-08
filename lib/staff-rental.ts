import type {Prisma} from '@/app/generated/prisma/client';
import {validateMember} from './member-link';
import {isDate,remainingForDates} from './booking-availability';

export async function createStaffRental(tx:Prisma.TransactionClient,body:Record<string,any>){
  const code=String(body.code||'').trim();
  const {stockApplied:_a,stockReturned:_b,rewardUsed:_r,rewardValue:_v,paidAmount:_p,...clean}=body;
  const userId=await validateMember(tx,body.userId,{name:body.cust,phone:body.phone});
  if(userId&&(!isDate(String(body.start||''))||!isDate(String(body.end||''))||body.end<=body.start))throw new Error('รายการสมาชิกต้องระบุวันรับและวันคืนเป็นวันที่จริง โดยวันคืนหลังวันรับ');
  if(code){
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id=${code} FOR UPDATE`;
    const product=await tx.product.findUnique({where:{id:code}});
    if(product)clean.deposit=product.rent;
    if(isDate(String(body.start||''))&&isDate(String(body.end||''))){
      const reservations=await tx.rental.findMany({where:{code,stockReturned:false,status:{notIn:['คืนแล้ว','ยกเลิก']}}});
      if(!product||remainingForDates(product,reservations,body.start,body.end)<1)throw new Error('ชุดมีการจองทับช่วงวันที่เลือก');
    }
    const claimed=await tx.product.updateMany({where:{id:code,type:{in:['เช่า','ทั้งคู่']},stockRent:{gt:0},status:{notIn:['ซัก','ซ่อม','ปลดสต็อก']}},data:{stockRent:{decrement:1}}});
    if(!claimed.count)throw new Error('ชุดนี้ไม่มีสต๊อกพร้อมเช่า');
  }
  const paidAmount=body.paymentStatus==='ชำระแล้ว'?Number(body.fee||0)+Number(body.fine||0)+Number(body.damage||0):0;
  if(clean.promotion==='loyalty')throw new Error('ใช้สิทธิ์ฟรีผ่านปุ่มแลก10แต้มเท่านั้น');
  if(clean.loyaltyGroup&&clean.promotion&&await tx.rental.count({where:{userId,loyaltyGroup:clean.loyaltyGroup,rewardUsed:true,status:{not:'ยกเลิก'}}}))throw new Error('รายการเช่านี้ใช้สิทธิ์ฟรีแล้ว ใช้โปรโมชั่นอื่นร่วมกันไม่ได้');
  return tx.rental.create({data:{...clean,id:body.id,cust:body.cust,item:body.item,start:body.start,end:body.end,userId,paidAmount,online:false,code,stockApplied:!!code,stockReturned:false}});
}
