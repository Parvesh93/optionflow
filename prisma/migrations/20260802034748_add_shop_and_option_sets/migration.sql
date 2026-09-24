-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('ACTIVE', 'FROZEN', 'SUSPENDED', 'UNINSTALLED');

-- CreateEnum
CREATE TYPE "OptionSetStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "shopifyDomain" TEXT NOT NULL,
    "shopifyShopGid" TEXT,
    "name" TEXT,
    "email" TEXT,
    "currencyCode" TEXT,
    "timezone" TEXT,
    "status" "ShopStatus" NOT NULL DEFAULT 'ACTIVE',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionSet" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "description" TEXT,
    "internalNote" TEXT,
    "status" "OptionSetStatus" NOT NULL DEFAULT 'DRAFT',
    "displayTitle" TEXT,
    "tags" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "publishedRevision" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OptionSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopifyDomain_key" ON "Shop"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopifyShopGid_key" ON "Shop"("shopifyShopGid");

-- CreateIndex
CREATE INDEX "Shop_status_idx" ON "Shop"("status");

-- CreateIndex
CREATE INDEX "Shop_deletedAt_idx" ON "Shop"("deletedAt");

-- CreateIndex
CREATE INDEX "OptionSet_shopId_status_deletedAt_idx" ON "OptionSet"("shopId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "OptionSet_shopId_updatedAt_idx" ON "OptionSet"("shopId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OptionSet_shopId_handle_key" ON "OptionSet"("shopId", "handle");

-- CreateIndex
CREATE INDEX "Session_shop_idx" ON "Session"("shop");

-- AddForeignKey
ALTER TABLE "OptionSet" ADD CONSTRAINT "OptionSet_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
