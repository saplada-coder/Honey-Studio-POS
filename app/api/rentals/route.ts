import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, isOwnRecord } from "@/lib/session";
import {createStaffRental} from '@/lib/staff-rental';

export const dynamic = "force-dynamic";

export async function GET() {
  const rentals = await prisma.rental.findMany({ orderBy: { id: "asc" } });
  // role "ลูกค้า" ต้องเห็นเฉพาะการเช่าของตัวเอง — กรองที่เซิร์ฟเวอร์ (ดูคำอธิบายใน /api/orders)
  const me = await currentUser();
  if (me?.role === "ลูกค้า") {
    return NextResponse.json(rentals.filter((r) => r.userId?r.userId===me.id:!r.online&&isOwnRecord(r.cust, me.name)));
  }
  return NextResponse.json(rentals);
}

// สร้างการเช่าใหม่ — ถ้ามีรหัสชุดตรงกับสินค้า จะตัดสต็อกเช่าให้อัตโนมัติ 1 ชิ้น
export async function POST(req: Request) {
  const body = await req.json();
  try{
    const created=await prisma.$transaction(tx=>createStaffRental(tx,body),{timeout:15000});
    return NextResponse.json(created,{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'บันทึกไม่สำเร็จ'},{status:409});}
}
