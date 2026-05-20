import { PrismaClient } from "@prisma/client";
import { getTask3DatabaseRuntime } from "./task3-database-path";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL) {
  const resolvedDatabaseUrl = getTask3DatabaseRuntime({ databaseUrl }).databaseUrl;

  if (resolvedDatabaseUrl) {
    return new PrismaClient({
      datasources: {
        db: {
          url: resolvedDatabaseUrl,
        },
      },
    });
  }

  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
