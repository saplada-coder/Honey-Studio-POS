import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// แก้ไขรายการบัญชี (เดิมมีแต่ลบ ต้องลบแล้วสร้างใหม่)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  // ไม่ให้แก้ id (เป็น primary key) และไม่ให้ฟอร์มตั้งป้าย AUTO เอง
  const { id: _ignoreId, auto: _ignoreAuto, createdAt: _c, ...clean } = body;
  const updated = await prisma.transaction.update({ where: { id }, data: clean });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
