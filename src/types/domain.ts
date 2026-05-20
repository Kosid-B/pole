export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";

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
