import { z } from "zod";

export const createTeamSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required."),
  teamTypeId: z.string().trim().min(1, "Team type is required."),
  name: z.string().trim().min(1, "Team name is required."),
  leaderName: z.string().trim().min(1, "Leader name is required."),
  crewSize: z.coerce
    .number()
    .int("Crew size must be a whole number.")
    .positive("Crew size must be greater than zero."),
  specialization: z
    .string()
    .trim()
    .min(1, "Specialization is required."),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
