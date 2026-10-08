import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
import {staffRoles} from '@/lib/shop';
export const dynamic='force-dynamic';
export async function GET(req:Request){
  if(new URL(req.url).searchParams.get('manage')==='1'){
    const user=await currentUser();if(!user||!staffRoles.includes(user.role))return NextResponse.json({error:'ไม่มีสิทธิ์'},{status:403});
    return NextResponse.json(await prisma.customerReview.findMany({orderBy:{createdAt:'desc'}}));
  }
  return NextResponse.json(await prisma.customerReview.findMany({where:{approved:true,consent:true},select:{id:true,name:true,text:true,image:true},orderBy:{createdAt:'desc'},take:30}));
}
export async function POST(req:Request){
  const user=await currentUser();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  const body=await req.json(),text=String(body.text||'').trim(),image=String(body.image||'');
  if(body.consent!==true||!text||text.length>2000)return NextResponse.json({error:'กรอกรีวิวและอนุญาตให้เผยแพร่ก่อนส่ง'},{status:400});
  const rental=await prisma.rental.findFirst({where:{id:String(body.rentalId||''),userId:user.id,online:true,status:'คืนแล้ว'}});if(!rental)return NextResponse.json({error:'รีวิวได้หลังคืนชุดจากการจองของคุณแล้ว'},{status:403});
  if(image&&!image.startsWith('https://'))return NextResponse.json({error:'รูปไม่ถูกต้อง'},{status:400});
  try{return NextResponse.json(await prisma.customerReview.create({data:{userId:user.id,rentalId:rental.id,name:user.name,text,image,consent:true,approved:false}}),{status:201});}catch{return NextResponse.json({error:'ส่งรีวิวสำหรับการจองนี้แล้ว'},{status:409});}
}
export async function PATCH(req:Request){
  const user=await currentUser();if(!user||!staffRoles.includes(user.role))return NextResponse.json({error:'ไม่มีสิทธิ์'},{status:403});
  const body=await req.json();const result=await prisma.customerReview.updateMany({where:{id:String(body.id||''),consent:true},data:{approved:body.approved===true}});return NextResponse.json({ok:!!result.count});
}
