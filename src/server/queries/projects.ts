import type { Project, ProjectArea, PrismaClient } from "@prisma/client";
import { db, createPrismaClient } from "@/lib/db";
import type { ProjectSummary } from "@/types/domain";

type ProjectWithAreas = Project & {
  areas: ProjectArea[];
};

function toProjectSummary(project: ProjectWithAreas): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    customerName: project.customerName,
    contractValue: Number(project.contractValue),
    startDate: project.startDate,
    endDate: project.endDate,
    targetUnits: project.targetUnits,
    status: project.status,
    areas: project.areas.map((area) => ({
      id: area.id,
      name: area.name,
      province: area.province,
      district: area.district,
      cluster: area.cluster,
      targetUnits: area.targetUnits,
    })),
    teams: [],
  };
}

async function withProjectDb<T>(
  databaseUrl: string | undefined,
  callback: (client: PrismaClient) => Promise<T>,
) {
  if (!databaseUrl) {
    return callback(db);
  }

  const prisma = createPrismaClient(databaseUrl);

  try {
    return await callback(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

export async function listProjects(databaseUrl?: string) {
  return withProjectDb(databaseUrl, async (client) => {
    const projects = await client.project.findMany({
      include: {
        areas: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects.map(toProjectSummary);
  });
}

export async function getProjectSummaries(databaseUrl?: string) {
  return listProjects(databaseUrl);
}

export { toProjectSummary };
