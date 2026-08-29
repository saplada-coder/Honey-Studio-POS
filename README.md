# 🍯 HONEY STUDIO POS

ระบบจัดการร้านเช่า-ขายชุด (POS) ของ HONEY STUDIO — สต็อกสินค้า, ลูกค้า, คำสั่งซื้อ, จองชุดเช่า, ซัก-ซ่อม, การจัดส่ง, บัญชีรับจ่าย, รายงาน และจัดการผู้ใช้

> ⚠️ ค่าคีย์/รหัสผ่านทั้งหมดอยู่ในไฟล์ `.env.local` เท่านั้น (ไม่ขึ้น git) — ขอจากเจ้าของโปรเจกต์
> เอกสารส่งต่องานฉบับเต็ม (มีคีย์จริง) ไม่ได้อยู่ใน repo นี้

## Tech stack

| ส่วน | ใช้อะไร |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| CSS | Tailwind CSS v4 |
| ORM / DB | Prisma 7 (driver adapter `@prisma/adapter-pg`) + Neon Postgres |
| Auth | JWT เขียนเอง (`jose`) + `bcryptjs` · cookie `hs_session` อายุ 7 วัน |
| ไฟล์/รูป | Vercel Blob |
| อื่นๆ | recharts, lucide-react, xlsx |
| Deploy | Vercel (auto-deploy จาก branch `main`) |

## เริ่มใช้งาน

```bash
npm install          # postinstall จะรัน prisma generate ให้
# สร้างไฟล์ .env.local (ดูหัวข้อถัดไป)
npx prisma migrate status   # ควรได้ "Database schema is up to date!"
npm run dev                 # http://localhost:3000
```

### ตัวแปรใน `.env.local`

ดูรายชื่อได้จาก `.env.example` — ตัวที่โค้ดใช้จริง:

| ตัวแปร | ใช้ตอนไหน |
|---|---|
| `DATABASE_URL` | runtime (สาย **pooled**) |
| `DATABASE_URL_UNPOOLED` | ตอนรัน migration (สาย **ไม่มี** `-pooler`) |
| `AUTH_SECRET` | เซ็น/ตรวจ JWT — ต้องตรงกับที่ตั้งบน Vercel |
| `BLOB_READ_WRITE_TOKEN` | อัปโหลดรูป (ไม่ใส่ = `/api/upload` ตอบ 503) |

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | dev server ที่ :3000 |
| `npm run build` | `prisma generate && prisma migrate deploy && next build` — รันก่อน push เสมอ |
| `npm start` | รันตัวที่ build แล้ว |
| `npx prisma generate` | สร้าง Prisma Client ใหม่ (ทุกครั้งที่แก้ schema) |
| `npx prisma studio` | GUI ดู/แก้ข้อมูล |
| `npm run db:seed` | ใส่ข้อมูลตัวอย่าง ⚠️ ทับข้อมูลจริงบางส่วน |

## โครงสร้างหลัก

```
app/
├── page.tsx        ทุกหน้าจอของระบบอยู่ในไฟล์นี้ไฟล์เดียว
├── login/page.tsx  ล็อกอิน + สมัครสมาชิก
└── api/            REST API ทุกหมวด (products, orders, rentals, ...)
lib/auth.ts         สร้าง/ตรวจ JWT
lib/prisma.ts       Prisma Client singleton (driver adapter)
proxy.ts            ยามตรวจล็อกอิน + สิทธิ์ทุก request
prisma/             schema + migrations + seed
```

## บทบาทผู้ใช้ (4 ระดับ)

`เจ้าของ` · `ผู้ดูแลระบบ` (ยุ่งกับบัญชีเจ้าของไม่ได้) · `พนักงานขาย` (ไม่เห็นบัญชีรับจ่าย/จัดการผู้ใช้) · `ลูกค้า` (อ่านอย่างเดียว)
สิทธิ์จริงบังคับที่ `proxy.ts` (ฟังก์ชัน `apiAllowed`) ส่วน `ROLE_PAGES` ใน `page.tsx` แค่ซ่อนเมนู

## ข้อควรระวังสำหรับคนแก้โค้ด

- **Next.js 16** ใช้ไฟล์ `proxy.ts` (ไม่ใช่ `middleware.ts`) — สร้างผิดชื่อ = ระบบสิทธิ์ไม่ทำงาน
- **Prisma 7** ห้ามใส่ `url` / `directUrl` ใน `schema.prisma` และห้ามใช้ `datasourceUrl` — URL ตอน migrate อยู่ใน `prisma.config.ts`, runtime ใช้ driver adapter
- หลัง `prisma generate` ต้อง **restart dev server** ทุกครั้ง ไม่งั้น API ตอบ 500
- `next.config.ts` ปิดเช็ค TypeScript/ESLint ตอน build → build ผ่าน ≠ ไม่มีบั๊ก ต้องทดสอบบนเบราว์เซอร์
- ห้ามรัน `prisma migrate reset` เด็ดขาด (ฐานข้อมูล dev = production ตัวเดียวกัน)
