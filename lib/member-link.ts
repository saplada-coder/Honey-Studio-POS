import type {Prisma} from '@/app/generated/prisma/client';
export async function validateMember(tx:Prisma.TransactionClient,value:unknown){
  const id=String(value||'').trim();if(!id)return '';
  if(id.length>200)throw new Error('รหัสสมาชิกไม่ถูกต้อง');
  const member=await tx.user.findUnique({where:{id},select:{role:true}});
  if(!member||member.role!=='ลูกค้า')throw new Error('ไม่พบสมาชิก กรุณาใช้รหัสจากแอพลูกค้า');
  return id;
}
