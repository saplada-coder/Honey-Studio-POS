-- AlterTable: ให้ยอดเงินในบัญชีใส่สตางค์ได้ (เดิมเป็นจำนวนเต็มบาท ทำให้ 9,982.97 กลายเป็น 9,983)
ALTER TABLE "Transaction" ALTER COLUMN "amt" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "AdvanceRepayment" ALTER COLUMN "amt" SET DATA TYPE DOUBLE PRECISION;
