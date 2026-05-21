import { tmpdir } from "node:os";
import { mkdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const DEFAULT_TASK3_DATABASE_DIRECTORY = resolve(
  tmpdir(),
  "project-management-saas-data",
);

const DEFAULT_TASK3_DATABASE_FILE = "dev.db";

type Task3DatabaseRuntimeOptions = {
  databaseUrl?: string;
  fileName?: string;
};

export function getTask3DatabaseDirectory() {
  return process.env.TASK3_DATABASE_DIRECTORY ?? DEFAULT_TASK3_DATABASE_DIRECTORY;
}

export function getTask3DatabaseFileName(fileName = process.env.TASK3_DATABASE_FILE) {
  return fileName || DEFAULT_TASK3_DATABASE_FILE;
}

export function getTask3DatabaseFilePath(fileName?: string) {
  return join(getTask3DatabaseDirectory(), getTask3DatabaseFileName(fileName));
}

export function getTask3DatabaseUrl(fileName?: string) {
  const normalizedPath = getTask3DatabaseFilePath(fileName).replace(/\\/g, "/");

  return `file:${normalizedPath}`;
}

export function getTask3CliDatabaseUrl(fileName?: string) {
  return `file:./${getTask3DatabaseFileName(fileName)}`;
}

export function ensureTask3DatabaseDirectory() {
  const directory = getTask3DatabaseDirectory();

  mkdirSync(directory, { recursive: true });

  return directory;
}

function getAbsoluteSqlitePath(sqlitePath: string) {
  if (/^[A-Za-z]:\//.test(sqlitePath)) {
    return sqlitePath.replace(/\//g, "\\");
  }

  if (/^\/[A-Za-z]:\//.test(sqlitePath)) {
    return sqlitePath.slice(1).replace(/\//g, "\\");
  }

  return null;
}

export function resolveTask3DatabaseUrl(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    return getTask3DatabaseUrl();
  }

  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Task 3 only supports SQLite file DATABASE_URL values.");
  }

  const sqlitePath = databaseUrl.slice("file:".length);
  const absoluteSqlitePath = getAbsoluteSqlitePath(sqlitePath);

  if (absoluteSqlitePath) {
    return `file:${absoluteSqlitePath.replace(/\\/g, "/")}`;
  }

  if (/^\/\//.test(sqlitePath)) {
    return databaseUrl;
  }

  return getTask3DatabaseUrl(basename(sqlitePath));
}

function resolveTask3DatabaseFilePath(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    if (!databaseUrl) {
      return getTask3DatabaseFilePath();
    }

    throw new Error("Task 3 only supports SQLite file DATABASE_URL values.");
  }

  const sqlitePath = databaseUrl.slice("file:".length);
  const absoluteSqlitePath = getAbsoluteSqlitePath(sqlitePath);

  if (absoluteSqlitePath) {
    return absoluteSqlitePath;
  }

  return getTask3DatabaseFilePath(basename(sqlitePath));
}

export function getTask3DatabaseRuntime(options: Task3DatabaseRuntimeOptions = {}) {
  const filePath = options.fileName
    ? getTask3DatabaseFilePath(options.fileName)
    : resolveTask3DatabaseFilePath(options.databaseUrl);
  const directory = dirname(filePath);
  const fileName = basename(filePath);
  const databaseUrl = `file:${filePath.replace(/\\/g, "/")}`;

  mkdirSync(directory, { recursive: true });

  return {
    databaseUrl,
    cliDatabaseUrl: getTask3CliDatabaseUrl(fileName),
    directory,
    filePath,
  };
}
