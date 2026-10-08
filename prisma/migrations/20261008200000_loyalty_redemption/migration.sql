ALTER TABLE "Rental" ADD COLUMN "paidAmount" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "rewardUsed" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "rewardValue" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "promotion" TEXT NOT NULL DEFAULT '',
 ADD COLUMN "loyaltyGroup" TEXT NOT NULL DEFAULT '';
UPDATE "Rental" SET "paidAmount"=fee WHERE "paymentStatus"='ชำระแล้ว';
ALTER TABLE "LoyaltyEntry" ADD COLUMN "rewardKey" TEXT;
UPDATE "LoyaltyEntry" SET "rewardKey"='earn:'||"rentalId";
ALTER TABLE "LoyaltyEntry" ALTER COLUMN "rewardKey" SET NOT NULL;
CREATE UNIQUE INDEX "LoyaltyEntry_rewardKey_key" ON "LoyaltyEntry"("rewardKey");
