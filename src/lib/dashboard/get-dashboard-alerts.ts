import { listFieldReports } from "@/server/queries/field-reports";
import { listBillingRecords } from "@/server/queries/finance";
import { listImportJobs } from "@/server/queries/imports";

export type DashboardAlert = {
  id: string;
  severity: "high" | "medium" | "info";
  title: string;
  description: string;
};

export async function getDashboardAlerts(
  databaseUrl?: string,
): Promise<DashboardAlert[]> {
  const [fieldReports, billingRecords, importJobs] = await Promise.all([
    listFieldReports(databaseUrl),
    listBillingRecords(databaseUrl),
    listImportJobs(databaseUrl),
  ]);

  const issueAlerts = fieldReports
    .filter((report) => report.issues)
    .slice(0, 3)
    .map<DashboardAlert>((report) => ({
      id: `issue-${report.id}`,
      severity: "high",
      title: `${report.projectName} has a field blocker`,
      description: report.issues ?? "",
    }));

  const billingAlerts = billingRecords
    .filter((record) => !record.isDocumentComplete)
    .slice(0, 3)
    .map<DashboardAlert>((record) => ({
      id: `billing-${record.id}`,
      severity: "medium",
      title: `${record.projectName} billing packet is incomplete`,
      description: `${record.workPackage} is billed but still missing supporting documents.`,
    }));

  const importAlerts = importJobs
    .filter((job) => job.status === "NEEDS_REVIEW")
    .slice(0, 3)
    .map<DashboardAlert>((job) => ({
      id: `import-${job.id}`,
      severity: "info",
      title: `${job.fileName} is waiting for review`,
      description: `${job.sourceType} uploaded by ${job.uploadedByRole} is still in the import queue.`,
    }));

  return [...issueAlerts, ...billingAlerts, ...importAlerts];
}
