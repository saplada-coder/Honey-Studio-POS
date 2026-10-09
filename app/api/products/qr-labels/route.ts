import {NextResponse} from 'next/server';
import QRCode from 'qrcode';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
import {qrLabelsPdf} from '@/lib/qr-label-pdf';

export async function POST(req:Request){
  const user=await currentUser();
  if(!user||!['เจ้าของ','ผู้ดูแลระบบ','พนักงานขาย'].includes(user.role))return NextResponse.json({error:'ไม่มีสิทธิ์ส่งออกป้าย'},{status:403});
  try{
    const body=await req.json();
    if(!Array.isArray(body.ids)||!body.ids.length||body.ids.length>500||body.ids.some((id:unknown)=>typeof id!=='string'||id.length>200))return NextResponse.json({error:'เลือก 1–500 ชุดต่อไฟล์'},{status:400});
    const ids=[...new Set<string>(body.ids)];
    const products=await prisma.product.findMany({where:{id:{in:ids}},select:{id:true}});
    if(products.length!==ids.length)return NextResponse.json({error:'บางชุดถูกลบแล้ว กรุณาโหลดรายการใหม่'},{status:404});
    const site=(process.env.NEXT_PUBLIC_SITE_URL||'https://honey-studio-opal.vercel.app').replace(/\/$/,'');
    const labels=ids.map(id=>({id,modules:QRCode.create(`${site}/p/${encodeURIComponent(id)}`,{errorCorrectionLevel:'M'}).modules}));
    return new Response(qrLabelsPdf(labels),{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="HONEY-STUDIO-QR-labels.pdf"','Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'ส่งออกป้ายไม่สำเร็จ กรุณาลองอีกครั้ง'},{status:400});}
}
