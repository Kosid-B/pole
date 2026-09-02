import { render, screen } from "@testing-library/react";
import { AuthoritativeProjectRegistry } from "@/components/projects/authoritative-project-registry";

const projects = [
  {
    id: "project-drying-yard",
    organization_id: "org-1",
    project_code: "DRYING-YARD-446",
    project_name: "งานลานตาก 446 จุด",
    project_type: "drying_yard",
    status: "active",
    enabled_modules: ["commercial", "pm", "procurement", "field", "finance"],
  },
  {
    id: "project-solar",
    organization_id: "org-1",
    project_code: "ELECTRIC-POLE-SOLAR",
    project_name: "งานเสาไฟฟ้า + Solar Energy",
    project_type: "energy_infrastructure",
    status: "active",
    enabled_modules: ["commercial", "pm", "procurement", "field", "finance"],
  },
];

describe("AuthoritativeProjectRegistry", () => {
  it("shows authorized projects, selected context, and module scope without a false switch control", () => {
    render(
      <AuthoritativeProjectRegistry
        projects={projects}
        selectedProjectId="project-drying-yard"
        authMode="supabase"
      />,
    );

    expect(screen.getByRole("heading", { name: "โครงการที่บัญชีนี้เข้าถึงได้" })).toBeInTheDocument();
    expect(screen.getByText("DRYING-YARD-446")).toBeInTheDocument();
    expect(screen.getByText("ELECTRIC-POLE-SOLAR")).toBeInTheDocument();
    expect(screen.getByText("โครงการปัจจุบัน")).toBeInTheDocument();
    expect(screen.getByText("ยังไม่เปิด switching")).toBeInTheDocument();
    expect(screen.getAllByText("Commercial")).toHaveLength(2);
    expect(screen.getAllByText("Finance")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /switch/i })).not.toBeInTheDocument();
  });

  it("does not invent fallback projects when membership scope is empty", () => {
    render(
      <AuthoritativeProjectRegistry
        projects={[]}
        selectedProjectId={null}
        authMode="supabase"
      />,
    );

    expect(
      screen.getByText(/ยังไม่มี Project membership ที่ใช้งานได้/),
    ).toBeInTheDocument();
  });
});
