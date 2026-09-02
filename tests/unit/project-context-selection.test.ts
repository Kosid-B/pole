import { describe, expect, it } from "vitest";
import {
  isVerifiedProjectSelection,
  type ProjectContextLoadResult,
  type SiteCostProjectContext,
} from "@/lib/project-context";

const dryingYard: SiteCostProjectContext = {
  id: "project-a",
  organization_id: "org-a",
  project_code: "DRYING-YARD-446",
  project_name: "งานลานตาก 446 จุด",
  project_type: "drying_yard",
  status: "active",
  enabled_modules: ["commercial", "pm", "procurement"],
};

const solar: SiteCostProjectContext = {
  id: "project-b",
  organization_id: "org-a",
  project_code: "ELECTRIC-POLE-SOLAR",
  project_name: "งานเสาไฟฟ้า + Solar Energy",
  project_type: "electric_pole_solar",
  status: "active",
  enabled_modules: ["commercial", "pm", "procurement"],
};

function success(selectedProject: SiteCostProjectContext): ProjectContextLoadResult {
  return {
    configured: true,
    data: {
      ok: true,
      auth_mode: "supabase",
      actor_user_id: "user-a",
      selected_project_id: selectedProject.id,
      projects: [dryingYard, solar],
    },
    selectedProject,
    error: null,
  };
}

describe("isVerifiedProjectSelection", () => {
  it("accepts only the project that the authoritative response selected", () => {
    expect(isVerifiedProjectSelection(success(solar), "project-b")).toBe(true);
    expect(isVerifiedProjectSelection(success(solar), "project-a")).toBe(false);
  });

  it("rejects a context error", () => {
    const failed: ProjectContextLoadResult = {
      configured: true,
      data: null,
      selectedProject: null,
      error: "PROJECT_ACCESS_DENIED",
    };

    expect(isVerifiedProjectSelection(failed, "project-b")).toBe(false);
  });

  it("rejects an empty project id", () => {
    expect(isVerifiedProjectSelection(success(dryingYard), "")).toBe(false);
  });
});
