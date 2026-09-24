-- CreateEnum
CREATE TYPE "OptionFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'RADIO', 'CHECKBOX');

-- CreateTable
CREATE TABLE "OptionField" (
    "id" TEXT NOT NULL,
    "optionSetId" TEXT NOT NULL,
    "type" "OptionFieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OptionField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionValue" (
    "id" TEXT NOT NULL,
    "optionFieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptionField_optionSetId_position_deletedAt_idx"
ON "OptionField"("optionSetId", "position", "deletedAt");

-- CreateIndex
CREATE INDEX "OptionValue_optionFieldId_position_deletedAt_idx"
ON "OptionValue"("optionFieldId", "position", "deletedAt");

-- AddForeignKey
ALTER TABLE "OptionField"
ADD CONSTRAINT "OptionField_optionSetId_fkey"
FOREIGN KEY ("optionSetId") REFERENCES "OptionSet"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionValue"
ADD CONSTRAINT "OptionValue_optionFieldId_fkey"
FOREIGN KEY ("optionFieldId") REFERENCES "OptionField"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
