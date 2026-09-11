-- AlterTable: เพิ่มช่องผู้เบิก / ผู้โอน / ชื่อบัญชีปลายทาง ให้บัญชีรับจ่าย
ALTER TABLE "Transaction" ADD COLUMN     "payer" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sender" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "payee" TEXT NOT NULL DEFAULT '';
