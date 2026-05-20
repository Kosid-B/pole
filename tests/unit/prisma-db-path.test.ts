import { tmpdir } from "node:os";
import { createPrismaClient } from "@/lib/db";
import {
  getTask3DatabaseDirectory,
  getTask3DatabaseRuntime,
  getTask3DatabaseUrl,
  resolveTask3DatabaseUrl,
} from "@/lib/task3-database-path";

describe("Task 3 database path", () => {
  it("resolves the default runtime to a safe absolute ASCII SQLite URL", () => {
    const runtime = getTask3DatabaseRuntime();

    expect(runtime.directory).toContain("project-management-saas-data");
    expect(runtime.directory).not.toContain("เสาไฟฟ้า");
    expect(runtime.databaseUrl).toBe(getTask3DatabaseUrl());
    expect(runtime.databaseUrl).not.toContain("file:./");
    expect(runtime.filePath).toContain("project-management-saas-data");
    expect(runtime.filePath).toContain("dev.db");
  });

  it("normalizes relative sqlite urls without mutating cwd", () => {
    const startingCwd = process.cwd();
    const resolvedUrl = resolveTask3DatabaseUrl("file:./dev.db");
    const runtime = getTask3DatabaseRuntime({ databaseUrl: "file:./dev.db" });

    expect(resolvedUrl).toBe(getTask3DatabaseUrl());
    expect(runtime.directory).toBe(getTask3DatabaseDirectory());
    expect(process.cwd()).toBe(startingCwd);
  });

  it("builds Prisma clients with the safe absolute runtime URL by default", () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL = "file:./dev.db";

      const prisma = createPrismaClient();
      const datasourceUrl = (prisma as unknown as {
        _engineConfig?: {
          overrideDatasources?: {
            db?: {
              url?: string;
            };
          };
        };
      })._engineConfig?.overrideDatasources?.db?.url;

      expect(datasourceUrl).toBe(getTask3DatabaseUrl());
    } finally {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("keeps runtime and cli urls aligned to the same file under custom env settings", () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalDatabaseDirectory = process.env.TASK3_DATABASE_DIRECTORY;
    const tempRoot = tmpdir().replace(/\\/g, "/");

    try {
      process.env.TASK3_DATABASE_DIRECTORY = `${tempRoot}/cli-db-root`;
      process.env.DATABASE_URL = `file:${tempRoot}/runtime-db-root/seed.sqlite`;

      const runtime = getTask3DatabaseRuntime();

      expect(runtime.databaseUrl).toBe(`file:${tempRoot}/runtime-db-root/seed.sqlite`);
      expect(runtime.filePath).toBe(`${tmpdir()}\\runtime-db-root\\seed.sqlite`);
      expect(runtime.cliDatabaseUrl).toBe("file:./seed.sqlite");
      expect(runtime.directory).toBe(`${tmpdir()}\\runtime-db-root`);
    } finally {
      process.env.DATABASE_URL = originalDatabaseUrl;
      process.env.TASK3_DATABASE_DIRECTORY = originalDatabaseDirectory;
    }
  });

  it("fails fast for explicit non-file database urls instead of rewriting them to sqlite", () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;

    try {
      process.env.DATABASE_URL = "postgresql://user:secret@example.com:5432/task3";

      expect(() => getTask3DatabaseRuntime()).toThrow(
        "Task 3 only supports SQLite file DATABASE_URL values.",
      );
      expect(() => createPrismaClient()).toThrow(
        "Task 3 only supports SQLite file DATABASE_URL values.",
      );
    } finally {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });
});
