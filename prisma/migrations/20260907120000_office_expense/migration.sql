-- CreateTable: ค่าใช้จ่ายสำนักงาน (มีขั้นตอนอนุมัติ)
CREATE TABLE "OfficeExpense" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL DEFAULT '',
    "cat" TEXT NOT NULL DEFAULT 'อื่นๆ',
    "desc" TEXT NOT NULL,
    "payee" TEXT NOT NULL DEFAULT '',
    "amt" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'รออนุมัติ',
    "approvedBy" TEXT NOT NULL DEFAULT '',
    "approvedAt" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeExpense_pkey" PRIMARY KEY ("id")
);
