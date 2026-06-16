// โหลดค่าจาก .env.local (ที่ Vercel/Neon ใส่ DATABASE_URL ไว้)
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // ใช้สาย direct (ไม่ผ่าน pool) สำหรับคำสั่ง migrate ของ Neon
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
