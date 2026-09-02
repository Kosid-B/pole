export type SiteCostModuleCode = "commercial" | "pm" | "procurement";

export type ProjectModuleScopeProject = {
  id: string;
  project_code: string;
  project_name: string;
  enabled_modules: string[];
};

export type ProjectModuleScopePayload = {
  selected_project_id: string | null;
  projects: ProjectModuleScopeProject[];
};

export type ProjectModuleScopeResult =
  | {
      ok: true;
      project: ProjectModuleScopeProject;
      module: SiteCostModuleCode;
      error: null;
    }
  | {
      ok: false;
      project: null;
      module: SiteCostModuleCode;
      error: "PROJECT_NOT_SELECTED" | "PROJECT_NOT_AUTHORIZED" | "MODULE_ACCESS_DENIED";
    };

export function resolveSelectedModuleProject(
  payload: ProjectModuleScopePayload,
  module: SiteCostModuleCode,
): ProjectModuleScopeResult {
  const selectedProjectId = payload.selected_project_id?.trim();

  if (!selectedProjectId) {
    return {
      ok: false,
      project: null,
      module,
      error: "PROJECT_NOT_SELECTED",
    };
  }

  const project = payload.projects.find((candidate) => candidate.id === selectedProjectId);

  if (!project) {
    return {
      ok: false,
      project: null,
      module,
      error: "PROJECT_NOT_AUTHORIZED",
    };
  }

  if (!project.enabled_modules.includes(module)) {
    return {
      ok: false,
      project: null,
      module,
      error: "MODULE_ACCESS_DENIED",
    };
  }

  return {
    ok: true,
    project,
    module,
    error: null,
  };
}
