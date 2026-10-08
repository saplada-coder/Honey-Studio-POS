import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
import {shopInfo,defaultShopInfo} from '@/lib/shop';
import {isDate} from '@/lib/booking-availability';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json(await shopInfo());}
export async function PUT(req:Request){
  const user=await currentUser();if(!user||!['เจ้าของ','ผู้ดูแลระบบ'].includes(user.role))return NextResponse.json({error:'เฉพาะเจ้าของหรือผู้ดูแลระบบ'},{status:403});
  const body=await req.json();const data=Object.fromEntries(Object.keys(defaultShopInfo).map(key=>[key,String(body[key]||'').trim().slice(0,['promotions','intro','depositTerms','rentalRules','promotionTerms','bookingGuide','rentalCounting','collectionTerms','damageTerms','changeTerms','purchaseTerms','outstandingTerms'].includes(key)?4000:1000)]));
  for(const key of ['map','social'])if(data[key]&&!/^https:\/\//.test(data[key]))return NextResponse.json({error:'ลิงก์ต้องเริ่มด้วย https://'},{status:400});
  if((data.promotionStart||data.promotionEnd)&&(!isDate(data.promotionStart)||!isDate(data.promotionEnd)||data.promotionEnd<data.promotionStart))return NextResponse.json({error:'กำหนดวันเริ่มและสิ้นสุดโปรโมชั่นให้ถูกต้อง'},{status:400});
  await prisma.shopSettings.upsert({where:{id:'main'},create:{id:'main',data:JSON.stringify(data)},update:{data:JSON.stringify(data)}});return NextResponse.json(data);
}
