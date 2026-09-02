import { render, screen } from "@testing-library/react";
import { TopBar } from "@/components/layout/top-bar";
import type { SiteCostProjectContext } from "@/lib/project-context";

const session = {
  user: {
    id: "user_admin",
    email: "admin@example.com",
    name: "admin",
    role: "ADMIN" as const,
  },
};

const dryingYardProject: SiteCostProjectContext = {
  id: "project_drying_yard",
  organization_id: "org_default",
  project_code: "DRYING-YARD-446",
  project_name: "งานลานตาก 446 จุด",
  project_type: "drying_yard",
  status: "active",
  enabled_modules: ["commercial", "pm", "procurement", "field", "finance"],
};

const solarProject: SiteCostProjectContext = {
  id: "project_solar",
  organization_id: "org_default",
  project_code: "ELECTRIC-POLE-SOLAR",
  project_name: "งานเสาไฟฟ้า + Solar Energy",
  project_type: "electric_pole_solar",
  status: "active",
  enabled_modules: ["commercial", "pm", "procurement", "field", "finance"],
};

describe("TopBar", () => {
  it("shows the signed-in email and keeps project/account actions explicit", () => {
    render(<TopBar session={session} />);

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "เลือก / ดูโครงการ" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(
      screen.getByRole("link", {
        name: "เปลี่ยนบัญชี",
      }),
    ).toHaveAttribute("href", "/sign-out?redirectTo=%2Fsign-in");
  });

  it("shows the authorized current project without a selector when only one project is accessible", () => {
    render(
      <TopBar
        session={session}
        projectCount={1}
        projects={[dryingYardProject]}
        selectedProject={dryingYardProject}
      />,
    );

    expect(screen.getByText("Project scoped")).toBeInTheDocument();
    expect(screen.getByText("งานลานตาก 446 จุด")).toBeInTheDocument();
    expect(screen.getByText(/DRYING-YARD-446/)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "โครงการที่ต้องการใช้" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ดูโครงการ งานลานตาก 446 จุด" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("shows an explicit selector only when multiple authorized projects are available", () => {
    render(
      <TopBar
        session={session}
        selectedProject={dryingYardProject}
        projects={[dryingYardProject, solarProject]}
        projectCount={2}
      />,
    );

    const selector = screen.getByRole("combobox", { name: "โครงการที่ต้องการใช้" });
    expect(selector).toHaveValue("project_drying_yard");
    expect(screen.getByRole("option", { name: /งานลานตาก 446 จุด/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /งานเสาไฟฟ้า \+ Solar Energy/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เปลี่ยนโครงการ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ดูพอร์ต" })).toHaveAttribute("href", "/projects");
  });
});
