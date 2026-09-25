-- CreateTable: บันทึกการโอนคืนเงินสำรองจ่ายให้พนักงาน (โอนเป็นก้อน ครอบคลุมหลายรายการ)
CREATE TABLE "AdvanceRepayment" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL DEFAULT '',
    "person" TEXT NOT NULL DEFAULT '',
    "amt" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "slips" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvanceRepayment_pkey" PRIMARY KEY ("id")
);
