import {NextResponse} from 'next/server';
import QRCode from 'qrcode';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
import {qrLabelPdf} from '@/lib/qr-label-pdf';

export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await currentUser();
  if(!user||!['เจ้าของ','ผู้ดูแลระบบ','พนักงานขาย'].includes(user.role))return NextResponse.json({error:'ไม่มีสิทธิ์พิมพ์ป้าย'},{status:403});
  const {id}=await params;
  const product=await prisma.product.findUnique({where:{id},select:{id:true}});
  if(!product)return NextResponse.json({error:'ไม่พบชุด'},{status:404});
  const query=new URL(req.url).searchParams;
  const dimension=(key:string,fallback:number,max:number)=>{const value=Number(query.get(key));return Number.isFinite(value)&&value>=50&&value<=max?value:fallback;};
  const site=(process.env.NEXT_PUBLIC_SITE_URL||'https://honey-studio-opal.vercel.app').replace(/\/$/,'');
  try{
    const qr=QRCode.create(`${site}/p/${encodeURIComponent(id)}`,{errorCorrectionLevel:'M'});
    const pdf=qrLabelPdf(id,qr.modules,dimension('width',50,150),dimension('height',70,200));
    return new Response(pdf,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="QR-label.pdf"','Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'สร้างป้ายไม่สำเร็จ กรุณาตรวจรหัสชุด'},{status:400});}
}
