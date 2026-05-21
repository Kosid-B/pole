// @vitest-environment node

import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getTask3DatabaseRuntime } from "@/lib/task3-database-path";
import { pushTask3Schema } from "@/lib/task3-prisma-push";
import { getDashboardSummary } from "@/lib/dashboard/get-dashboard-summary";
import { createFieldReport } from "@/server/actions/field-reports";
import { createBillingRecord, createCostEntry } from "@/server/actions/finance";
import { markImportForReview } from "@/server/actions/imports";
import { createProject } from "@/server/actions/projects";
import { createTeam } from "@/server/actions/teams";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "../..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const prismaBin = resolve(projectRoot, "node_modules/.bin/prisma.cmd");
const runtime = getTask3DatabaseRuntime({
  fileName: `dashboard-summary-${process.pid}.db`,
});

describe("getDashboardSummary", () => {
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
          "Prisma db push failed for dashboard summary test.",
      );
    }
  });

  afterAll(() => {
    try {
      rmSync(runtime.filePath, { force: true });
    } catch {
      // SQLite can briefly hold a handle on Windows after the test completes.
    }
  });

  it("returns progress and finance totals including actual versus estimated values", async () => {
    const project = await createProject(
      {
        name: "Western Backbone",
        contractValue: 10_000_000,
        targetUnits: 2_000,
        initialArea: {
          name: "Kanchanaburi Hub",
          province: "Kanchanaburi",
          targetUnits: 1_200,
        },
      },
      runtime.databaseUrl,
    );

    const team = await createTeam(
      {
        projectId: project.id,
        name: "Crew Echo",
        leaderName: "Suda P.",
        crewSize: 6,
        specialization: "Backbone installation",
      },
      runtime.databaseUrl,
    );

    await createFieldReport(
      {
        projectId: project.id,
        areaId: project.areas[0].id,
        teamId: team.id,
        reportDate: "2026-05-21",
        completedUnits: 125,
        manpowerCount: 7,
        issues: "Bridge access requires permit clearance.",
        materials: [
          {
            name: "Concrete pole",
            quantity: 125,
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

    await createBillingRecord(
      {
        projectId: project.id,
        workPackage: "Backbone phase 1",
        billedValue: 2_750_000,
        billingDate: "2026-05-21",
        expectedPaymentDate: "2026-06-20",
        isDocumentComplete: false,
      },
      runtime.databaseUrl,
    );

    await createCostEntry(
      {
        projectId: project.id,
        category: "Materials",
        description: "Estimated concrete demand",
        amount: 600_000,
        entryDate: "2026-05-21",
        valueType: "ESTIMATED",
      },
      runtime.databaseUrl,
    );

    await createCostEntry(
      {
        projectId: project.id,
        category: "Logistics",
        description: "Actual transport spend",
        amount: 425_000,
        entryDate: "2026-05-21",
        valueType: "ACTUAL",
      },
      runtime.databaseUrl,
    );

    await markImportForReview(
      {
        fileName: "backbone-progress.pdf",
        sourceType: "PDF",
        uploadedByRole: "ADMIN",
      },
      runtime.databaseUrl,
    );

    const summary = await getDashboardSummary(runtime.databaseUrl);

    expect(summary.progress.totalProjects).toBe(1);
    expect(summary.progress.totalTargetUnits).toBe(2_000);
    expect(summary.progress.completedUnits).toBe(125);
    expect(summary.progress.completionRate).toBeCloseTo(6.25, 2);

    expect(summary.finance.totalContractValue).toBe(10_000_000);
    expect(summary.finance.totalBilledValue).toBe(2_750_000);
    expect(summary.finance.actualCostValue).toBe(425_000);
    expect(summary.finance.estimatedCostValue).toBe(600_000);

    expect(summary.projectHealth).toHaveLength(1);
    expect(summary.projectHealth[0].projectName).toBe("Western Backbone");
    expect(summary.projectHealth[0].latestIssue).toBe(
      "Bridge access requires permit clearance.",
    );
  });
});
