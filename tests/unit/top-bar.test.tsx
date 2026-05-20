import { render, screen } from "@testing-library/react";
import { TopBar } from "@/components/layout/top-bar";

describe("TopBar", () => {
  it("routes switch role through the session-clearing screen", () => {
    render(
      <TopBar
        session={{
          user: {
            email: "admin@example.com",
            name: "admin",
            role: "ADMIN",
          },
        }}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "Switch role",
      }),
    ).toHaveAttribute("href", "/sign-out?redirectTo=%2Fsign-in");
  });
});
