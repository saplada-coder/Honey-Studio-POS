import type {Prisma} from '@/app/generated/prisma/client';
import {createStaffRental} from './staff-rental';
import {randomUUID} from 'node:crypto';
import {isDate} from './booking-availability';
import {memberPhone} from './member-identity';

export async function addCustomerRental(tx:Prisma.TransactionClient,customer:{name:string;phone:string},rental:unknown){
  if(!rental)return;
  if(typeof rental!=='object'||Array.isArray(rental))throw new Error('ข้อมูลชุดที่เลือกไม่ถูกต้อง');
  const r=rental as Record<string,unknown>;
  if(!memberPhone(customer.phone))throw new Error('กรอกเบอร์โทรเพื่อเชื่อมรายการเช่ากับลูกค้า');
  if(!isDate(String(r.start||''))||!isDate(String(r.end||''))||String(r.end)<=String(r.start))throw new Error('เลือกวันรับและวันคืน โดยวันคืนต้องอยู่หลังวันรับ');
  if(!['รอชำระ','ชำระแล้ว'].includes(String(r.paymentStatus)))throw new Error('เลือกสถานะชำระเงิน');
  for(const key of ['fee','deposit'])if(!Number.isSafeInteger(r[key])||Number(r[key])<0)throw new Error('ค่าเช่าและเงินประกันต้องเป็นจำนวนเต็มตั้งแต่ 0 บาท');
  const code=String(r.code||'').trim(),product=await tx.product.findUnique({where:{id:code}});
  if(!product||!['เช่า','ทั้งคู่'].includes(product.type))throw new Error('กรุณาเลือกชุดเช่าจากคลัง');
  await createStaffRental(tx,{id:'R-'+randomUUID(),cust:customer.name,phone:customer.phone,code,item:product.name,start:r.start,end:r.end,fee:r.fee,deposit:r.deposit,paymentStatus:r.paymentStatus,status:'จองแล้ว'});
}
