// @vitest-environment node

import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pushTask3Schema } from "@/lib/task3-prisma-push";
import { getTask3DatabaseRuntime } from "@/lib/task3-database-path";
import { createPrismaClient } from "@/lib/db";
import { createBillingRecord, createCostEntry } from "@/server/actions/finance";
import { createProject } from "@/server/actions/projects";
import { seedMasterData } from "../../prisma/seed-data";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "../..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const prismaBin = resolve(projectRoot, "node_modules/.bin/prisma.cmd");
const runtime = getTask3DatabaseRuntime({
  fileName: `finance-actions-${process.pid}.db`,
});

describe("finance actions", () => {
  beforeAll(async () => {
    rmSync(runtime.filePath, { force: true });

    const result = pushTask3Schema({
      cliDatabaseUrl: runtime.cliDatabaseUrl,
      cwd: runtime.directory,
      filePath: runtime.filePath,
      prismaBin,
      schemaPath,
      skipGenerate: true,
    });

    if (result.status !== 0) {
      throw new Error(
        result.stderr ||
          result.stdout ||
          "Prisma db push failed for finance action test.",
      );
    }

    const prisma = createPrismaClient(runtime.databaseUrl);
    await seedMasterData(prisma);
    await prisma.$disconnect();
  });

  afterAll(() => {
    rmSync(runtime.filePath, { force: true });
  });

  it("creates a billing record and a cost entry for one project", async () => {
    const prisma = createPrismaClient(runtime.databaseUrl);
    const materialCategory = await prisma.costCategory.findUniqueOrThrow({
      where: { code: "MAT" },
    });

    const project = await createProject(
      {
        name: "Southern Corridor",
        contractValue: 12_400_000,
        targetUnits: 2_400,
        initialArea: {
          name: "Hat Yai Sector",
          province: "Songkhla",
          targetUnits: 1_000,
        },
      },
      runtime.databaseUrl,
    );

    const billingRecord = await createBillingRecord(
      {
        projectId: project.id,
        workPackage: "Milestone 1 foundation package",
        billedValue: 3_250_000,
        billingDate: "2026-05-21",
        expectedPaymentDate: "2026-06-20",
        isDocumentComplete: true,
      },
      runtime.databaseUrl,
    );

    const costEntry = await createCostEntry(
      {
        projectId: project.id,
        costCategoryId: materialCategory.id,
        description: "Concrete and rebar purchase",
        amount: 845_000,
        entryDate: "2026-05-21",
        valueType: "ACTUAL",
      },
      runtime.databaseUrl,
    );

    expect(billingRecord.projectId).toBe(project.id);
    expect(billingRecord.workPackage).toBe("Milestone 1 foundation package");
    expect(billingRecord.billedValue).toBe(3_250_000);
    expect(billingRecord.isDocumentComplete).toBe(true);

    expect(costEntry.projectId).toBe(project.id);
    expect(costEntry.category).toBe("วัสดุ");
    expect(costEntry.amount).toBe(845_000);
    expect(costEntry.valueType).toBe("ACTUAL");
    expect(costEntry.costCategory?.code).toBe("MAT");

    await prisma.$disconnect();
  });
});
