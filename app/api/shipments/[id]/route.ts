import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// แก้ใบส่ง (เช่น สร้างเลขแทร็กกิ้ง/อัปเดตสถานะ)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.shipment.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}
