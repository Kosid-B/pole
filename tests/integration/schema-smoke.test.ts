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

  it("creates a project with one area and one team", async () => {
    const prisma = createPrismaClient(runtime.databaseUrl);

    const created = await prisma.project.create({
      data: {
        name: "Pilot Project",
        contractValue: 1_000_000,
        areas: {
          create: [{ name: "Sisaket Cluster", province: "Sisaket" }],
        },
        teams: {
          create: [{ name: "Team A", leaderName: "Somchai", crewSize: 6 }],
        },
      },
      include: { areas: true, teams: true },
    });

    expect(created.areas).toHaveLength(1);
    expect(created.teams).toHaveLength(1);

    await prisma.project.delete({
      where: { id: created.id },
    });

    await prisma.$disconnect();
  });
});
