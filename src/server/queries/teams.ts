import type { PrismaClient, Project, Team } from "@prisma/client";
import { db, createPrismaClient } from "@/lib/db";
import type { TeamSummary } from "@/types/domain";

type TeamWithProject = Team & {
  project: Project;
};

function toTeamSummary(team: TeamWithProject): TeamSummary {
  return {
    id: team.id,
    projectId: team.projectId,
    projectName: team.project.name,
    name: team.name,
    leaderName: team.leaderName,
    crewSize: team.crewSize,
    specialization: team.specialization,
  };
}

async function withTeamDb<T>(
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

export async function listTeams(databaseUrl?: string) {
  return withTeamDb(databaseUrl, async (client) => {
    const teams = await client.team.findMany({
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return teams.map(toTeamSummary);
  });
}

export { toTeamSummary };
