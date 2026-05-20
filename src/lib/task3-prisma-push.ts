import { spawnSync } from "node:child_process";

import { existsSync } from "node:fs";

type Task3PrismaPushOptions = {
  cliDatabaseUrl: string;
  cwd: string;
  filePath: string;
  prismaBin: string;
  schemaPath: string;
  skipGenerate?: boolean;
};

function runPrismaCommand(
  prismaBin: string,
  args: string[],
  cwd: string,
  databaseUrl: string,
  input?: string,
) {
  return spawnSync("cmd.exe", ["/c", prismaBin, ...args], {
    cwd,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    encoding: "utf-8",
    input,
  });
}

export function pushTask3Schema(options: Task3PrismaPushOptions) {
  const fromArguments = existsSync(options.filePath)
    ? ["--from-url", options.cliDatabaseUrl]
    : ["--from-empty"];

  const diffResult = runPrismaCommand(
    options.prismaBin,
    [
      "migrate",
      "diff",
      ...fromArguments,
      "--to-schema-datamodel",
      options.schemaPath,
      "--script",
    ],
    options.cwd,
    options.cliDatabaseUrl,
  );

  if (diffResult.status !== 0) {
    return diffResult;
  }

  const executeResult = runPrismaCommand(
    options.prismaBin,
    ["db", "execute", "--stdin", "--url", options.cliDatabaseUrl],
    options.cwd,
    options.cliDatabaseUrl,
    diffResult.stdout,
  );

  if (executeResult.status !== 0 || options.skipGenerate) {
    return executeResult;
  }

  return runPrismaCommand(
    options.prismaBin,
    ["generate", "--schema", options.schemaPath],
    options.cwd,
    options.cliDatabaseUrl,
  );
}
