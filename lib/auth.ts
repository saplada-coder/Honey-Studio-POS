// ตัวช่วยระบบล็อกอิน — สร้าง/ตรวจ token (ใช้ jose ทำงานได้ทั้ง Node และ Edge/middleware)
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "hs_session";

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionUser = {
  id: string;
  name: string;
  role: string;
  email: string;
};

// สร้าง token หลังล็อกอินสำเร็จ (อายุ 7 วัน)
export async function createSession(user: SessionUser) {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

// ตรวจ token — คืนข้อมูลผู้ใช้ หรือ null ถ้าไม่ถูกต้อง/หมดอายุ
export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      id: String(payload.id),
      name: String(payload.name),
      role: String(payload.role),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}
