-- CreateEnum
CREATE TYPE "PriceAdjustmentType" AS ENUM ('NONE', 'FIXED', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "OptionField"
ADD COLUMN "priceAdjustmentType" "PriceAdjustmentType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "priceAdjustmentValue" DECIMAL(12,4);

-- AlterTable
ALTER TABLE "OptionValue"
ADD COLUMN "priceAdjustmentType" "PriceAdjustmentType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "priceAdjustmentValue" DECIMAL(12,4);
