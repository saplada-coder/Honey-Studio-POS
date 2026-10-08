CREATE TABLE "LoyaltyEntry" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "rentalId" TEXT NOT NULL,
 "points" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LoyaltyEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LoyaltyEntry_rentalId_key" ON "LoyaltyEntry"("rentalId");
CREATE INDEX "LoyaltyEntry_userId_idx" ON "LoyaltyEntry"("userId");
CREATE TABLE "NotificationRead" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "key" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationRead_userId_key_key" ON "NotificationRead"("userId", "key");
