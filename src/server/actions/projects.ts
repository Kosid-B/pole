"use server";

import { redirect } from "next/navigation";
import { db, createPrismaClient } from "@/lib/db";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/project";
import { toProjectSummary } from "@/server/queries/projects";

function parseProjectFormData(formData: FormData): CreateProjectInput {
  return createProjectSchema.parse({
    name: formData.get("name"),
    contractValue: formData.get("contractValue"),
    targetUnits: formData.get("targetUnits"),
    initialArea: {
      name: formData.get("initialArea.name"),
      province: formData.get("initialArea.province"),
      targetUnits: formData.get("initialArea.targetUnits"),
    },
  });
}

export async function createProject(
  input: unknown,
  databaseUrl?: string,
) {
  const data = createProjectSchema.parse(input);
  const prisma = databaseUrl ? createPrismaClient(databaseUrl) : db;

  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        contractValue: data.contractValue,
        targetUnits: data.targetUnits,
        areas: {
          create: [
            {
              name: data.initialArea.name,
              province: data.initialArea.province,
              targetUnits: data.initialArea.targetUnits,
            },
          ],
        },
      },
      include: {
        areas: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return toProjectSummary(project);
  } finally {
    if (databaseUrl) {
      await prisma.$disconnect();
    }
  }
}

export async function createProjectFromForm(formData: FormData) {
  const data = parseProjectFormData(formData);
  await createProject(data);
  redirect("/projects");
}
