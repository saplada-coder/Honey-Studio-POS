import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ไอคอน/สี ตามบทบาท (ให้แสดงผลสม่ำเสมอ)
const ROLE_STYLE: Record<string, { icon: string; color: string }> = {
  "เจ้าของ": { icon: "Crown", color: "#D4AF37" },
  "ผู้ดูแลระบบ": { icon: "Shield", color: "#7C93B8" },
  "พนักงานขาย": { icon: "UserCog", color: "#D8B4B8" },
  "ลูกค้า": { icon: "Users", color: "#A8978E" },
};

// รายชื่อผู้ใช้ (ไม่ส่งรหัสผ่านออกไป)
export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, role: true, email: true, icon: true, color: true },
  });
  return NextResponse.json(users);
}

// เพิ่มผู้ใช้ใหม่
export async function POST(req: Request) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "กรุณากรอกชื่อ อีเมล รหัสผ่าน และบทบาท" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }
  const mail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: mail } });
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้แล้ว" }, { status: 409 });
  }
  const style = ROLE_STYLE[role] || ROLE_STYLE["ลูกค้า"];
  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: { name: String(name).trim(), email: mail, passwordHash, role, icon: style.icon, color: style.color },
  });
  return NextResponse.json({ id: user.id, name: user.name, role: user.role, email: user.email }, { status: 201 });
}
