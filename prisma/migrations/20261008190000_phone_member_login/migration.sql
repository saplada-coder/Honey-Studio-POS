ALTER TABLE "User" ADD COLUMN "phone" TEXT;
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE TABLE "MemberLoginLimit" (
 "key" TEXT NOT NULL, "attempts" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "MemberLoginLimit_pkey" PRIMARY KEY ("key")
);
