// ป้องกันทุกหน้า/ทุก API ให้เข้าได้เฉพาะคนที่ล็อกอินแล้ว
// Next.js 16: ไฟล์นี้คือ proxy.ts (เดิมชื่อ middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // เส้นทางที่เข้าได้โดยไม่ต้องล็อกอิน
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    // API → ตอบ 401 / หน้าเว็บ → พาไปหน้า login
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "ยังไม่ได้ล็อกอิน" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ===== จำกัดสิทธิ์การเรียก API ตามบทบาท =====
  if (pathname.startsWith("/api") && !apiAllowed(session.role, pathname, req.method)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 });
  }

  return NextResponse.next();
}

// คืน true ถ้าบทบาทนี้เรียก API เส้นทาง/เมธอดนี้ได้
function apiAllowed(role: string, pathname: string, method: string) {
  const isWrite = method !== "GET";
  if (role === "เจ้าของ") return true;
  if (role === "ผู้ดูแลระบบ") {
    // ไม่เห็นบัญชีรับจ่าย
    if (pathname.startsWith("/api/transactions")) return false;
    return true;
  }
  if (role === "พนักงานขาย") {
    if (pathname.startsWith("/api/transactions")) return false; // ไม่เห็นบัญชี
    if (pathname.startsWith("/api/users")) return false; // ไม่จัดการผู้ใช้
    return true;
  }
  if (role === "ลูกค้า") {
    if (isWrite) return false; // อ่านอย่างเดียว
    return (
      pathname.startsWith("/api/orders") ||
      pathname.startsWith("/api/rentals") ||
      pathname.startsWith("/api/products")
    );
  }
  return true;
}

export const config = {
  // ยกเว้นไฟล์ static / รูป / favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
