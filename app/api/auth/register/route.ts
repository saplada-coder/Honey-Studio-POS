import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

// สมัครสมาชิก (สิทธิ์ "ลูกค้า" เท่านั้น) แล้วล็อกอินให้อัตโนมัติ
export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "กรุณากรอกชื่อ อีเมล และรหัสผ่าน" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  const mail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: mail } });
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้แล้ว" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: { name: String(name).trim(), email: mail, passwordHash, role: "ลูกค้า", icon: "Users", color: "#A8978E" },
  });

  const token = await createSession({ id: user.id, name: user.name, role: user.role, email: user.email });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
