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
    const match = key.match(
      new RegExp(
        `^${prefix}\\.(\\d+)\\.(equipmentMasterId|name|quantity|unit|unitId)$`,
      ),
    );

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
      equipmentMasterId: item.equipmentMasterId,
      name: item.name,
      quantity: item.quantity,
      unitId: item.unitId,
      unit: item.unit,
    }))
    .filter(
      (item) =>
        item.equipmentMasterId || item.name || item.quantity || item.unitId || item.unit,
    );
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
    const materialUnitIds = data.materials
      .map((item) => item.unitId?.trim())
      .filter((value): value is string => Boolean(value));
    const equipmentUnitIds = data.equipment
      .map((item) => item.unitId?.trim())
      .filter((value): value is string => Boolean(value));
    const equipmentMasterIds = data.equipment
      .map((item) => item.equipmentMasterId?.trim())
      .filter((value): value is string => Boolean(value));

    const [area, team, units, equipmentMasters] = await Promise.all([
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
      prisma.unitOfMeasure.findMany({
        where: {
          id: {
            in: Array.from(new Set([...materialUnitIds, ...equipmentUnitIds])),
          },
        },
      }),
      prisma.equipmentMaster.findMany({
        where: {
          id: {
            in: Array.from(new Set(equipmentMasterIds)),
          },
        },
      }),
    ]);

    if (!area || area.projectId !== data.projectId) {
      throw new Error("Selected area does not belong to the chosen project.");
    }

    if (!team || team.projectId !== data.projectId) {
      throw new Error("Selected team does not belong to the chosen project.");
    }

    const unitMap = new Map(units.map((unit) => [unit.id, unit]));
    const equipmentMasterMap = new Map(
      equipmentMasters.map((item) => [item.id, item]),
    );

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
          create: data.materials.map((item) => {
            const unit = item.unitId ? unitMap.get(item.unitId) : null;

            if (item.unitId && !unit) {
              throw new Error("Selected material unit is no longer available.");
            }

            return {
              name: item.name,
              quantity: item.quantity,
              unit: unit?.symbol ?? item.unit ?? "",
              unitId: unit?.id ?? null,
            };
          }),
        },
        equipment: {
          create: data.equipment.map((item) => {
            const unit = item.unitId ? unitMap.get(item.unitId) : null;
            const equipmentMaster = item.equipmentMasterId
              ? equipmentMasterMap.get(item.equipmentMasterId)
              : null;

            if (item.unitId && !unit) {
              throw new Error("Selected equipment unit is no longer available.");
            }

            if (item.equipmentMasterId && !equipmentMaster) {
              throw new Error("Selected equipment is no longer available.");
            }

            return {
              name: item.name,
              quantity: item.quantity,
              unit: unit?.symbol ?? item.unit ?? "",
              unitId: unit?.id ?? null,
              equipmentMasterId: equipmentMaster?.id ?? null,
            };
          }),
        },
      },
      include: {
        project: true,
        area: true,
        team: true,
        materials: {
          include: {
            unitRef: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        equipment: {
          include: {
            unitRef: true,
            equipmentMaster: true,
          },
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
