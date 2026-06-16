-- ผูกคำสั่งซื้อกับสินค้า + ธงกันตัดสต็อกขายซ้ำ
ALTER TABLE "Order" ADD COLUMN "code" TEXT NOT NULL DEFAULT '',
ADD COLUMN "stockApplied" BOOLEAN NOT NULL DEFAULT false;
