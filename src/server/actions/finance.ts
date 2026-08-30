"use server";

import { redirect } from "next/navigation";
import { db, createPrismaClient } from "@/lib/db";
import {
  createBillingRecordSchema,
  createCostEntrySchema,
  type CreateBillingRecordInput,
  type CreateCostEntryInput,
} from "@/lib/validations/finance";
import {
  toBillingRecordSummary,
  toCostEntrySummary,
} from "@/server/queries/finance";

function parseBillingRecordFormData(formData: FormData): CreateBillingRecordInput {
  return createBillingRecordSchema.parse({
    projectId: formData.get("projectId"),
    workPackage: formData.get("workPackage"),
    billedValue: formData.get("billedValue"),
    billingDate: formData.get("billingDate"),
    expectedPaymentDate: formData.get("expectedPaymentDate"),
    isDocumentComplete: formData.get("isDocumentComplete") === "on",
  });
}

function parseCostEntryFormData(formData: FormData): CreateCostEntryInput {
  return createCostEntrySchema.parse({
    projectId: formData.get("projectId"),
    costCategoryId: formData.get("costCategoryId"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    entryDate: formData.get("entryDate"),
    valueType: formData.get("valueType"),
  });
}

export async function createBillingRecord(
  input: unknown,
  databaseUrl?: string,
) {
  const data = createBillingRecordSchema.parse(input);
  const prisma = databaseUrl ? createPrismaClient(databaseUrl) : db;

  try {
    const billingRecord = await prisma.billingRecord.create({
      data: {
        projectId: data.projectId,
        workPackage: data.workPackage,
        billedValue: data.billedValue,
        billingDate: data.billingDate,
        expectedPaymentDate: data.expectedPaymentDate,
        isDocumentComplete: data.isDocumentComplete,
      },
      include: {
        project: true,
      },
    });

    return toBillingRecordSummary(billingRecord);
  } finally {
    if (databaseUrl) {
      await prisma.$disconnect();
    }
  }
}

export async function createCostEntry(
  input: unknown,
  databaseUrl?: string,
) {
  const data = createCostEntrySchema.parse(input);
  const prisma = databaseUrl ? createPrismaClient(databaseUrl) : db;

  try {
    const category = await prisma.costCategory.findUniqueOrThrow({
      where: {
        id: data.costCategoryId,
      },
    });

    const costEntry = await prisma.costEntry.create({
      data: {
        projectId: data.projectId,
        costCategoryId: data.costCategoryId,
        category: category.nameTh,
        description: data.description,
        amount: data.amount,
        entryDate: data.entryDate,
        valueType: data.valueType,
      },
      include: {
        project: true,
        costCategory: true,
      },
    });

    return toCostEntrySummary(costEntry);
  } finally {
    if (databaseUrl) {
      await prisma.$disconnect();
    }
  }
}

export async function createBillingRecordFromForm(formData: FormData) {
  const data = parseBillingRecordFormData(formData);
  await createBillingRecord(data);
  redirect("/finance");
}

export async function createCostEntryFromForm(formData: FormData) {
  const data = parseCostEntryFormData(formData);
  await createCostEntry(data);
  redirect("/finance");
}
