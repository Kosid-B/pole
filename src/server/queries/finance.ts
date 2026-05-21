import type {
  BillingRecord,
  CostEntry,
  PrismaClient,
  Project,
} from "@prisma/client";
import { db, createPrismaClient } from "@/lib/db";
import type {
  BillingRecordSummary,
  CostEntrySummary,
  ProjectSummary,
} from "@/types/domain";
import { getProjectSummaries } from "./projects";

type BillingRecordWithProject = BillingRecord & {
  project: Project;
};

type CostEntryWithProject = CostEntry & {
  project: Project;
};

function toBillingRecordSummary(
  billingRecord: BillingRecordWithProject,
): BillingRecordSummary {
  return {
    id: billingRecord.id,
    projectId: billingRecord.projectId,
    projectName: billingRecord.project.name,
    workPackage: billingRecord.workPackage,
    billedValue: Number(billingRecord.billedValue),
    billingDate: billingRecord.billingDate,
    expectedPaymentDate: billingRecord.expectedPaymentDate,
    isDocumentComplete: billingRecord.isDocumentComplete,
  };
}

function toCostEntrySummary(costEntry: CostEntryWithProject): CostEntrySummary {
  return {
    id: costEntry.id,
    projectId: costEntry.projectId,
    projectName: costEntry.project.name,
    category: costEntry.category,
    description: costEntry.description,
    amount: Number(costEntry.amount),
    entryDate: costEntry.entryDate,
    valueType: costEntry.valueType,
  };
}

async function withFinanceDb<T>(
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

export async function listBillingRecords(databaseUrl?: string) {
  return withFinanceDb(databaseUrl, async (client) => {
    const billingRecords = await client.billingRecord.findMany({
      include: {
        project: true,
      },
      orderBy: [
        {
          billingDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return billingRecords.map(toBillingRecordSummary);
  });
}

export async function listCostEntries(databaseUrl?: string) {
  return withFinanceDb(databaseUrl, async (client) => {
    const costEntries = await client.costEntry.findMany({
      include: {
        project: true,
      },
      orderBy: [
        {
          entryDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return costEntries.map(toCostEntrySummary);
  });
}

export async function getFinanceProjects(databaseUrl?: string): Promise<ProjectSummary[]> {
  return getProjectSummaries(databaseUrl);
}

export { toBillingRecordSummary, toCostEntrySummary };
