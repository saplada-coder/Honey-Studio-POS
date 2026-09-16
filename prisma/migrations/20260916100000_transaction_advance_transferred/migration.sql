-- AlterTable: เพิ่มช่องติ๊ก "สำรองจ่าย" และ "โอนเรียบร้อย" ให้บัญชีรับจ่าย
ALTER TABLE "Transaction" ADD COLUMN     "advance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transferred" BOOLEAN NOT NULL DEFAULT false;
