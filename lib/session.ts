// ตัวช่วยอ่าน session ฝั่ง Route Handler (server) — ใช้คู่กับ proxy.ts ที่กันสิทธิ์ชั้นนอก
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE, type SessionUser } from "@/lib/auth";

// คืนข้อมูลผู้ใช้ที่ล็อกอินอยู่ หรือ null
export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? await verifySession(token) : null;
}

// ลูกค้าเห็นได้เฉพาะรายการที่ชื่อตรงกับตัวเอง
// (ใช้กฎเดียวกับที่หน้าเว็บกรองอยู่เดิม เพื่อไม่ให้ของที่เคยเห็นหายไป)
export function isOwnRecord(custName: string | null | undefined, meName: string) {
  const c = String(custName || "").trim();
  const m = String(meName || "").trim();
  if (!c || !m) return false;
  return c.includes(m) || m.includes(c);
}
