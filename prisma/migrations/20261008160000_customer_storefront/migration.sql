ALTER TABLE "Rental" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '', ADD COLUMN "online" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'รอชำระ', ADD COLUMN "paymentSlip" TEXT NOT NULL DEFAULT '';
CREATE INDEX "Rental_code_start_end_idx" ON "Rental"("code","start","end");
CREATE INDEX "Rental_userId_idx" ON "Rental"("userId");
CREATE TABLE "ShopSettings" ("id" TEXT NOT NULL DEFAULT 'main',"data" TEXT NOT NULL DEFAULT '{}',"updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id"));
CREATE TABLE "CustomerReview" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"rentalId" TEXT NOT NULL,"name" TEXT NOT NULL,"text" TEXT NOT NULL,"image" TEXT NOT NULL DEFAULT '',"consent" BOOLEAN NOT NULL DEFAULT false,"approved" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CustomerReview_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "CustomerReview_rentalId_key" ON "CustomerReview"("rentalId");
