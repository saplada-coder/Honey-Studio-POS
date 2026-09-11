-- AlterTable: เพิ่มช่องรูปบิล/สลิป ให้บัญชีรับจ่าย (เก็บเป็น JSON array ของ URL)
ALTER TABLE "Transaction" ADD COLUMN     "slips" TEXT NOT NULL DEFAULT '';
