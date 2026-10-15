import type {Prisma} from '@/app/generated/prisma/client';
import {randomUUID} from 'node:crypto';
import {memberName,memberPhone} from './member-identity';
export async function linkMemberRentals(tx:Pick<Prisma.TransactionClient,'rental'>,member:{id:string;name:unknown;phone:unknown}){
  const name=memberName(member.name),phone=memberPhone(member.phone);
  if(!phone||!name)return;
  await tx.rental.updateMany({where:{userId:'',online:false,cust:name,phone},data:{userId:member.id}});
}
export async function ensureMember(tx:Prisma.TransactionClient,identity:{name:unknown;phone:unknown}){
  const name=memberName(identity.name),phone=memberPhone(identity.phone);
  if(!phone)return '';
  if(name.length<2||name.length>200)throw new Error('กรุณาระบุชื่อลูกค้าให้ครบถ้วน');
  const member=await tx.user.upsert({where:{phone},update:{},create:{phone,name,email:'member-'+randomUUID()+'@member.invalid',role:'ลูกค้า',icon:'Users',color:'#A8978E'}});
  if(member.role!=='ลูกค้า'||memberName(member.name)!==name)throw new Error('ชื่อและเบอร์ไม่ตรงกับสมาชิก กรุณาตรวจข้อมูลกับลูกค้า');
  await linkMemberRentals(tx,{id:member.id,name,phone});
  return member.id;
}
export async function validateMember(tx:Prisma.TransactionClient,value:unknown,identity?:{name:unknown;phone:unknown}){
  const id=String(value||'').trim();
  if(!id){
    const phone=memberPhone(identity?.phone);if(!phone)return '';
    return ensureMember(tx,{name:identity?.name,phone});
  }
  if(id.length>200)throw new Error('รหัสสมาชิกไม่ถูกต้อง');
  const member=await tx.user.findUnique({where:{id},select:{role:true}});
  if(!member||member.role!=='ลูกค้า')throw new Error('ไม่พบสมาชิก กรุณาใช้รหัสจากแอพลูกค้า');
  return id;
}
