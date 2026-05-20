import { canAccessRoute, getDefaultDashboardRoute } from "@/lib/permissions";

describe("canAccessRoute", () => {
  it("allows field leaders into field reports but blocks finance", () => {
    expect(canAccessRoute("FIELD_LEADER", "/field-reports")).toBe(true);
    expect(canAccessRoute("FIELD_LEADER", "/finance")).toBe(false);
  });

  it("allows nested routes when the role has access to the section", () => {
    expect(canAccessRoute("ADMIN", "/finance/invoices")).toBe(true);
  });

  it("returns a role-appropriate default dashboard route", () => {
    expect(getDefaultDashboardRoute("EXECUTIVE")).toBe("/");
    expect(getDefaultDashboardRoute("FIELD_LEADER")).toBe("/field-reports");
  });
});
