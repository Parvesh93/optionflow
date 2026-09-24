-- AlterTable
ALTER TABLE "Shop"
ADD COLUMN "pricingAddonProductGid" TEXT,
ADD COLUMN "pricingAddonVariantGid" TEXT,
ADD COLUMN "pricingCartTransformId" TEXT,
ADD COLUMN "pricingEnabledAt" TIMESTAMP(3);
