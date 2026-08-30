export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
export type FinanceValueType = "ESTIMATED" | "ACTUAL";
export type ImportSourceType = "SPREADSHEET" | "PDF";
export type UploadedByRole = "EXECUTIVE" | "ADMIN" | "FIELD_LEADER";
export type ImportJobStatus = "NEEDS_REVIEW" | "APPROVED" | "REJECTED";

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  role: UploadedByRole;
  isActive: boolean;
}

export interface TeamTypeSummary {
  id: string;
  code: string;
  nameTh: string;
}

export interface CostCategorySummary {
  id: string;
  code: string;
  nameTh: string;
}

export interface UnitOfMeasureSummary {
  id: string;
  code: string;
  nameTh: string;
  symbol: string;
}

export interface EquipmentMasterSummary {
  id: string;
  code: string;
  nameTh: string;
  defaultUnitId: string;
}

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
  teamTypeId?: string | null;
  teamType?: TeamTypeSummary | null;
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
  unitId?: string | null;
  unitRef?: UnitOfMeasureSummary | null;
  equipmentMasterId?: string | null;
  equipmentMaster?: EquipmentMasterSummary | null;
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
  costCategoryId?: string | null;
  costCategory?: CostCategorySummary | null;
  description: string;
  amount: number;
  entryDate: Date;
  valueType: FinanceValueType;
}

export interface ImportJobSummary {
  id: string;
  fileName: string;
  sourceType: ImportSourceType;
  uploadedByRole: UploadedByRole;
  status: ImportJobStatus;
  createdAt: Date;
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
