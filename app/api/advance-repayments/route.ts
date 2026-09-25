import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// รายการ "โอนคืนเงินสำรองจ่าย" — ที่เพิ่มล่าสุดอยู่บน
export async function GET() {
  const rows = await prisma.advanceRepayment.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.advanceRepayment.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
