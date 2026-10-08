import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
import {staffRoles} from '@/lib/shop';
export async function POST(req:Request){
  const user=await currentUser();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  try{
    const {rentalId}=await req.json();
    const result=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "Rental" WHERE id=${String(rentalId)} FOR UPDATE`;
      const r=await tx.rental.findUniqueOrThrow({where:{id:String(rentalId)}});
      if(!r.userId||(!staffRoles.includes(user.role)&&r.userId!==user.id))throw new Error('ไม่มีสิทธิ์ใช้แต้มของสมาชิกนี้');
      if(r.rewardUsed||r.promotion||r.stockApplied&&(r.online||r.status!=='จองแล้ว')||r.stockReturned||r.paymentStatus==='ชำระแล้ว'||['คืนแล้ว','ยกเลิก'].includes(r.status))throw new Error('ใช้สิทธิ์ก่อนชำระและรับชุดเท่านั้น และไม่สามารถใช้ร่วมโปรโมชั่นอื่น');
      if(r.fee<=0||r.fee>350)throw new Error('สิทธิ์เช่าฟรีใช้กับค่าเช่าไม่เกิน 350 บาท');
      const member=await tx.$queryRaw<{id:string}[]>`SELECT id FROM "User" WHERE id=${r.userId} FOR UPDATE`;
      if(!member.length)throw new Error('ไม่พบบัญชีสมาชิก');
      if(r.loyaltyGroup&&await tx.rental.count({where:{userId:r.userId,loyaltyGroup:r.loyaltyGroup,promotion:{notIn:['','loyalty']},status:{not:'ยกเลิก'}}}))throw new Error('รายการเช่านี้มีโปรโมชั่นอื่น ใช้สิทธิ์เช่าฟรีร่วมกันไม่ได้');
      const balance=await tx.loyaltyEntry.aggregate({where:{userId:r.userId},_sum:{points:true}});
      if((balance._sum.points||0)<10)throw new Error('แต้มยังไม่ครบ 10 แต้ม');
      await tx.loyaltyEntry.create({data:{userId:r.userId,rentalId:'redeem:'+r.id,rewardKey:'redeem:'+r.id,points:-10}});
      return tx.rental.update({where:{id:r.id},data:{fee:0,rewardValue:r.fee,rewardUsed:true,promotion:'loyalty'}});
    },{timeout:15000});return NextResponse.json(result);
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'ใช้สิทธิ์ไม่สำเร็จ'},{status:409});}
}
