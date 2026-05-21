import {
  getRoleFromEmail,
  getSafeRedirectTarget,
  getSafeSignOutRedirectTarget,
  getSwitchRoleHref,
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

describe("getRoleFromEmail", () => {
  it("derives a role from email hints for the mock session flow", () => {
    expect(getRoleFromEmail("field@example.com")).toBe("FIELD_LEADER");
    expect(getRoleFromEmail("exec@example.com")).toBe("EXECUTIVE");
    expect(getRoleFromEmail("ops@example.com")).toBe("ADMIN");
  });
});

describe("role switch helpers", () => {
  it("uses a dedicated sign-out handoff before showing the sign-in screen", () => {
    expect(getSwitchRoleHref()).toBe("/sign-out?redirectTo=%2Fsign-in");
  });

  it("keeps sign-out redirects inside the app", () => {
    expect(getSafeSignOutRedirectTarget("/sign-in")).toBe("/sign-in");
    expect(getSafeSignOutRedirectTarget("//evil.example")).toBe("/sign-in");
  });
});
