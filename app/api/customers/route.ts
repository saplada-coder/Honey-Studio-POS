import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {ensureMember} from '@/lib/member-link';
import {memberName,memberPhone} from '@/lib/member-identity';

export const dynamic = "force-dynamic";

export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const body = await req.json();
  try{
    if(body.phone&&!memberPhone(body.phone))throw new Error('กรุณากรอกเบอร์โทรลูกค้าให้ถูกต้อง');
    const created=await prisma.$transaction(async tx=>{
      await ensureMember(tx,{name:body.name,phone:body.phone});
      return tx.customer.create({data:{...body,name:memberName(body.name),phone:memberPhone(body.phone)}});
    },{maxWait:15000,timeout:15000});
    return NextResponse.json(created,{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'บันทึกลูกค้าไม่สำเร็จ'},{status:409});}
}
