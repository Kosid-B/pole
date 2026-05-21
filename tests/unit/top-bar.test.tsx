import { render, screen } from "@testing-library/react";
import { TopBar } from "@/components/layout/top-bar";

describe("TopBar", () => {
  it("shows the signed-in email and routes account changes through the session-clearing screen", () => {
    render(
      <TopBar
        session={{
          user: {
            id: "user_admin",
            email: "admin@example.com",
            name: "admin",
            role: "ADMIN",
          },
        }}
      />,
    );

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Change account",
      }),
    ).toHaveAttribute("href", "/sign-out?redirectTo=%2Fsign-in");
  });
});
