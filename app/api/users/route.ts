import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// รายชื่อผู้ใช้ (ไม่ส่งรหัสผ่านออกไป)
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, role: true, email: true, icon: true, color: true },
  });
  return NextResponse.json(users);
}
