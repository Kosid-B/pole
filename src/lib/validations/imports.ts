import { z } from "zod";

export const createImportJobSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required."),
  sourceType: z.enum(["SPREADSHEET", "PDF"]),
  uploadedByRole: z.enum(["EXECUTIVE", "ADMIN", "FIELD_LEADER"]),
});

export type CreateImportJobInput = z.infer<typeof createImportJobSchema>;
