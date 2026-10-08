import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
import {thaiToday} from '@/lib/booking-availability';
export const dynamic='force-dynamic';
export async function GET(){
  const user=await currentUser();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  const today=thaiToday(),tomorrow=new Date(Date.parse(today)+86400000).toISOString().slice(0,10);
  const [rentals,history,read]=await Promise.all([
    prisma.rental.findMany({where:{userId:user.id},orderBy:{createdAt:'desc'},take:100}),
    prisma.loyaltyEntry.findMany({where:{userId:user.id},orderBy:{createdAt:'desc'}}),
    prisma.notificationRead.findMany({where:{userId:user.id}}),
  ]);
  const notifications=rentals.flatMap(r=>{
    const href=r.online?'/shop?view=bookings&booking='+encodeURIComponent(r.id):'/member';
    const result=[{id:r.id+':status:'+r.status+':'+r.paymentStatus,title:r.stockReturned?'คืนชุดเรียบร้อย':r.status==='ยกเลิก'?'ยกเลิกการจองแล้ว':'สถานะการจอง: '+r.status,body:r.item+' • '+(r.online?r.paymentStatus:'เช่าหน้าร้าน'),href}];
    if(!r.stockReturned&&r.status!=='ยกเลิก'){
      if(!r.stockApplied&&(r.start===today||r.start===tomorrow))result.unshift({id:r.id+':pickup:'+today,title:r.start===today?'วันนี้ถึงคิวรับชุด':'พรุ่งนี้ถึงคิวรับชุด',body:r.item+' • วันรับ '+r.start,href});
      if(r.stockApplied&&r.end<=tomorrow)result.unshift({id:r.id+':return:'+today,title:r.end<today?'เลยกำหนดคืนชุด':r.end===today?'วันนี้ครบกำหนดคืนชุด':'พรุ่งนี้ครบกำหนดคืนชุด',body:r.item+' • วันคืน '+r.end,href});
    }
    return result;
  });
  const readIds=new Set(read.map(r=>r.key));
  return NextResponse.json({memberId:user.id,name:user.name,rentals:rentals.map(r=>({id:r.id,item:r.item,start:r.start,end:r.end,status:r.status,online:r.online})),balance:history.reduce((sum,e)=>sum+e.points,0),history,notifications:notifications.map(n=>({...n,read:readIds.has(n.id)}))},{headers:{'Cache-Control':'no-store'}});
}
export async function PATCH(req:Request){
  const user=await currentUser();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  try{
    const {ids}=await req.json();
    if(!Array.isArray(ids)||ids.length>300||ids.some(id=>typeof id!=='string'||id.length>250))return NextResponse.json({error:'ข้อมูลไม่ถูกต้อง'},{status:400});
    await prisma.notificationRead.createMany({data:ids.map(key=>({userId:user.id,key})),skipDuplicates:true});
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'บันทึกไม่สำเร็จ'},{status:400});}
}
