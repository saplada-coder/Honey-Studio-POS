import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {currentUser} from '@/lib/session';
export const dynamic='force-dynamic';
export async function GET(){
  const user=await currentUser();
  if(!user||!['เจ้าของ','ผู้ดูแลระบบ','พนักงานขาย'].includes(user.role))return NextResponse.json({error:'ไม่มีสิทธิ์เข้าถึงถังขยะ'},{status:403});
  const rows=await prisma.stockTrash.findMany({where:{restoredAt:null},orderBy:{createdAt:'desc'}});
  return NextResponse.json(rows.map(row=>({...row,snapshot:JSON.parse(row.snapshot)})));
}
export async function POST(req:Request){
  const user=await currentUser();
  if(!user||!['เจ้าของ','ผู้ดูแลระบบ','พนักงานขาย'].includes(user.role))return NextResponse.json({error:'ไม่มีสิทธิ์กู้คืน'},{status:403});
  try{
    const body=await req.json();
    const result=await prisma.$transaction(async tx=>{
      const id=String(body.id||'');
      await tx.$queryRaw`SELECT id FROM "StockTrash" WHERE id=${id} FOR UPDATE`;
      const entry=await tx.stockTrash.findUniqueOrThrow({where:{id}});
      if(entry.restoredAt)throw Error('รายการนี้กู้คืนแล้ว');
      const snapshot=JSON.parse(entry.snapshot);
      if(entry.kind==='product'){
        if(await tx.product.findUnique({where:{id:entry.productId}}))throw Error('รหัสสินค้านี้มีอยู่แล้ว จึงไม่สามารถกู้ทับได้');
        await tx.product.create({data:{...snapshot,createdAt:new Date(snapshot.createdAt),updatedAt:new Date()}});
      }else{
        const productId=entry.productId||String(body.productId||'');
        const field=entry.productId?snapshot.field:String(body.field||'image');
        if(!['image','imageBack','defects'].includes(field))throw Error('เลือกตำแหน่งรูปให้ถูกต้อง');
        await tx.$queryRaw`SELECT id FROM "Product" WHERE id=${productId} FOR UPDATE`;
        const product=await tx.product.findUniqueOrThrow({where:{id:productId}});
        if(field==='defects'){
          const photos=JSON.parse(product.defects||'[]');
          if(!Array.isArray(photos)||photos.length>=10)throw Error('รูปตำหนิครบ 10 รูปแล้ว');
          await tx.product.update({where:{id:productId},data:{defects:JSON.stringify([...new Set([...photos,snapshot.url])])}});
        }else{
          if(product[field as 'image'|'imageBack'])throw Error('ช่องนี้มีรูปอยู่แล้ว เลือกช่องที่ว่างเพื่อไม่ทับรูปใหม่');
          await tx.product.update({where:{id:productId},data:{[field]:snapshot.url}});
        }
      }
      return tx.stockTrash.update({where:{id},data:{restoredAt:new Date()}});
    });
    return NextResponse.json({id:result.id});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'กู้คืนไม่สำเร็จ'},{status:409});}
}
