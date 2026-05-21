export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
export type FinanceValueType = "ESTIMATED" | "ACTUAL";

export interface ProjectAreaSummary {
  id: string;
  name: string;
  province: string;
  district: string | null;
  cluster: string | null;
  targetUnits: number;
}

export interface TeamSummary {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  leaderName: string;
  crewSize: number;
  specialization: string | null;
}

export interface FieldReportLineItemSummary {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface FieldReportSummary {
  id: string;
  projectId: string;
  projectName: string;
  areaId: string;
  areaName: string;
  teamId: string;
  teamName: string;
  reportDate: Date;
  completedUnits: number;
  manpowerCount: number;
  issues: string | null;
  materials: FieldReportLineItemSummary[];
  equipment: FieldReportLineItemSummary[];
}

export interface BillingRecordSummary {
  id: string;
  projectId: string;
  projectName: string;
  workPackage: string;
  billedValue: number;
  billingDate: Date;
  expectedPaymentDate: Date;
  isDocumentComplete: boolean;
}

export interface CostEntrySummary {
  id: string;
  projectId: string;
  projectName: string;
  category: string;
  description: string;
  amount: number;
  entryDate: Date;
  valueType: FinanceValueType;
}

export interface ProjectSummary {
  id: string;
  name: string;
  customerName: string | null;
  contractValue: number;
  startDate: Date | null;
  endDate: Date | null;
  targetUnits: number;
  status: ProjectStatus;
  areas: ProjectAreaSummary[];
  teams: TeamSummary[];
}
