import { listFieldReports } from "@/server/queries/field-reports";
import { listBillingRecords, listCostEntries } from "@/server/queries/finance";
import { listImportJobs } from "@/server/queries/imports";
import { listProjects } from "@/server/queries/projects";
import { listTeams } from "@/server/queries/teams";

export type DashboardProjectHealth = {
  projectId: string;
  projectName: string;
  status: string;
  targetUnits: number;
  completedUnits: number;
  completionRate: number;
  billedValue: number;
  actualCostValue: number;
  estimatedCostValue: number;
  latestIssue: string | null;
  pendingImportCount: number;
};

export type DashboardSummary = {
  progress: {
    totalProjects: number;
    totalAreas: number;
    totalTeams: number;
    totalTargetUnits: number;
    completedUnits: number;
    completionRate: number;
  };
  finance: {
    totalContractValue: number;
    totalBilledValue: number;
    actualCostValue: number;
    estimatedCostValue: number;
    remainingContractValue: number;
  };
  projectHealth: DashboardProjectHealth[];
};

function calculateCompletionRate(completedUnits: number, totalTargetUnits: number) {
  if (totalTargetUnits === 0) {
    return 0;
  }

  return Number(((completedUnits / totalTargetUnits) * 100).toFixed(2));
}

export async function getDashboardSummary(
  databaseUrl?: string,
): Promise<DashboardSummary> {
  const [projects, teams, fieldReports, billingRecords, costEntries, importJobs] =
    await Promise.all([
      listProjects(databaseUrl),
      listTeams(databaseUrl),
      listFieldReports(databaseUrl),
      listBillingRecords(databaseUrl),
      listCostEntries(databaseUrl),
      listImportJobs(databaseUrl),
    ]);

  const totalTargetUnits = projects.reduce(
    (sum, project) => sum + project.targetUnits,
    0,
  );
  const completedUnits = fieldReports.reduce(
    (sum, report) => sum + report.completedUnits,
    0,
  );
  const totalContractValue = projects.reduce(
    (sum, project) => sum + project.contractValue,
    0,
  );
  const totalBilledValue = billingRecords.reduce(
    (sum, record) => sum + record.billedValue,
    0,
  );
  const actualCostValue = costEntries
    .filter((entry) => entry.valueType === "ACTUAL")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const estimatedCostValue = costEntries
    .filter((entry) => entry.valueType === "ESTIMATED")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const pendingImportCount = importJobs.filter(
    (job) => job.status === "NEEDS_REVIEW",
  ).length;

  const projectHealth = projects.map<DashboardProjectHealth>((project) => {
    const projectReports = fieldReports.filter(
      (report) => report.projectId === project.id,
    );
    const projectBilling = billingRecords.filter(
      (record) => record.projectId === project.id,
    );
    const projectCosts = costEntries.filter(
      (entry) => entry.projectId === project.id,
    );
    const latestIssueReport = projectReports.find((report) => report.issues);

    return {
      projectId: project.id,
      projectName: project.name,
      status: project.status,
      targetUnits: project.targetUnits,
      completedUnits: projectReports.reduce(
        (sum, report) => sum + report.completedUnits,
        0,
      ),
      completionRate: calculateCompletionRate(
        projectReports.reduce((sum, report) => sum + report.completedUnits, 0),
        project.targetUnits,
      ),
      billedValue: projectBilling.reduce(
        (sum, record) => sum + record.billedValue,
        0,
      ),
      actualCostValue: projectCosts
        .filter((entry) => entry.valueType === "ACTUAL")
        .reduce((sum, entry) => sum + entry.amount, 0),
      estimatedCostValue: projectCosts
        .filter((entry) => entry.valueType === "ESTIMATED")
        .reduce((sum, entry) => sum + entry.amount, 0),
      latestIssue: latestIssueReport?.issues ?? null,
      pendingImportCount,
    };
  });

  return {
    progress: {
      totalProjects: projects.length,
      totalAreas: projects.reduce((sum, project) => sum + project.areas.length, 0),
      totalTeams: teams.length,
      totalTargetUnits,
      completedUnits,
      completionRate: calculateCompletionRate(completedUnits, totalTargetUnits),
    },
    finance: {
      totalContractValue,
      totalBilledValue,
      actualCostValue,
      estimatedCostValue,
      remainingContractValue: totalContractValue - totalBilledValue,
    },
    projectHealth,
  };
}
