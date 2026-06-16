import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ดึงรายการซัก-ซ่อมทั้งหมด
export async function GET() {
  const items = await prisma.laundryRepair.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(items);
}

// เพิ่มรายการซัก-ซ่อมใหม่
export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.laundryRepair.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
