CREATE TABLE "StockTrash" (
 "id" TEXT NOT NULL,
 "sourceKey" TEXT,
 "kind" TEXT NOT NULL,
 "productId" TEXT NOT NULL DEFAULT '',
 "name" TEXT NOT NULL,
 "snapshot" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "restoredAt" TIMESTAMP(3),
 CONSTRAINT "StockTrash_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StockTrash_sourceKey_key" ON "StockTrash"("sourceKey");
CREATE INDEX "StockTrash_restoredAt_createdAt_idx" ON "StockTrash"("restoredAt", "createdAt");
