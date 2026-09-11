import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// วันนี้แบบ ISO (YYYY-MM-DD) ตามเวลาไทย — ใช้บันทึกวันที่อนุมัติ
// (เซิร์ฟเวอร์ Vercel เป็น UTC ถ้าไม่บวก 7 ชม. ช่วงเที่ยงคืน-ตี 7 จะได้วันที่ย้อนหลังไป 1 วัน)
const todayISO = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

export async function GET() {
  // date เก็บเป็น ISO จึงเรียงตามข้อความได้ตรงกับเรียงตามเวลา (ใหม่ → เก่า)
  const list = await prisma.officeExpense.findMany({ orderBy: [{ date: "desc" }, { id: "desc" }] });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const me = await currentUser();
  const body = await req.json();
  // ผู้อนุมัติ/วันที่อนุมัติ ต้องมาจากเซิร์ฟเวอร์เท่านั้น ไม่ให้ฟอร์มส่งมาเอง
  const { approvedBy: _a, approvedAt: _b, createdAt: _c, updatedAt: _d, ...clean } = body;
  const approved = clean.status === "อนุมัติแล้ว";
  const created = await prisma.officeExpense.create({
    data: {
      ...clean,
      status: clean.status || "รออนุมัติ",
      approvedBy: approved ? me?.name || "" : "",
      approvedAt: approved ? todayISO() : "",
    },
  });
  return NextResponse.json(created, { status: 201 });
}
