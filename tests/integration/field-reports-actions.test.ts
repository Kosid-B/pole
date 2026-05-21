// @vitest-environment node

import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pushTask3Schema } from "@/lib/task3-prisma-push";
import { getTask3DatabaseRuntime } from "@/lib/task3-database-path";
import { createFieldReport } from "@/server/actions/field-reports";
import { createProject } from "@/server/actions/projects";
import { createTeam } from "@/server/actions/teams";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "../..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const prismaBin = resolve(projectRoot, "node_modules/.bin/prisma.cmd");
const runtime = getTask3DatabaseRuntime({
  fileName: `field-reports-actions-${process.pid}.db`,
});

describe("createFieldReport", () => {
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
          "Prisma db push failed for field reports action test.",
      );
    }
  });

  afterAll(() => {
    rmSync(runtime.filePath, { force: true });
  });

  it("creates a report with one material and one equipment entry", async () => {
    const project = await createProject(
      {
        name: "Eastern Grid",
        contractValue: 9_250_000,
        targetUnits: 2_100,
        initialArea: {
          name: "Rayong Sector",
          province: "Rayong",
          targetUnits: 900,
        },
      },
      runtime.databaseUrl,
    );

    const team = await createTeam(
      {
        projectId: project.id,
        name: "Crew Delta",
        leaderName: "Narin P.",
        crewSize: 7,
        specialization: "Installation",
      },
      runtime.databaseUrl,
    );

    const report = await createFieldReport(
      {
        projectId: project.id,
        areaId: project.areas[0].id,
        teamId: team.id,
        reportDate: "2026-05-21",
        completedUnits: 18,
        manpowerCount: 9,
        issues: "Soft ground near access road.",
        materials: [
          {
            name: "Concrete pole",
            quantity: 18,
            unit: "pcs",
          },
        ],
        equipment: [
          {
            name: "Boom truck",
            quantity: 1,
            unit: "unit",
          },
        ],
      },
      runtime.databaseUrl,
    );

    expect(report.projectId).toBe(project.id);
    expect(report.areaId).toBe(project.areas[0].id);
    expect(report.teamId).toBe(team.id);
    expect(report.completedUnits).toBe(18);
    expect(report.materials).toHaveLength(1);
    expect(report.materials[0].name).toBe("Concrete pole");
    expect(report.equipment).toHaveLength(1);
    expect(report.equipment[0].name).toBe("Boom truck");
  });
});
