import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
import {staffRoles} from '@/lib/shop';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await currentUser();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  const {id}=await params;const body=await req.json(),staff=staffRoles.includes(user.role);
  try{
    const result=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "Rental" WHERE id=${id} FOR UPDATE`;
      const booking=await tx.rental.findUnique({where:{id}});
      if(!booking||!booking.online||(!staff&&booking.userId!==user.id))throw new Error('ไม่พบการจองนี้');
      if(body.action==='paid'&&staff){
        if(!booking.paymentSlip||['ยกเลิก','คืนแล้ว'].includes(booking.status))throw new Error('ไม่มีหลักฐานชำระ หรือการจองจบแล้ว');
        return tx.rental.update({where:{id},data:{paymentStatus:'ชำระแล้ว',...(!booking.stockApplied?{status:'จองแล้ว'}:{})}});
      }
      if(body.action==='cancel'){
        if(booking.stockApplied||booking.stockReturned||['ยกเลิก','คืนแล้ว'].includes(booking.status))throw new Error('ยกเลิกไม่ได้ กรุณาติดต่อร้าน');
        if(!staff&&booking.paymentStatus==='ชำระแล้ว')throw new Error('รายการชำระแล้ว กรุณาติดต่อร้านเพื่อยกเลิก');
        return tx.rental.update({where:{id},data:{status:'ยกเลิก'}});
      }
      throw new Error('ไม่มีสิทธิ์ทำรายการนี้');
    },{timeout:15000});return NextResponse.json(result);
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'บันทึกไม่สำเร็จ'},{status:409});}
}
