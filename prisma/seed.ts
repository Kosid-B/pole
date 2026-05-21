import { ProjectStatus } from "@prisma/client";
import { createPrismaClient } from "../src/lib/db";

const prisma = createPrismaClient();

async function main() {
  await prisma.importJob.deleteMany();
  await prisma.costEntry.deleteMany();
  await prisma.billingRecord.deleteMany();
  await prisma.fieldReportEquipment.deleteMany();
  await prisma.fieldReportMaterial.deleteMany();
  await prisma.fieldReport.deleteMany();
  await prisma.team.deleteMany();
  await prisma.projectArea.deleteMany();
  await prisma.project.deleteMany();

  await prisma.project.create({
    data: {
      name: "90,000 Pole Rollout",
      customerName: "Tech Solution AI",
      contractValue: "150000000.00",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-12-31"),
      targetUnits: 90000,
      status: ProjectStatus.ACTIVE,
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
          },
          {
            name: "Field Team Bravo",
            leaderName: "Somchai",
            crewSize: 7,
            specialization: "Foundation and rigging",
          },
          {
            name: "Field Team Charlie",
            leaderName: "Anong",
            crewSize: 6,
            specialization: "Inspection and closeout",
          },
        ],
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
