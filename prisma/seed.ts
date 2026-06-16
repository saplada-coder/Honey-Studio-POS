// ใส่ข้อมูลตัวอย่างลงฐานข้อมูล (รันด้วย: npm run db:seed)
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const products = [
  { id: "HS-D001", name: "ชุดราตรียาว Champagne", cat: "ชุดราตรี", type: "ทั้งคู่", rent: 1200, sell: 8900, stockRent: 3, stockSell: 3, loc: "ราว A1", status: "ว่าง", value: 9500, acquired: "1 ม.ค. 68", note: "ชุดขายดี ดูแลพิเศษ" },
  { id: "HS-D002", name: "ชุดเพื่อนเจ้าสาว Dusty Rose", cat: "ชุดเพื่อนเจ้าสาว", type: "เช่า", rent: 900, sell: 0, stockRent: 6, stockSell: 0, loc: "ราว A2", status: "ถูกเช่า" },
  { id: "HS-D003", name: "ชุดราตรี Navy Mermaid", cat: "ชุดราตรี", type: "เช่า", rent: 1500, sell: 0, stockRent: 2, stockSell: 0, loc: "ราว A1", status: "ว่าง" },
  { id: "HS-S010", name: "รองเท้าส้นสูง Gold 3 นิ้ว", cat: "รองเท้า", type: "ทั้งคู่", rent: 300, sell: 1290, stockRent: 8, stockSell: 8, loc: "ชั้น B1", status: "ว่าง" },
  { id: "HS-B020", name: "กระเป๋าคลัทช์ Pearl", cat: "กระเป๋า", type: "ทั้งคู่", rent: 250, sell: 990, stockRent: 1, stockSell: 1, loc: "ตู้ C1", status: "ว่าง" },
  { id: "HS-D004", name: "ชุดราตรี Emerald Satin", cat: "ชุดราตรี", type: "ทั้งคู่", rent: 1300, sell: 7500, stockRent: 0, stockSell: 0, loc: "ราว A3", status: "ซ่อม" },
  { id: "HS-D005", name: "ชุดไทยจักรพรรดิทอง", cat: "ชุดไทย", type: "เช่า", rent: 1800, sell: 0, stockRent: 4, stockSell: 0, loc: "ราว A4", status: "ว่าง" },
  { id: "HS-A030", name: "เครื่องประดับมงกุฎ Crystal", cat: "เครื่องประดับ", type: "เช่า", rent: 400, sell: 0, stockRent: 2, stockSell: 0, loc: "ตู้ C2", status: "ว่าง" },
];

const customers = [
  { id: "C001", name: "คุณพิมพ์ชนก ศรีสุข", phone: "081-234-5678", line: "@pim_ploy", addr: "เขตสาทร กทม.", orders: 5, spent: 12400 },
  { id: "C002", name: "คุณกานต์ธิดา วงศ์ทอง", phone: "089-876-5432", line: "@kanthida", addr: "อ.หาดใหญ่ สงขลา", orders: 3, spent: 6700 },
  { id: "C003", name: "คุณภัสสร เจริญพร", phone: "082-555-7788", line: "@napat.j", addr: "อ.เมือง เชียงใหม่", orders: 8, spent: 23100 },
  { id: "C004", name: "คุณวรินทร์ภิญญ์ ทีฆาม", phone: "086-111-2233", line: "@warin", addr: "เขตบางนา กทม.", orders: 1, spent: 1500 },
];

const orders = [
  { id: "ORD-2401", cust: "คุณพิมพ์ชนก ศรีสุข", type: "เช่า", items: "ชุดราตรียาว Champagne", total: 1200, status: "รอชำระ", date: "16 มิ.ย. 68" },
  { id: "ORD-2400", cust: "คุณภัสสร เจริญพร", type: "ขาย", items: "รองเท้าส้นสูง Gold ×1", total: 1290, status: "สำเร็จ", date: "15 มิ.ย. 68" },
  { id: "ORD-2399", cust: "คุณกานต์ธิดา วงศ์ทอง", type: "เช่า", items: "ชุดเพื่อนเจ้าสาว ×3", total: 2700, status: "กำลังจัดส่ง", date: "15 มิ.ย. 68" },
  { id: "ORD-2398", cust: "คุณวรินทร์ภิญญ์ ทีฆาม", type: "เช่า", items: "กระเป๋าคลัทช์ Pearl", total: 250, status: "สำเร็จ", date: "14 มิ.ย. 68" },
  { id: "ORD-2397", cust: "คุณพิมพ์ชนก ศรีสุข", type: "ขาย", items: "กระเป๋าคลัทช์ Pearl", total: 990, status: "เตรียมของ", date: "14 มิ.ย. 68" },
];

const rentals = [
  { id: "R-501", cust: "คุณพิมพ์ชนก", phone: "081-234-5678", item: "ชุดราตรียาว Champagne", code: "HS-D001", start: "16 มิ.ย.", end: "18 มิ.ย.", fee: 1200, deposit: 2000, status: "จองแล้ว" },
  { id: "R-502", cust: "คุณกานต์ธิดา", phone: "089-876-5432", item: "ชุดเพื่อนเจ้าสาว ×3", code: "HS-D002", start: "15 มิ.ย.", end: "17 มิ.ย.", fee: 2700, deposit: 3000, status: "รับ/ส่งแล้ว" },
  { id: "R-503", cust: "คุณภัสสร", phone: "082-555-7788", item: "ชุดไทยจักรพรรดิทอง", code: "HS-D005", start: "13 มิ.ย.", end: "16 มิ.ย.", fee: 1800, deposit: 3000, status: "กำลังใช้งาน" },
  { id: "R-504", cust: "คุณวรินทร์ภิญญ์", phone: "086-111-2233", item: "กระเป๋าคลัทช์ Pearl", code: "HS-B020", start: "10 มิ.ย.", end: "13 มิ.ย.", fee: 250, deposit: 500, condition: "สมบูรณ์ คืนครบ", inspector: "พ่อค้ามาย", status: "คืนแล้ว" },
  { id: "R-505", cust: "คุณภัสสร", phone: "082-555-7788", item: "ชุดราตรี Navy Mermaid", code: "HS-D003", start: "08 มิ.ย.", end: "12 มิ.ย.", fee: 1500, deposit: 2000, fine: 600, damage: 400, condition: "มีรอยเปื้อนชายกระโปรง", inspector: "คุณแอดมิน", status: "เกินกำหนด" },
  { id: "R-506", cust: "คุณกานต์ธิดา", phone: "089-876-5432", item: "เครื่องประดับมงกุฎ", code: "HS-A030", start: "17 มิ.ย.", end: "19 มิ.ย.", fee: 400, deposit: 1000, status: "จองแล้ว" },
];

const laundry = [
  { id: "LR-1001", date: "16 มิ.ย.", code: "HS-D003", item: "ซักแห้งชุดราตรี Navy (รอยเปื้อนชายกระโปรง)", type: "ซัก", cost: 350, owner: "ร้านซักพี่หมี", status: "กำลังดำเนินการ" },
  { id: "LR-1002", date: "15 มิ.ย.", code: "HS-D004", item: "ซ่อมซิปข้างชุด Emerald Satin", type: "ซ่อม", cost: 250, owner: "ช่างป้าแดง", status: "รอซ่อม" },
  { id: "LR-1003", date: "14 มิ.ย.", code: "HS-D001", item: "ซักรีดชุด Champagne ก่อนส่งมอบ", type: "ซัก", cost: 200, owner: "ร้านซักพี่หมี", status: "เสร็จแล้ว" },
  { id: "LR-1004", date: "13 มิ.ย.", code: "HS-D005", item: "ซ่อมตะขอชุดไทยจักรพรรดิ", type: "ซ่อม", cost: 180, owner: "ช่างป้าแดง", status: "รอดำเนินการ" },
];

const txns = [
  { id: "T-9001", date: "16 มิ.ย.", desc: "ค่าเช่า ORD-2401", cat: "รายรับ-เช่า", type: "in", amt: 1200, auto: true },
  { id: "T-9000", date: "15 มิ.ย.", desc: "ขายสินค้า ORD-2400", cat: "รายรับ-ขาย", type: "in", amt: 1290, auto: true },
  { id: "T-8999", date: "15 มิ.ย.", desc: "ค่าเช่า ORD-2399", cat: "รายรับ-เช่า", type: "in", amt: 2700, auto: true },
  { id: "T-8998", date: "14 มิ.ย.", desc: "ค่าซักรีดชุด", cat: "ค่าดูแลสินค้า", type: "out", amt: 850, auto: false },
  { id: "T-8997", date: "13 มิ.ย.", desc: "ค่าเช่าหน้าร้าน (มิ.ย.)", cat: "ค่าเช่าที่", type: "out", amt: 18000, auto: false },
  { id: "T-8996", date: "12 มิ.ย.", desc: "ซื้อชุดใหม่เข้าร้าน", cat: "ต้นทุนสินค้า", type: "out", amt: 12500, auto: false },
];

const shipments = [
  { id: "SH-301", order: "ORD-2399", cust: "คุณกานต์ธิดา", carrier: "Kerry", track: "KEX9928374001", status: "กำลังจัดส่ง" },
  { id: "SH-300", order: "ORD-2400", cust: "คุณภัสสร", carrier: "Flash", track: "TH880023451", status: "ส่งสำเร็จ" },
  { id: "SH-299", order: "ORD-2397", cust: "คุณพิมพ์ชนก", carrier: "ไปรษณีย์ไทย", track: "—", status: "รอสร้างเลข" },
];

async function main() {
  console.log("🌱 เริ่มใส่ข้อมูลตัวอย่าง...");

  for (const p of products) await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
  console.log(`  ✓ สินค้า ${products.length} รายการ`);

  for (const c of customers) await prisma.customer.upsert({ where: { id: c.id }, update: c, create: c });
  console.log(`  ✓ ลูกค้า ${customers.length} รายการ`);

  for (const o of orders) await prisma.order.upsert({ where: { id: o.id }, update: o, create: o });
  console.log(`  ✓ ออเดอร์ ${orders.length} รายการ`);

  for (const r of rentals) await prisma.rental.upsert({ where: { id: r.id }, update: r, create: r });
  console.log(`  ✓ การเช่า ${rentals.length} รายการ`);

  for (const t of txns) await prisma.transaction.upsert({ where: { id: t.id }, update: t, create: t });
  console.log(`  ✓ บัญชี ${txns.length} รายการ`);

  for (const s of shipments) await prisma.shipment.upsert({ where: { id: s.id }, update: s, create: s });
  console.log(`  ✓ จัดส่ง ${shipments.length} รายการ`);

  for (const l of laundry) await prisma.laundryRepair.upsert({ where: { id: l.id }, update: l, create: l });
  console.log(`  ✓ ซัก-ซ่อม ${laundry.length} รายการ`);

  // ===== บัญชีผู้ใช้งาน =====
  const adminHash = await bcrypt.hash("admin123", 10);
  const users = [
    { name: "คุณฮันนี่ (เจ้าของ)", role: "เจ้าของ", email: "honey@studio.co", icon: "Crown", color: "#D4AF37", passwordHash: adminHash },
    { name: "ผู้ดูแลระบบ (ทดสอบ)", role: "เจ้าของ", email: "test@test.com", icon: "Crown", color: "#D4AF37", passwordHash: adminHash },
    { name: "คุณแอดมิน", role: "ผู้ดูแลระบบ", email: "admin@studio.co", icon: "Shield", color: "#7C93B8", passwordHash: adminHash },
    { name: "พ่อค้ามาย", role: "พนักงานขาย", email: "may@studio.co", icon: "UserCog", color: "#D8B4B8", passwordHash: adminHash },
    { name: "คุณพิมพ์ชนก", role: "ลูกค้า", email: "pim@line.com", icon: "Users", color: "#A8978E", passwordHash: adminHash },
  ];
  for (const u of users) await prisma.user.upsert({ where: { email: u.email }, update: u, create: u });
  console.log(`  ✓ ผู้ใช้ ${users.length} รายการ (แอดมินทดสอบ: test@test.com / admin123)`);

  console.log("✅ ใส่ข้อมูลตัวอย่างเสร็จสมบูรณ์");
}

main()
  .catch((e) => {
    console.error("❌ เกิดข้อผิดพลาด:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
