import {
  getSafeRedirectTarget,
  getSafeSignOutRedirectTarget,
  getChangeAccountHref,
  verifyPasswordForUser,
} from "@/lib/auth";
import { getDefaultDashboardRoute } from "@/lib/permissions";

describe("getSafeRedirectTarget", () => {
  it("keeps allowed in-app dashboard paths", () => {
    expect(getSafeRedirectTarget("/finance", "ADMIN")).toBe("/finance");
    expect(getSafeRedirectTarget("/field-reports/daily", "FIELD_LEADER")).toBe(
      "/field-reports/daily",
    );
  });

  it("falls back for unsafe redirect targets", () => {
    expect(getSafeRedirectTarget("//evil.example", "ADMIN")).toBe(
      getDefaultDashboardRoute("ADMIN"),
    );
    expect(getSafeRedirectTarget("https://evil.example", "ADMIN")).toBe(
      getDefaultDashboardRoute("ADMIN"),
    );
    expect(getSafeRedirectTarget("/\\evil", "ADMIN")).toBe(
      getDefaultDashboardRoute("ADMIN"),
    );
  });

  it("falls back when a role asks for a route it cannot access", () => {
    expect(getSafeRedirectTarget("/finance", "FIELD_LEADER")).toBe(
      getDefaultDashboardRoute("FIELD_LEADER"),
    );
    expect(getSafeRedirectTarget("/", "FIELD_LEADER")).toBe(
      getDefaultDashboardRoute("FIELD_LEADER"),
    );
  });
});

describe("database auth", () => {
  it("accepts a seeded user with the correct password", async () => {
    const user = await verifyPasswordForUser("admin@example.com", "password");

    expect(user?.role).toBe("ADMIN");
    expect(user?.email).toBe("admin@example.com");
  });

  it("rejects an inactive user", async () => {
    const user = await verifyPasswordForUser("inactive@example.com", "password");

    expect(user).toBeNull();
  });
});

describe("account change helpers", () => {
  it("uses a dedicated sign-out handoff before showing the sign-in screen", () => {
    expect(getChangeAccountHref()).toBe("/sign-out?redirectTo=%2Fsign-in");
  });

  it("keeps sign-out redirects inside the app", () => {
    expect(getSafeSignOutRedirectTarget("/sign-in")).toBe("/sign-in");
    expect(getSafeSignOutRedirectTarget("//evil.example")).toBe("/sign-in");
  });
});
