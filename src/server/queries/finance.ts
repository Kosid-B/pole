import type {
  BillingRecord,
  CostCategory,
  CostEntry,
  PrismaClient,
  Project,
} from "@prisma/client";
import { db, createPrismaClient } from "@/lib/db";
import type {
  BillingRecordSummary,
  CostCategorySummary,
  CostEntrySummary,
  ProjectSummary,
} from "@/types/domain";
import { getProjectSummaries } from "./projects";

type BillingRecordWithProject = BillingRecord & {
  project: Project;
};

type CostEntryWithProject = CostEntry & {
  project: Project;
  costCategory: CostCategory | null;
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
    costCategoryId: costEntry.costCategoryId,
    costCategory: costEntry.costCategory
      ? {
          id: costEntry.costCategory.id,
          code: costEntry.costCategory.code,
          nameTh: costEntry.costCategory.nameTh,
        }
      : null,
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
        costCategory: true,
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

export async function listCostCategories(
  databaseUrl?: string,
): Promise<CostCategorySummary[]> {
  return withFinanceDb(databaseUrl, async (client) => {
    const categories = await client.costCategory.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return categories.map((category) => ({
      id: category.id,
      code: category.code,
      nameTh: category.nameTh,
    }));
  });
}

export { toBillingRecordSummary, toCostEntrySummary };
