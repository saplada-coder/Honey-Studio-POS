import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // เรียง "ที่เพิ่มล่าสุดอยู่บน" (เดิมเรียงตามรหัส ทำให้รายการใหม่ที่รหัสสุ่มไปโผล่กลางๆ)
  const txns = await prisma.transaction.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(txns);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.transaction.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
