import { createPrismaClient } from "../src/lib/db";
import { seedMasterData, seedUsers } from "./seed-data";

const prisma = createPrismaClient();

export async function seedDevelopmentData() {
  await prisma.importJob.deleteMany();
  await prisma.costEntry.deleteMany();
  await prisma.billingRecord.deleteMany();
  await prisma.fieldReportEquipment.deleteMany();
  await prisma.fieldReportMaterial.deleteMany();
  await prisma.fieldReport.deleteMany();
  await prisma.team.deleteMany();
  await prisma.projectArea.deleteMany();
  await prisma.project.deleteMany();
  await prisma.equipmentMaster.deleteMany();
  await prisma.unitOfMeasure.deleteMany();
  await prisma.costCategory.deleteMany();
  await prisma.teamType.deleteMany();
  await prisma.user.deleteMany();

  await seedUsers(prisma, "development");
  await seedMasterData(prisma);

  const installTeamType = await prisma.teamType.findUniqueOrThrow({
    where: { code: "INSTALL" },
  });
  const foundationTeamType = await prisma.teamType.findUniqueOrThrow({
    where: { code: "FOUNDATION" },
  });
  const inspectionTeamType = await prisma.teamType.findUniqueOrThrow({
    where: { code: "INSPECTION" },
  });
  const materialCategory = await prisma.costCategory.findUniqueOrThrow({
    where: { code: "MAT" },
  });
  const laborCategory = await prisma.costCategory.findUniqueOrThrow({
    where: { code: "LAB" },
  });
  const poleUnit = await prisma.unitOfMeasure.findUniqueOrThrow({
    where: { code: "POLE" },
  });
  const machineUnit = await prisma.unitOfMeasure.findUniqueOrThrow({
    where: { code: "MACHINE" },
  });
  const drill = await prisma.equipmentMaster.findUniqueOrThrow({
    where: { code: "DRILL" },
  });

  await prisma.project.create({
    data: {
      name: "90,000 Pole Rollout",
      customerName: "Tech Solution AI",
      contractValue: "150000000.00",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-12-31"),
      targetUnits: 90000,
      status: "ACTIVE",
      areas: {
        create: [
          {
            name: "Sisaket Hub",
            province: "Sisaket",
            district: "Mueang Sisaket",
            cluster: "Lower Northeast A",
            targetUnits: 32000,
          },
          {
            name: "Nakhon Ratchasima Hub",
            province: "Nakhon Ratchasima",
            district: "Mueang Nakhon Ratchasima",
            cluster: "Lower Northeast B",
            targetUnits: 30000,
          },
          {
            name: "Ubon Ratchathani Hub",
            province: "Ubon Ratchathani",
            district: "Warin Chamrap",
            cluster: "Eastern Northeast",
            targetUnits: 28000,
          },
        ],
      },
      teams: {
        create: [
          {
            name: "Field Team Alpha",
            leaderName: "Prasit",
            crewSize: 8,
            specialization: "Smart pole install",
            teamTypeId: installTeamType.id,
          },
          {
            name: "Field Team Bravo",
            leaderName: "Somchai",
            crewSize: 7,
            specialization: "Foundation and rigging",
            teamTypeId: foundationTeamType.id,
          },
          {
            name: "Field Team Charlie",
            leaderName: "Anong",
            crewSize: 6,
            specialization: "Inspection and closeout",
            teamTypeId: inspectionTeamType.id,
          },
        ],
      },
      billingRecords: {
        create: [
          {
            workPackage: "January cluster rollout",
            billedValue: "18500000.00",
            billingDate: new Date("2026-02-05"),
            expectedPaymentDate: new Date("2026-02-28"),
            isDocumentComplete: true,
          },
        ],
      },
      costEntries: {
        create: [
          {
            category: materialCategory.nameTh,
            costCategoryId: materialCategory.id,
            description: "Concrete poles and anchors",
            amount: "12000000.00",
            entryDate: new Date("2026-02-03"),
            valueType: "ACTUAL",
          },
          {
            category: laborCategory.nameTh,
            costCategoryId: laborCategory.id,
            description: "Crew payroll mobilization",
            amount: "3200000.00",
            entryDate: new Date("2026-02-04"),
            valueType: "ESTIMATED",
          },
        ],
      },
    },
  });

  const project = await prisma.project.findFirstOrThrow({
    include: {
      areas: true,
      teams: true,
    },
  });

  await prisma.fieldReport.create({
    data: {
      projectId: project.id,
      areaId: project.areas[0].id,
      teamId: project.teams[0].id,
      reportDate: new Date("2026-05-20"),
      completedUnits: 16,
      manpowerCount: 8,
      issues: "Temporary access delay.",
      materials: {
        create: [
          {
            name: "Concrete pole",
            quantity: 16,
            unit: poleUnit.symbol,
            unitId: poleUnit.id,
          },
        ],
      },
      equipment: {
        create: [
          {
            name: drill.nameTh,
            quantity: 1,
            unit: machineUnit.nameTh,
            unitId: machineUnit.id,
            equipmentMasterId: drill.id,
          },
          {
            name: "Custom lift",
            quantity: 1,
            unit: machineUnit.nameTh,
            unitId: machineUnit.id,
          },
        ],
      },
    },
  });

  await prisma.importJob.create({
    data: {
      fileName: "budget-cluster-a.xlsx",
      sourceType: "SPREADSHEET",
      uploadedByRole: "ADMIN",
      status: "NEEDS_REVIEW",
    },
  });
}

async function main() {
  await seedDevelopmentData();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
