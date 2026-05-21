-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FinanceValueType" AS ENUM ('ESTIMATED', 'ACTUAL');

-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('SPREADSHEET', 'PDF');

-- CreateEnum
CREATE TYPE "UploadedByRole" AS ENUM ('EXECUTIVE', 'ADMIN', 'FIELD_LEADER');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('NEEDS_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerName" TEXT,
    "contractValue" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetUnits" INTEGER NOT NULL DEFAULT 0,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectArea" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT,
    "cluster" TEXT,
    "targetUnits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaderName" TEXT NOT NULL,
    "crewSize" INTEGER NOT NULL,
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldReport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "completedUnits" INTEGER NOT NULL DEFAULT 0,
    "manpowerCount" INTEGER NOT NULL DEFAULT 0,
    "issues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldReportMaterial" (
    "id" TEXT NOT NULL,
    "fieldReportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldReportMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldReportEquipment" (
    "id" TEXT NOT NULL,
    "fieldReportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldReportEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workPackage" TEXT NOT NULL,
    "billedValue" DECIMAL(65,30) NOT NULL,
    "billingDate" TIMESTAMP(3) NOT NULL,
    "expectedPaymentDate" TIMESTAMP(3) NOT NULL,
    "isDocumentComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "valueType" "FinanceValueType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sourceType" "ImportSourceType" NOT NULL,
    "uploadedByRole" "UploadedByRole" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "ProjectArea_projectId_idx" ON "ProjectArea"("projectId");

-- CreateIndex
CREATE INDEX "Team_projectId_idx" ON "Team"("projectId");

-- CreateIndex
CREATE INDEX "FieldReport_projectId_idx" ON "FieldReport"("projectId");

-- CreateIndex
CREATE INDEX "FieldReport_areaId_idx" ON "FieldReport"("areaId");

-- CreateIndex
CREATE INDEX "FieldReport_teamId_idx" ON "FieldReport"("teamId");

-- CreateIndex
CREATE INDEX "FieldReport_reportDate_idx" ON "FieldReport"("reportDate");

-- CreateIndex
CREATE INDEX "FieldReportMaterial_fieldReportId_idx" ON "FieldReportMaterial"("fieldReportId");

-- CreateIndex
CREATE INDEX "FieldReportEquipment_fieldReportId_idx" ON "FieldReportEquipment"("fieldReportId");

-- CreateIndex
CREATE INDEX "BillingRecord_projectId_idx" ON "BillingRecord"("projectId");

-- CreateIndex
CREATE INDEX "BillingRecord_billingDate_idx" ON "BillingRecord"("billingDate");

-- CreateIndex
CREATE INDEX "CostEntry_projectId_idx" ON "CostEntry"("projectId");

-- CreateIndex
CREATE INDEX "CostEntry_entryDate_idx" ON "CostEntry"("entryDate");

-- CreateIndex
CREATE INDEX "CostEntry_valueType_idx" ON "CostEntry"("valueType");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_sourceType_idx" ON "ImportJob"("sourceType");

-- AddForeignKey
ALTER TABLE "ProjectArea" ADD CONSTRAINT "ProjectArea_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReport" ADD CONSTRAINT "FieldReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReport" ADD CONSTRAINT "FieldReport_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "ProjectArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReport" ADD CONSTRAINT "FieldReport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReportMaterial" ADD CONSTRAINT "FieldReportMaterial_fieldReportId_fkey" FOREIGN KEY ("fieldReportId") REFERENCES "FieldReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReportEquipment" ADD CONSTRAINT "FieldReportEquipment_fieldReportId_fkey" FOREIGN KEY ("fieldReportId") REFERENCES "FieldReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostEntry" ADD CONSTRAINT "CostEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
