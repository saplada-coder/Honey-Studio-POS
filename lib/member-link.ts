import type {Prisma} from '@/app/generated/prisma/client';
import {memberName,memberPhone} from './member-identity';
export async function validateMember(tx:Prisma.TransactionClient,value:unknown,identity?:{name:unknown;phone:unknown}){
  const id=String(value||'').trim();
  if(!id){
    const phone=memberPhone(identity?.phone);if(!phone)return '';
    const member=await tx.user.findUnique({where:{phone},select:{id:true,name:true,role:true}});
    if(!member)return '';
    if(member.role!=='ลูกค้า'||memberName(member.name)!==memberName(identity?.name))throw new Error('ชื่อและเบอร์ไม่ตรงกับสมาชิก กรุณาตรวจข้อมูลกับลูกค้า');
    return member.id;
  }
  if(id.length>200)throw new Error('รหัสสมาชิกไม่ถูกต้อง');
  const member=await tx.user.findUnique({where:{id},select:{role:true}});
  if(!member||member.role!=='ลูกค้า')throw new Error('ไม่พบสมาชิก กรุณาใช้รหัสจากแอพลูกค้า');
  return id;
}
