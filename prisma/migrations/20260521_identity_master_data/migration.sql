-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UploadedByRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TeamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitOfMeasure" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitOfMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentMaster" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "defaultUnitId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentMaster_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "teamTypeId" TEXT;

-- AlterTable
ALTER TABLE "CostEntry" ADD COLUMN "costCategoryId" TEXT;

-- AlterTable
ALTER TABLE "FieldReportMaterial" ADD COLUMN "unitId" TEXT;

-- AlterTable
ALTER TABLE "FieldReportEquipment" ADD COLUMN "equipmentMasterId" TEXT,
ADD COLUMN "unitId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamType_code_key" ON "TeamType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CostCategory_code_key" ON "CostCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasure_code_key" ON "UnitOfMeasure"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentMaster_code_key" ON "EquipmentMaster"("code");

-- CreateIndex
CREATE INDEX "Team_teamTypeId_idx" ON "Team"("teamTypeId");

-- CreateIndex
CREATE INDEX "CostEntry_costCategoryId_idx" ON "CostEntry"("costCategoryId");

-- CreateIndex
CREATE INDEX "FieldReportMaterial_unitId_idx" ON "FieldReportMaterial"("unitId");

-- CreateIndex
CREATE INDEX "FieldReportEquipment_equipmentMasterId_idx" ON "FieldReportEquipment"("equipmentMasterId");

-- CreateIndex
CREATE INDEX "FieldReportEquipment_unitId_idx" ON "FieldReportEquipment"("unitId");

-- CreateIndex
CREATE INDEX "EquipmentMaster_defaultUnitId_idx" ON "EquipmentMaster"("defaultUnitId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamTypeId_fkey" FOREIGN KEY ("teamTypeId") REFERENCES "TeamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostEntry" ADD CONSTRAINT "CostEntry_costCategoryId_fkey" FOREIGN KEY ("costCategoryId") REFERENCES "CostCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReportMaterial" ADD CONSTRAINT "FieldReportMaterial_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReportEquipment" ADD CONSTRAINT "FieldReportEquipment_equipmentMasterId_fkey" FOREIGN KEY ("equipmentMasterId") REFERENCES "EquipmentMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReportEquipment" ADD CONSTRAINT "FieldReportEquipment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentMaster" ADD CONSTRAINT "EquipmentMaster_defaultUnitId_fkey" FOREIGN KEY ("defaultUnitId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
