import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {remainingForDates,bookingDays,thaiToday} from '@/lib/booking-availability';
export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params,query=new URL(req.url).searchParams;
  const product=await prisma.product.findUnique({where:{id}});if(!product||!['เช่า','ทั้งคู่'].includes(product.type))return NextResponse.json({error:'ไม่พบชุดเช่า'},{status:404});
  const rentals=await prisma.rental.findMany({where:{code:id,status:{notIn:['คืนแล้ว','ยกเลิก']},stockReturned:false},select:{start:true,end:true,stockApplied:true,stockReturned:true,status:true}});
  const start=query.get('start'),end=query.get('end');
  if(start&&end){try{bookingDays(start,end);return NextResponse.json({remaining:remainingForDates(product,rentals,start,end)});}catch{return NextResponse.json({error:'วันที่ไม่ถูกต้อง'},{status:400});}}
  const month=query.get('month')||thaiToday().slice(0,7);
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return NextResponse.json({error:'เดือนไม่ถูกต้อง'},{status:400});
  const [year,m]=month.split('-').map(Number);if(year<2026||year>2100)return NextResponse.json({error:'ปีไม่ถูกต้อง'},{status:400});
  const count=new Date(Date.UTC(year,m,0)).getUTCDate();
  return NextResponse.json({month,days:Array.from({length:count},(_,i)=>{const start=`${month}-${String(i+1).padStart(2,'0')}`,end=new Date(Date.parse(start)+86400000).toISOString().slice(0,10);return {date:start,remaining:remainingForDates(product,rentals,start,end)};})});
}
