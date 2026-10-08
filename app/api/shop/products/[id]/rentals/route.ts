import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await currentUser();
  if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  const staff=['เจ้าของ','ผู้ดูแลระบบ','พนักงานขาย'].includes(user.role);
  if(!staff&&user.role!=='ลูกค้า')return NextResponse.json({error:'ไม่มีสิทธิ์ดูข้อมูล'},{status:403});
  const {id}=await params;
  const rentals=await prisma.rental.findMany({where:{code:id,...(staff?{}:{userId:user.id})},orderBy:{createdAt:'desc'},select:{id:true,cust:true,phone:true,start:true,end:true,status:true,paymentStatus:true,fee:true,discount:true,deposit:true}});
  return NextResponse.json({staff,rentals},{headers:{'Cache-Control':'private, no-store'}});
}
