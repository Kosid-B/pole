import { render, screen } from "@testing-library/react";
import { TopBar } from "@/components/layout/top-bar";

const session = {
  user: {
    id: "user_admin",
    email: "admin@example.com",
    name: "admin",
    role: "ADMIN" as const,
  },
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

  it("shows the authorized current project when project context is available", () => {
    render(
      <TopBar
        session={session}
        projectCount={1}
        selectedProject={{
          id: "project_drying_yard",
          organization_id: "org_default",
          project_code: "DRYING-YARD-446",
          project_name: "งานลานตาก 446 จุด",
          project_type: "drying_yard",
          status: "active",
          enabled_modules: ["commercial", "pm", "procurement", "field", "finance"],
        }}
      />,
    );

    expect(screen.getByText("Project scoped")).toBeInTheDocument();
    expect(screen.getByText("งานลานตาก 446 จุด")).toBeInTheDocument();
    expect(screen.getByText(/DRYING-YARD-446/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ดูโครงการ งานลานตาก 446 จุด" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
