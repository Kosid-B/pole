export type SiteCostProjectContext = {
  id: string;
  organization_id: string | null;
  project_code: string;
  project_name: string;
  project_type: string;
  status: string;
  enabled_modules: string[];
};

export type SiteCostProjectContextPayload = {
  ok: boolean;
  auth_mode: "legacy" | "supabase";
  actor_user_id: string | null;
  selected_project_id: string | null;
  projects: SiteCostProjectContext[];
};

export type ProjectContextLoadResult =
  | {
      configured: true;
      data: SiteCostProjectContextPayload;
      selectedProject: SiteCostProjectContext | null;
      error: null;
    }
  | {
      configured: false;
      data: null;
      selectedProject: null;
      error: string;
    }
  | {
      configured: true;
      data: null;
      selectedProject: null;
      error: string;
    };

export function selectCurrentProject(payload: SiteCostProjectContextPayload) {
  if (!payload.selected_project_id) return null;
  return payload.projects.find((project) => project.id === payload.selected_project_id) ?? null;
}

export function isVerifiedProjectSelection(
  result: ProjectContextLoadResult,
  requestedProjectId: string,
) {
  return Boolean(
    requestedProjectId &&
      result.configured &&
      result.data &&
      result.error === null &&
      result.data.selected_project_id === requestedProjectId &&
      result.selectedProject?.id === requestedProjectId &&
      result.data.projects.some((project) => project.id === requestedProjectId),
  );
}
