-- AlterTable: แยกรูปแนบของ "สำรองจ่าย" และ "โอนเรียบร้อย" ออกจากช่องบิล/สลิปเดิม
ALTER TABLE "Transaction" ADD COLUMN     "slipsAdvance" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "slipsTransfer" TEXT NOT NULL DEFAULT '';
