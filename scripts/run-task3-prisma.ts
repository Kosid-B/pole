import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getTask3DatabaseRuntime } from "../src/lib/task3-database-path";
import { pushTask3Schema } from "../src/lib/task3-prisma-push";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const prismaArguments = process.argv.slice(2);

if (prismaArguments.length === 0) {
  console.error("Expected Prisma arguments, for example: db push");
  process.exit(1);
}

const runtime = getTask3DatabaseRuntime();
const prismaBin = resolve(projectRoot, "node_modules", ".bin", "prisma.cmd");
const normalizedArguments = [...prismaArguments];
const schemaFlagIndex = normalizedArguments.indexOf("--schema");

if (schemaFlagIndex >= 0 && normalizedArguments[schemaFlagIndex + 1]) {
  normalizedArguments[schemaFlagIndex + 1] = resolve(
    projectRoot,
    normalizedArguments[schemaFlagIndex + 1],
  );
}

const isDbPush =
  normalizedArguments[0] === "db" && normalizedArguments[1] === "push";

if (isDbPush) {
  const schemaPath =
    schemaFlagIndex >= 0 && normalizedArguments[schemaFlagIndex + 1]
      ? normalizedArguments[schemaFlagIndex + 1]
      : resolve(projectRoot, "prisma/schema.prisma");

  const result = pushTask3Schema({
    cliDatabaseUrl: runtime.cliDatabaseUrl,
    cwd: runtime.directory,
    filePath: runtime.filePath,
    prismaBin,
    schemaPath,
    skipGenerate: normalizedArguments.includes("--skip-generate"),
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  process.exit(result.status ?? 1);
}

const result = spawnSync("cmd.exe", ["/c", prismaBin, ...normalizedArguments], {
  cwd: runtime.directory,
  env: {
    ...process.env,
    DATABASE_URL: runtime.cliDatabaseUrl,
  },
  stdio: "inherit",
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
