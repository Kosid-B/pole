// @vitest-environment node

import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pushTask3Schema } from "@/lib/task3-prisma-push";
import { getTask3DatabaseRuntime } from "@/lib/task3-database-path";
import { createProject } from "@/server/actions/projects";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "../..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const prismaBin = resolve(projectRoot, "node_modules/.bin/prisma.cmd");
const runtime = getTask3DatabaseRuntime({
  fileName: `projects-actions-${process.pid}.db`,
});

describe("createProject", () => {
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
      throw new Error(
        result.stderr ||
          result.stdout ||
          "Prisma db push failed for projects action test.",
      );
    }
  });

  afterAll(() => {
    rmSync(runtime.filePath, { force: true });
  });

  it("creates a project with one initial area", async () => {
    const result = await createProject(
      {
        name: "Project East",
        contractValue: 5_000_000,
        targetUnits: 1_200,
        initialArea: {
          name: "Zone A",
          province: "Ubon Ratchathani",
          targetUnits: 600,
        },
      },
      runtime.databaseUrl,
    );

    expect(result.name).toBe("Project East");
    expect(result.areas).toHaveLength(1);
    expect(result.areas[0].province).toBe("Ubon Ratchathani");
  });
});
