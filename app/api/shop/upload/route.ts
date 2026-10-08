import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {put,del} from '@vercel/blob';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
export async function POST(req:Request){
  const user=await currentUser();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  const form=await req.formData(),file=form.get('file'),id=String(form.get('rentalId')||''),kind=String(form.get('kind')||'slip');
  if(!(file instanceof File)||file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)||!['slip','review'].includes(kind))return NextResponse.json({error:'ใช้รูป JPG, PNG หรือ WebP ไม่เกิน 5 MB'},{status:400});
  const rental=await prisma.rental.findFirst({where:{id,userId:user.id,online:true}});
  if(!rental||rental.status==='ยกเลิก'||(kind==='review'&&rental.status!=='คืนแล้ว')||(kind==='slip'&&(rental.paymentStatus==='ชำระแล้ว'||rental.status==='คืนแล้ว')))return NextResponse.json({error:'อัปโหลดสำหรับรายการนี้ไม่ได้'},{status:403});
  if(!process.env.BLOB_READ_WRITE_TOKEN)return NextResponse.json({error:'ยังไม่เปิดอัปโหลด กรุณาติดต่อร้าน'},{status:503});
  const bytes=new Uint8Array(await file.arrayBuffer());
  const valid=file.type==='image/png'?bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!valid)return NextResponse.json({error:'ไฟล์รูปไม่ถูกต้อง'},{status:400});
  const ext=file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';
  const blob=await put(`customer-content/${randomUUID()}.${ext}`,file,{access:'public'});
  if(kind==='slip'){
    const updated=await prisma.rental.updateMany({where:{id,userId:user.id,online:true,paymentStatus:{not:'ชำระแล้ว'},status:{notIn:['คืนแล้ว','ยกเลิก']}},data:{paymentSlip:blob.url,paymentStatus:'รอตรวจสอบ'}});
    if(!updated.count){await del(blob.url);return NextResponse.json({error:'สถานะการจองเปลี่ยนแล้ว กรุณาโหลดใหม่'},{status:409});}
  }
  return NextResponse.json({url:blob.url});
}
