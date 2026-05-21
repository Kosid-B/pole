import { z } from "zod";

const materialLineItemSchema = z
  .object({
  name: z.string().trim().min(1, "Line item name is required."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .positive("Quantity must be greater than zero."),
    unitId: z.string().trim().optional(),
    unit: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.unitId || value.unit) {
      return;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["unitId"],
      message: "Unit is required.",
    });
  });

const equipmentLineItemSchema = z
  .object({
    equipmentMasterId: z.string().trim().optional(),
    name: z.string().trim().min(1, "Line item name is required."),
    quantity: z.coerce
      .number()
      .int("Quantity must be a whole number.")
      .positive("Quantity must be greater than zero."),
    unitId: z.string().trim().optional(),
    unit: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.unitId || value.unit) {
      return;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["unitId"],
      message: "Unit is required.",
    });
  });

export const createFieldReportSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required."),
  areaId: z.string().trim().min(1, "Area is required."),
  teamId: z.string().trim().min(1, "Team is required."),
  reportDate: z.coerce.date(),
  completedUnits: z.coerce
    .number()
    .int("Completed units must be a whole number.")
    .nonnegative("Completed units cannot be negative."),
  manpowerCount: z.coerce
    .number()
    .int("Manpower count must be a whole number.")
    .nonnegative("Manpower count cannot be negative."),
  issues: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  materials: z
    .array(materialLineItemSchema)
    .min(1, "At least one material line is required."),
  equipment: z
    .array(equipmentLineItemSchema)
    .min(1, "At least one equipment line is required."),
});

export type CreateFieldReportInput = z.infer<typeof createFieldReportSchema>;
