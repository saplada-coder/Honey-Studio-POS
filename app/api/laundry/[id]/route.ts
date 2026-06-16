import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// แก้ไขรายการซัก-ซ่อม (เปลี่ยนสถานะ/รายละเอียด)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.laundryRepair.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.laundryRepair.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
