import { z } from "zod";

export const createBillingRecordSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required."),
  workPackage: z.string().trim().min(1, "Work package is required."),
  billedValue: z.coerce
    .number()
    .positive("Billed value must be greater than zero."),
  billingDate: z.coerce.date(),
  expectedPaymentDate: z.coerce.date(),
  isDocumentComplete: z.coerce.boolean(),
});

export const createCostEntrySchema = z.object({
  projectId: z.string().trim().min(1, "Project is required."),
  costCategoryId: z.string().trim().min(1, "Cost category is required."),
  description: z.string().trim().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  entryDate: z.coerce.date(),
  valueType: z.enum(["ESTIMATED", "ACTUAL"]),
});

export type CreateBillingRecordInput = z.infer<typeof createBillingRecordSchema>;
export type CreateCostEntryInput = z.infer<typeof createCostEntrySchema>;
