import {NextResponse} from 'next/server';
import {createHash,randomUUID} from 'node:crypto';
import {prisma} from '@/lib/prisma';
import {createSession,SESSION_COOKIE} from '@/lib/auth';
import {memberName,memberPhone} from '@/lib/member-identity';
export const dynamic='force-dynamic';
export async function POST(req:Request){
  try{
    const body=await req.json(),name=memberName(body.name),phone=memberPhone(body.phone);
    if(name.length<2||name.length>200||!phone)return NextResponse.json({error:'กรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วน'},{status:400});
    const now=Date.now(),bucket=Math.floor(now/300000);
    const ip=(req.headers.get('x-vercel-forwarded-for')||req.headers.get('x-forwarded-for')||'local').split(',')[0].trim();
    const key=createHash('sha256').update(ip+':'+phone+':'+bucket).digest('hex');
    const limit=await prisma.memberLoginLimit.upsert({where:{key},create:{key,attempts:1,expiresAt:new Date((bucket+1)*300000)},update:{attempts:{increment:1}}});
    if(limit.attempts>20)return NextResponse.json({error:'ลองเข้าสู่ระบบหลายครั้ง กรุณารอสักครู่'},{status:429,headers:{'Retry-After':'300'}});
    await prisma.memberLoginLimit.deleteMany({where:{expiresAt:{lt:new Date(now-86400000)}}});
    const user=await prisma.user.upsert({where:{phone},update:{},create:{phone,name,email:'member-'+randomUUID()+'@member.invalid',role:'ลูกค้า',icon:'Users',color:'#A8978E'}});
    if(user.role!=='ลูกค้า'||memberName(user.name)!==name)return NextResponse.json({error:'ชื่อหรือเบอร์โทรไม่ตรงกับข้อมูลสมาชิก กรุณาติดต่อร้านหากต้องการแก้ไข'},{status:401});
    const token=await createSession({id:user.id,name:user.name,email:user.email,role:user.role});
    const res=NextResponse.json({user:{id:user.id,name:user.name,phone:user.phone,role:user.role}},{headers:{'Cache-Control':'no-store'}});
    res.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400});return res;
  }catch{return NextResponse.json({error:'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'},{status:400});}
}
