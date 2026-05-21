import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required."),
  contractValue: z.coerce.number().positive("Contract value must be greater than zero."),
  targetUnits: z.coerce.number().int().nonnegative("Target units cannot be negative."),
  initialArea: z.object({
    name: z.string().trim().min(1, "Initial area name is required."),
    province: z.string().trim().min(1, "Province is required."),
    targetUnits: z.coerce.number().int().nonnegative("Area target units cannot be negative."),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
