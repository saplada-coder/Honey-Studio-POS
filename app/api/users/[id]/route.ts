import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROLE_STYLE: Record<string, { icon: string; color: string }> = {
  "เจ้าของ": { icon: "Crown", color: "#D4AF37" },
  "ผู้ดูแลระบบ": { icon: "Shield", color: "#7C93B8" },
  "พนักงานขาย": { icon: "UserCog", color: "#D8B4B8" },
  "ลูกค้า": { icon: "Users", color: "#A8978E" },
};

async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? await verifySession(token) : null;
}

// แก้ไขผู้ใช้ (ชื่อ / บทบาท / รีเซ็ตรหัสผ่าน)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ยังไม่ได้ล็อกอิน" }, { status: 401 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });

  // ผู้ดูแลระบบยุ่งกับบัญชีเจ้าของไม่ได้
  if (session.role === "ผู้ดูแลระบบ" && target.role === "เจ้าของ") {
    return NextResponse.json({ error: "ผู้ดูแลระบบไม่มีสิทธิ์แก้ไขบัญชีเจ้าของ" }, { status: 403 });
  }

  const { name, role, password } = await req.json();
  const data: { name?: string; role?: string; icon?: string; color?: string; passwordHash?: string } = {};

  if (name && String(name).trim()) data.name = String(name).trim();

  if (role) {
    const style = ROLE_STYLE[role];
    if (!style) return NextResponse.json({ error: "บทบาทไม่ถูกต้อง" }, { status: 400 });
    data.role = role;
    data.icon = style.icon;
    data.color = style.color;
  }

  if (password) {
    if (String(password).length < 6) {
      return NextResponse.json({ error: "รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(String(password), 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลให้อัปเดต" }, { status: 400 });
  }

  const u = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: u.id, name: u.name, role: u.role, email: u.email });
}

// ลบผู้ใช้
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ยังไม่ได้ล็อกอิน" }, { status: 401 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });

  if (session.role === "ผู้ดูแลระบบ" && target.role === "เจ้าของ") {
    return NextResponse.json({ error: "ผู้ดูแลระบบไม่มีสิทธิ์ลบบัญชีเจ้าของ" }, { status: 403 });
  }
  if (target.id === session.id) {
    return NextResponse.json({ error: "ลบบัญชีตัวเองไม่ได้" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
