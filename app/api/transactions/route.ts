import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {rentalIncome,rentalIncomePrefix} from '@/lib/rental-accounting';

export const dynamic = "force-dynamic";

export async function GET() {
  // เรียง "ที่เพิ่มล่าสุดอยู่บน" (เดิมเรียงตามรหัส ทำให้รายการใหม่ที่รหัสสุ่มไปโผล่กลางๆ)
  const [txns,rentals] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.rental.findMany({where:{paymentStatus:'ชำระแล้ว'},select:{id:true,cust:true,item:true,fee:true,fine:true,damage:true,paymentStatus:true,paymentSlip:true,createdAt:true}}),
  ]);
  return NextResponse.json([...txns,...rentalIncome(rentals,txns)].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),{headers:{'Cache-Control':'no-store'}});
}

export async function POST(req: Request) {
  const body = await req.json();
  if(String(body.id||'').startsWith(rentalIncomePrefix))return NextResponse.json({error:'รายการนี้เชื่อมจากการเช่า กรุณาแก้ไขที่รายการเช่า'},{status:409});
  const created = await prisma.transaction.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
