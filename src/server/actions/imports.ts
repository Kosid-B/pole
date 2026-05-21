"use server";

import { redirect } from "next/navigation";
import { db, createPrismaClient } from "@/lib/db";
import {
  createImportJobSchema,
  type CreateImportJobInput,
} from "@/lib/validations/imports";
import { toImportJobSummary } from "@/server/queries/imports";

function parseImportJobFormData(formData: FormData): CreateImportJobInput {
  return createImportJobSchema.parse({
    fileName: formData.get("fileName"),
    sourceType: formData.get("sourceType"),
    uploadedByRole: formData.get("uploadedByRole"),
  });
}

export async function markImportForReview(
  input: unknown,
  databaseUrl?: string,
) {
  const data = createImportJobSchema.parse(input);
  const prisma = databaseUrl ? createPrismaClient(databaseUrl) : db;

  try {
    const importJob = await prisma.importJob.create({
      data: {
        fileName: data.fileName,
        sourceType: data.sourceType,
        uploadedByRole: data.uploadedByRole,
        status: "NEEDS_REVIEW",
      },
    });

    return toImportJobSummary(importJob);
  } finally {
    if (databaseUrl) {
      await prisma.$disconnect();
    }
  }
}

export async function markImportForReviewFromForm(formData: FormData) {
  const data = parseImportJobFormData(formData);
  await markImportForReview(data);
  redirect("/imports");
}
