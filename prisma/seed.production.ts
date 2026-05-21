import { createPrismaClient } from "../src/lib/db";

const prisma = createPrismaClient();

async function main() {
  console.log(
    "Production seed is intentionally conservative. Add explicit bootstrap data here when you are ready for live setup.",
  );

  if (process.env.ALLOW_PRODUCTION_SAMPLE_SEED === "true") {
    const existingProject = await prisma.project.findFirst({
      where: {
        name: "90,000 Pole Rollout",
      },
      select: {
        id: true,
      },
    });

    if (!existingProject) {
      await prisma.project.create({
        data: {
          name: "90,000 Pole Rollout",
          customerName: "Tech Solution AI",
          contractValue: "150000000.00",
          startDate: new Date("2026-01-15"),
          endDate: new Date("2026-12-31"),
          targetUnits: 90000,
          status: "ACTIVE",
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
