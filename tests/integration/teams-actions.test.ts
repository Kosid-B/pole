// @vitest-environment node

import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pushTask3Schema } from "@/lib/task3-prisma-push";
import { getTask3DatabaseRuntime } from "@/lib/task3-database-path";
import { createProject } from "@/server/actions/projects";
import { createTeam } from "@/server/actions/teams";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "../..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const prismaBin = resolve(projectRoot, "node_modules/.bin/prisma.cmd");
const runtime = getTask3DatabaseRuntime({
  fileName: `teams-actions-${process.pid}.db`,
});

describe("createTeam", () => {
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
          "Prisma db push failed for teams action test.",
      );
    }
  });

  afterAll(() => {
    rmSync(runtime.filePath, { force: true });
  });

  it("creates a team attached to a project", async () => {
    const project = await createProject(
      {
        name: "Northern Expansion",
        contractValue: 7_500_000,
        targetUnits: 1_500,
        initialArea: {
          name: "Chiang Rai Cluster",
          province: "Chiang Rai",
          targetUnits: 800,
        },
      },
      runtime.databaseUrl,
    );

    const team = await createTeam(
      {
        projectId: project.id,
        name: "Tower Crew Alpha",
        leaderName: "Anan S.",
        crewSize: 8,
        specialization: "Pole installation",
      },
      runtime.databaseUrl,
    );

    expect(team.projectId).toBe(project.id);
    expect(team.name).toBe("Tower Crew Alpha");
    expect(team.leaderName).toBe("Anan S.");
    expect(team.crewSize).toBe(8);
    expect(team.specialization).toBe("Pole installation");
  });
});
