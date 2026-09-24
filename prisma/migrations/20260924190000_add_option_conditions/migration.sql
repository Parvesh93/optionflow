-- CreateEnum
CREATE TYPE "ConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'IS_CHECKED', 'IS_NOT_CHECKED');

-- CreateTable
CREATE TABLE "OptionCondition" (
    "id" TEXT NOT NULL,
    "targetFieldId" TEXT NOT NULL,
    "sourceFieldId" TEXT NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "expectedValue" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OptionCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptionCondition_targetFieldId_position_deletedAt_idx"
ON "OptionCondition"("targetFieldId", "position", "deletedAt");

-- CreateIndex
CREATE INDEX "OptionCondition_sourceFieldId_deletedAt_idx"
ON "OptionCondition"("sourceFieldId", "deletedAt");

-- AddForeignKey
ALTER TABLE "OptionCondition"
ADD CONSTRAINT "OptionCondition_targetFieldId_fkey"
FOREIGN KEY ("targetFieldId") REFERENCES "OptionField"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionCondition"
ADD CONSTRAINT "OptionCondition_sourceFieldId_fkey"
FOREIGN KEY ("sourceFieldId") REFERENCES "OptionField"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
