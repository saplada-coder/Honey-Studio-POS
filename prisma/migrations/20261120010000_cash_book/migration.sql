CREATE TABLE "CashEntry" (
  "id" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amt" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CashEntry_positive_amount" CHECK ("amt" > 0),
  CONSTRAINT "CashEntry_type" CHECK ("type" IN ('in', 'out'))
);
