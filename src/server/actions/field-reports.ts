"use server";

import { redirect } from "next/navigation";
import { db, createPrismaClient } from "@/lib/db";
import {
  createFieldReportSchema,
  type CreateFieldReportInput,
} from "@/lib/validations/field-report";
import { toFieldReportSummary } from "@/server/queries/field-reports";

function collectLineItems(formData: FormData, prefix: "materials" | "equipment") {
  const lineItems = new Map<number, Record<string, FormDataEntryValue | null>>();

  for (const [key, value] of formData.entries()) {
    const match = key.match(new RegExp(`^${prefix}\\.(\\d+)\\.(name|quantity|unit)$`));

    if (!match) {
      continue;
    }

    const index = Number(match[1]);
    const field = match[2];
    const existing = lineItems.get(index) ?? {};
    existing[field] = value;
    lineItems.set(index, existing);
  }

  return Array.from(lineItems.entries())
    .sort(([left], [right]) => left - right)
    .map(([, item]) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    }))
    .filter((item) => item.name || item.quantity || item.unit);
}

function parseFieldReportFormData(formData: FormData): CreateFieldReportInput {
  return createFieldReportSchema.parse({
    projectId: formData.get("projectId"),
    areaId: formData.get("areaId"),
    teamId: formData.get("teamId"),
    reportDate: formData.get("reportDate"),
    completedUnits: formData.get("completedUnits"),
    manpowerCount: formData.get("manpowerCount"),
    issues: formData.get("issues"),
    materials: collectLineItems(formData, "materials"),
    equipment: collectLineItems(formData, "equipment"),
  });
}

export async function createFieldReport(
  input: unknown,
  databaseUrl?: string,
) {
  const data = createFieldReportSchema.parse(input);
  const prisma = databaseUrl ? createPrismaClient(databaseUrl) : db;

  try {
    const [area, team] = await Promise.all([
      prisma.projectArea.findUnique({
        where: {
          id: data.areaId,
        },
        select: {
          projectId: true,
        },
      }),
      prisma.team.findUnique({
        where: {
          id: data.teamId,
        },
        select: {
          projectId: true,
        },
      }),
    ]);

    if (!area || area.projectId !== data.projectId) {
      throw new Error("Selected area does not belong to the chosen project.");
    }

    if (!team || team.projectId !== data.projectId) {
      throw new Error("Selected team does not belong to the chosen project.");
    }

    const report = await prisma.fieldReport.create({
      data: {
        projectId: data.projectId,
        areaId: data.areaId,
        teamId: data.teamId,
        reportDate: data.reportDate,
        completedUnits: data.completedUnits,
        manpowerCount: data.manpowerCount,
        issues: data.issues,
        materials: {
          create: data.materials.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
        equipment: {
          create: data.equipment.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
      },
      include: {
        project: true,
        area: true,
        team: true,
        materials: {
          orderBy: {
            createdAt: "asc",
          },
        },
        equipment: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return toFieldReportSummary(report);
  } finally {
    if (databaseUrl) {
      await prisma.$disconnect();
    }
  }
}

export async function createFieldReportFromForm(formData: FormData) {
  const data = parseFieldReportFormData(formData);
  await createFieldReport(data);
  redirect("/field-reports");
}
