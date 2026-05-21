import type { ImportJob, PrismaClient } from "@prisma/client";
import { db, createPrismaClient } from "@/lib/db";
import type { ImportJobSummary } from "@/types/domain";

function toImportJobSummary(importJob: ImportJob): ImportJobSummary {
  return {
    id: importJob.id,
    fileName: importJob.fileName,
    sourceType: importJob.sourceType,
    uploadedByRole: importJob.uploadedByRole,
    status: importJob.status,
    createdAt: importJob.createdAt,
  };
}

async function withImportsDb<T>(
  databaseUrl: string | undefined,
  callback: (client: PrismaClient) => Promise<T>,
) {
  if (!databaseUrl) {
    return callback(db);
  }

  const prisma = createPrismaClient(databaseUrl);

  try {
    return callback(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

export async function listImportJobs(databaseUrl?: string) {
  return withImportsDb(databaseUrl, async (client) => {
    const importJobs = await client.importJob.findMany({
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return importJobs.map(toImportJobSummary);
  });
}

export { toImportJobSummary };
