import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
import {staffRoles} from '@/lib/shop';
import {bookingDays,remainingForDates,thaiToday} from '@/lib/booking-availability';
import {rentalPrice} from '@/lib/product-details';
export const dynamic='force-dynamic';
export async function GET(){
  const user=await currentUser();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  const bookings=await prisma.rental.findMany({where:{online:true,...(staffRoles.includes(user.role)?{}:{userId:user.id})},orderBy:{createdAt:'desc'},select:{id:true,code:true,cust:true,phone:true,item:true,start:true,end:true,fee:true,deposit:true,status:true,paymentStatus:true,paymentSlip:true,stockApplied:true,stockReturned:true,createdAt:true}});
  return NextResponse.json(bookings);
}
export async function POST(req:Request){
  const user=await currentUser();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบก่อนจอง'},{status:401});
  try{
    const body=await req.json();const code=String(body.code||''),start=String(body.start||''),end=String(body.end||''),cust=String(body.cust||'').trim(),phone=String(body.phone||'').trim();
    const days=bookingDays(start,end);
    if(start<thaiToday()||!cust||cust.length>200||phone.replace(/\D/g,'').length<9||phone.length>40)return NextResponse.json({error:'กรอกชื่อ เบอร์โทร และเลือกวันรับตั้งแต่วันนี้'},{status:400});
    const booking=await prisma.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "Product" WHERE id=${code} FOR UPDATE`;
      const product=await tx.product.findUnique({where:{id:code}});
      if(!product||!['เช่า','ทั้งคู่'].includes(product.type)||product.rent<=0)throw new Error('ชุดนี้ยังไม่เปิดจองออนไลน์ กรุณาติดต่อร้าน');
      const rentals=await tx.rental.findMany({where:{code,status:{notIn:['คืนแล้ว','ยกเลิก']},stockReturned:false}});
      if(remainingForDates(product,rentals,start,end)<1)throw new Error('ชุดไม่ว่างในวันที่เลือก กรุณาเปลี่ยนวัน');
      if(rentals.some(r=>r.userId===user.id&&r.online&&r.start===start&&r.end===end))throw new Error('คุณมีการจองชุดนี้ในวันที่เลือกแล้ว');
      return tx.rental.create({data:{id:'BK-'+randomUUID(),userId:user.id,online:true,code,item:product.name,cust,phone,start,end,fee:rentalPrice(product,days),deposit:product.rent,status:'รอชำระ',paymentStatus:'รอชำระ',stockApplied:false,stockReturned:false}});
    },{timeout:15000});
    return NextResponse.json(booking,{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'จองไม่สำเร็จ'},{status:409});}
}
