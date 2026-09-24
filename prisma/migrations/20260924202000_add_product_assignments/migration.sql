-- CreateTable
CREATE TABLE "ProductAssignment" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "optionSetId" TEXT NOT NULL,
    "productGid" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "productImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductAssignment_shopId_productGid_key"
ON "ProductAssignment"("shopId", "productGid");

-- CreateIndex
CREATE INDEX "ProductAssignment_optionSetId_idx"
ON "ProductAssignment"("optionSetId");

-- CreateIndex
CREATE INDEX "ProductAssignment_shopId_optionSetId_idx"
ON "ProductAssignment"("shopId", "optionSetId");

-- AddForeignKey
ALTER TABLE "ProductAssignment"
ADD CONSTRAINT "ProductAssignment_shopId_fkey"
FOREIGN KEY ("shopId") REFERENCES "Shop"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAssignment"
ADD CONSTRAINT "ProductAssignment_optionSetId_fkey"
FOREIGN KEY ("optionSetId") REFERENCES "OptionSet"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
