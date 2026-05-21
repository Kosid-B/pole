// @vitest-environment node

import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pushTask3Schema } from "@/lib/task3-prisma-push";
import { getTask3DatabaseRuntime } from "@/lib/task3-database-path";
import { markImportForReview } from "@/server/actions/imports";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, "../..");
const schemaPath = resolve(projectRoot, "prisma/schema.prisma");
const prismaBin = resolve(projectRoot, "node_modules/.bin/prisma.cmd");
const runtime = getTask3DatabaseRuntime({
  fileName: `imports-actions-${process.pid}.db`,
});

describe("markImportForReview", () => {
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
          "Prisma db push failed for imports action test.",
      );
    }
  });

  afterAll(() => {
    rmSync(runtime.filePath, { force: true });
  });

  it("creates an import job with NEEDS_REVIEW status", async () => {
    const importJob = await markImportForReview(
      {
        fileName: "daily-progress.xlsx",
        sourceType: "SPREADSHEET",
        uploadedByRole: "ADMIN",
      },
      runtime.databaseUrl,
    );

    expect(importJob.fileName).toBe("daily-progress.xlsx");
    expect(importJob.sourceType).toBe("SPREADSHEET");
    expect(importJob.uploadedByRole).toBe("ADMIN");
    expect(importJob.status).toBe("NEEDS_REVIEW");
  });
});
