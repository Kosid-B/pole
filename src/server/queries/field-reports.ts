import type {
  FieldReport,
  FieldReportEquipment,
  FieldReportMaterial,
  PrismaClient,
  Project,
  ProjectArea,
  Team,
} from "@prisma/client";
import { db, createPrismaClient } from "@/lib/db";
import type { FieldReportSummary } from "@/types/domain";

type FieldReportWithRelations = FieldReport & {
  project: Project;
  area: ProjectArea;
  team: Team;
  materials: FieldReportMaterial[];
  equipment: FieldReportEquipment[];
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
    })),
    equipment: report.equipment.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
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

export { toFieldReportSummary };
