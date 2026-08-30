import type { PrismaClient, Project, Team, TeamType } from "@prisma/client";
import { db, createPrismaClient } from "@/lib/db";
import type { TeamSummary, TeamTypeSummary } from "@/types/domain";

type TeamWithProject = Team & {
  project: Project;
  teamType: TeamType | null;
};

function toTeamSummary(team: TeamWithProject): TeamSummary {
  return {
    id: team.id,
    projectId: team.projectId,
    projectName: team.project.name,
    teamTypeId: team.teamTypeId,
    teamType: team.teamType
      ? {
          id: team.teamType.id,
          code: team.teamType.code,
          nameTh: team.teamType.nameTh,
        }
      : null,
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
        teamType: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return teams.map(toTeamSummary);
  });
}

export async function listTeamTypes(databaseUrl?: string): Promise<TeamTypeSummary[]> {
  return withTeamDb(databaseUrl, async (client) => {
    const teamTypes = await client.teamType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return teamTypes.map((teamType) => ({
      id: teamType.id,
      code: teamType.code,
      nameTh: teamType.nameTh,
    }));
  });
}

export { toTeamSummary };
