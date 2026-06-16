import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifySession, createSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

// เปลี่ยนรหัสผ่าน + แก้ชื่อ (ของผู้ใช้ที่ล็อกอินอยู่)
export async function POST(req: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "ยังไม่ได้ล็อกอิน" }, { status: 401 });

  const { name, currentPassword, newPassword } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });

  const data: { name?: string; passwordHash?: string } = {};

  // แก้ชื่อ (ถ้าส่งมา)
  if (name && String(name).trim()) data.name = String(name).trim();

  // เปลี่ยนรหัสผ่าน (ต้องยืนยันรหัสเดิม)
  if (newPassword) {
    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: "รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }
    const ok = await bcrypt.compare(String(currentPassword || ""), user.passwordHash);
    if (!ok) return NextResponse.json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" }, { status: 401 });
    data.passwordHash = await bcrypt.hash(String(newPassword), 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลให้อัปเดต" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  // ถ้าเปลี่ยนชื่อ ให้ออก token ใหม่ให้ session ตรงกัน
  const res = NextResponse.json({ user: { id: updated.id, name: updated.name, role: updated.role, email: updated.email } });
  if (data.name) {
    const newToken = await createSession({ id: updated.id, name: updated.name, role: updated.role, email: updated.email });
    res.cookies.set(SESSION_COOKIE, newToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}
