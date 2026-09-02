import { describe, expect, it } from "vitest";
import { resolveSelectedModuleProject } from "@/lib/project-module-scope";

const projects = [
  {
    id: "project-a",
    project_code: "DRYING-YARD-446",
    project_name: "งานลานตาก 446 จุด",
    enabled_modules: ["commercial", "pm", "procurement", "field", "finance"],
  },
  {
    id: "project-b",
    project_code: "FIELD-ONLY",
    project_name: "Field-only project",
    enabled_modules: ["field"],
  },
];

describe("resolveSelectedModuleProject", () => {
  it("returns the selected project when the required module is enabled", () => {
    const result = resolveSelectedModuleProject(
      { selected_project_id: "project-a", projects },
      "procurement",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.id).toBe("project-a");
      expect(result.project.project_code).toBe("DRYING-YARD-446");
    }
  });

  it("rejects a missing selected project", () => {
    expect(
      resolveSelectedModuleProject({ selected_project_id: null, projects }, "commercial"),
    ).toMatchObject({ ok: false, error: "PROJECT_NOT_SELECTED" });
  });

  it("rejects a selected project that is not in the authorized project list", () => {
    expect(
      resolveSelectedModuleProject(
        { selected_project_id: "project-c", projects },
        "pm",
      ),
    ).toMatchObject({ ok: false, error: "PROJECT_NOT_AUTHORIZED" });
  });

  it("rejects access when the selected project does not enable the module", () => {
    expect(
      resolveSelectedModuleProject(
        { selected_project_id: "project-b", projects },
        "procurement",
      ),
    ).toMatchObject({ ok: false, error: "MODULE_ACCESS_DENIED" });
  });
});
