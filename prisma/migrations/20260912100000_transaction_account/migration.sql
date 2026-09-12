-- AlterTable: เพิ่มช่องเลขบัญชี/พร้อมเพย์ปลายทาง ให้บัญชีรับจ่าย
ALTER TABLE "Transaction" ADD COLUMN     "account" TEXT NOT NULL DEFAULT '';
