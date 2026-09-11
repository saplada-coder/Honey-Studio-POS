import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// วันนี้แบบ ISO ตามเวลาไทย (เซิร์ฟเวอร์เป็น UTC จึงบวก 7 ชม.)
const todayISO = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentUser();
  const body = await req.json();
  // กัน id (primary key) และช่องที่เซิร์ฟเวอร์ต้องเป็นคนเขียนเอง
  const { id: _i, approvedBy: _a, approvedAt: _b, createdAt: _c, updatedAt: _d, ...clean } = body;

  const data: Record<string, unknown> = { ...clean };
  // เปลี่ยนสถานะ → บันทึก/ล้างผู้อนุมัติให้อัตโนมัติ (เชื่อถือได้เพราะมาจาก session)
  if (clean.status === "อนุมัติแล้ว") {
    data.approvedBy = me?.name || "";
    data.approvedAt = todayISO();
  } else if (clean.status === "รออนุมัติ") {
    data.approvedBy = "";
    data.approvedAt = "";
  }

  const updated = await prisma.officeExpense.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.officeExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
