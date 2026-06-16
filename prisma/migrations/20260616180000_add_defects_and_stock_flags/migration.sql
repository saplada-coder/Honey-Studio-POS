-- เพิ่มฟิลด์รูปตำหนิให้สินค้า (เก็บ JSON array ของ URL)
ALTER TABLE "Product" ADD COLUMN "defects" TEXT NOT NULL DEFAULT '';

-- เพิ่มธงกันตัด/คืนสต็อกซ้ำให้การเช่า
ALTER TABLE "Rental" ADD COLUMN "stockApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stockReturned" BOOLEAN NOT NULL DEFAULT false;
