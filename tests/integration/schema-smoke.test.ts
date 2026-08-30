// @vitest-environment node

import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createPrismaClient } from "@/lib/db";
import { getTask3DatabaseRuntime } from "@/lib/task3-database-path";
import { pushTask3Schema } from "@/lib/task3-prisma-push";
import { seedMasterData, seedUsers } from "../../prisma/seed-data";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "../..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const prismaBin = resolve(projectRoot, "node_modules/.bin/prisma.cmd");
const runtime = getTask3DatabaseRuntime({
  fileName: `schema-smoke-${process.pid}.db`,
});

describe("schema smoke", () => {
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
      throw new Error(result.stderr || result.stdout || "Prisma db push failed for schema smoke test.");
    }

    const prisma = createPrismaClient(runtime.databaseUrl);
    await seedUsers(prisma, "development");
    await seedMasterData(prisma);
    await prisma.$disconnect();
  });

  afterAll(() => {
    rmSync(runtime.filePath, { force: true });
  });

  it("supports users and master-data relations", async () => {
    const prisma = createPrismaClient(runtime.databaseUrl);

    const admin = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });
    const teamTypes = await prisma.teamType.findMany({
      orderBy: { sortOrder: "asc" },
    });
    const costCategories = await prisma.costCategory.findMany({
      orderBy: { sortOrder: "asc" },
    });
    const equipment = await prisma.equipmentMaster.findMany({
      orderBy: { code: "asc" },
    });

    expect(admin?.role).toBe("ADMIN");
    expect(teamTypes.map((item) => item.code)).toEqual([
      "INSTALL",
      "FOUNDATION",
      "INSPECTION",
      "TRANSPORT",
    ]);
    expect(costCategories.map((item) => item.code)).toEqual([
      "MAT",
      "LAB",
      "EQP",
      "TRN",
      "OTH",
    ]);
    expect(equipment.map((item) => item.code)).toEqual(["DRILL", "GENSET"]);

    await prisma.$disconnect();
  });
});
