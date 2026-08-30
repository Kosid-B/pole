import type {
  EquipmentMaster,
  FieldReport,
  FieldReportEquipment,
  FieldReportMaterial,
  PrismaClient,
  Project,
  ProjectArea,
  Team,
  UnitOfMeasure,
} from "@prisma/client";
import { db, createPrismaClient } from "@/lib/db";
import type {
  EquipmentMasterSummary,
  FieldReportSummary,
  UnitOfMeasureSummary,
} from "@/types/domain";

type FieldReportWithRelations = FieldReport & {
  project: Project;
  area: ProjectArea;
  team: Team;
  materials: Array<
    FieldReportMaterial & {
      unitRef: UnitOfMeasure | null;
    }
  >;
  equipment: Array<
    FieldReportEquipment & {
      unitRef: UnitOfMeasure | null;
      equipmentMaster: EquipmentMaster | null;
    }
  >;
};

export type FieldReportFormProject = {
  id: string;
  name: string;
  areas: Array<{
    id: string;
    name: string;
    province: string;
  }>;
  teams: Array<{
    id: string;
    name: string;
    leaderName: string;
  }>;
};

function toUnitSummary(unit: UnitOfMeasure): UnitOfMeasureSummary {
  return {
    id: unit.id,
    code: unit.code,
    nameTh: unit.nameTh,
    symbol: unit.symbol,
  };
}

function toEquipmentMasterSummary(
  equipment: EquipmentMaster,
): EquipmentMasterSummary {
  return {
    id: equipment.id,
    code: equipment.code,
    nameTh: equipment.nameTh,
    defaultUnitId: equipment.defaultUnitId,
  };
}

function toFieldReportSummary(report: FieldReportWithRelations): FieldReportSummary {
  return {
    id: report.id,
    projectId: report.projectId,
    projectName: report.project.name,
    areaId: report.areaId,
    areaName: report.area.name,
    teamId: report.teamId,
    teamName: report.team.name,
    reportDate: report.reportDate,
    completedUnits: report.completedUnits,
    manpowerCount: report.manpowerCount,
    issues: report.issues,
    materials: report.materials.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitId: item.unitId,
      unitRef: item.unitRef ? toUnitSummary(item.unitRef) : null,
    })),
    equipment: report.equipment.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitId: item.unitId,
      unitRef: item.unitRef ? toUnitSummary(item.unitRef) : null,
      equipmentMasterId: item.equipmentMasterId,
      equipmentMaster: item.equipmentMaster
        ? toEquipmentMasterSummary(item.equipmentMaster)
        : null,
    })),
  };
}

async function withFieldReportDb<T>(
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

export async function listFieldReports(databaseUrl?: string) {
  return withFieldReportDb(databaseUrl, async (client) => {
    const reports = await client.fieldReport.findMany({
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
      orderBy: [
        {
          reportDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return reports.map(toFieldReportSummary);
  });
}

export async function getFieldReportFormProjects(databaseUrl?: string) {
  return withFieldReportDb(databaseUrl, async (client) => {
    const projects = await client.project.findMany({
      include: {
        areas: {
          orderBy: {
            createdAt: "asc",
          },
        },
        teams: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects.map<FieldReportFormProject>((project) => ({
      id: project.id,
      name: project.name,
      areas: project.areas.map((area) => ({
        id: area.id,
        name: area.name,
        province: area.province,
      })),
      teams: project.teams.map((team) => ({
        id: team.id,
        name: team.name,
        leaderName: team.leaderName,
      })),
    }));
  });
}

export async function listFieldReportUnits(databaseUrl?: string) {
  return withFieldReportDb(databaseUrl, async (client) => {
    const units = await client.unitOfMeasure.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return units.map(toUnitSummary);
  });
}

export async function listFieldReportEquipmentMasters(databaseUrl?: string) {
  return withFieldReportDb(databaseUrl, async (client) => {
    const equipment = await client.equipmentMaster.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return equipment.map(toEquipmentMasterSummary);
  });
}

export { toFieldReportSummary };
