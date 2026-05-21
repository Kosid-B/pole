"use server";

import { redirect } from "next/navigation";
import { db, createPrismaClient } from "@/lib/db";
import { createTeamSchema, type CreateTeamInput } from "@/lib/validations/team";
import { toTeamSummary } from "@/server/queries/teams";

function parseTeamFormData(formData: FormData): CreateTeamInput {
  return createTeamSchema.parse({
    projectId: formData.get("projectId"),
    teamTypeId: formData.get("teamTypeId"),
    name: formData.get("name"),
    leaderName: formData.get("leaderName"),
    crewSize: formData.get("crewSize"),
    specialization: formData.get("specialization"),
  });
}

export async function createTeam(
  input: unknown,
  databaseUrl?: string,
) {
  const data = createTeamSchema.parse(input);
  const prisma = databaseUrl ? createPrismaClient(databaseUrl) : db;

  try {
    const team = await prisma.team.create({
      data: {
        projectId: data.projectId,
        teamTypeId: data.teamTypeId,
        name: data.name,
        leaderName: data.leaderName,
        crewSize: data.crewSize,
        specialization: data.specialization,
      },
      include: {
        project: true,
        teamType: true,
      },
    });

    return toTeamSummary(team);
  } finally {
    if (databaseUrl) {
      await prisma.$disconnect();
    }
  }
}

export async function createTeamFromForm(formData: FormData) {
  const data = parseTeamFormData(formData);
  await createTeam(data);
  redirect("/teams");
}
