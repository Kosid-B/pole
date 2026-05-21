// @vitest-environment node

import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPrismaClient } from "@/lib/db";
import { getTask3DatabaseRuntime } from "@/lib/task3-database-path";
import { pushTask3Schema } from "@/lib/task3-prisma-push";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "../..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const prismaBin = resolve(projectRoot, "node_modules/.bin/prisma.cmd");
const runtime = getTask3DatabaseRuntime({
  fileName: `schema-smoke-${process.pid}.db`,
});

describe("schema smoke", () => {
  beforeAll(() => {
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
      throw new Error(result.stderr || result.stdout || "Prisma db push failed for schema smoke test.");
    }
  });

  afterAll(() => {
    rmSync(runtime.filePath, { force: true });
  });

  it("supports users and master-data relations", async () => {
    const prisma = createPrismaClient(runtime.databaseUrl);

    const userCount = await prisma.user.count();
    const teamTypeCount = await prisma.teamType.count();
    const costCategoryCount = await prisma.costCategory.count();
    const unitCount = await prisma.unitOfMeasure.count();
    const equipmentCount = await prisma.equipmentMaster.count();

    expect(userCount).toBeGreaterThanOrEqual(0);
    expect(teamTypeCount).toBeGreaterThanOrEqual(0);
    expect(costCategoryCount).toBeGreaterThanOrEqual(0);
    expect(unitCount).toBeGreaterThanOrEqual(0);
    expect(equipmentCount).toBeGreaterThanOrEqual(0);

    await prisma.$disconnect();
  });
});
