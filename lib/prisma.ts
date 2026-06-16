// ตัวเชื่อมต่อฐานข้อมูล (ใช้ร่วมกันทั้งแอป แบบ singleton)
// Prisma 7 ใช้ driver adapter — เชื่อม Postgres/Neon ผ่าน @prisma/adapter-pg
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
