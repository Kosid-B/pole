import { createPrismaClient } from "../src/lib/db";
import { costCategorySeed, equipmentSeed, seedUsers, teamTypeSeed, unitSeed } from "./seed-data";

const prisma = createPrismaClient();

async function main() {
  await seedUsers(prisma, "production");

  for (const teamType of teamTypeSeed) {
    await prisma.teamType.upsert({
      where: { code: teamType.code },
      update: {
        nameTh: teamType.nameTh,
        sortOrder: teamType.sortOrder,
        isActive: true,
      },
      create: teamType,
    });
  }

  for (const category of costCategorySeed) {
    await prisma.costCategory.upsert({
      where: { code: category.code },
      update: {
        nameTh: category.nameTh,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: category,
    });
  }

  for (const unit of unitSeed) {
    await prisma.unitOfMeasure.upsert({
      where: { code: unit.code },
      update: {
        nameTh: unit.nameTh,
        symbol: unit.symbol,
        sortOrder: unit.sortOrder,
        isActive: true,
      },
      create: unit,
    });
  }

  const machineUnit = await prisma.unitOfMeasure.findUniqueOrThrow({
    where: { code: "MACHINE" },
  });

  for (const equipment of equipmentSeed) {
    await prisma.equipmentMaster.upsert({
      where: { code: equipment.code },
      update: {
        nameTh: equipment.nameTh,
        defaultUnitId: machineUnit.id,
        isActive: true,
      },
      create: {
        code: equipment.code,
        nameTh: equipment.nameTh,
        defaultUnitId: machineUnit.id,
      },
    });
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
