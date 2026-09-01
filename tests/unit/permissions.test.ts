import { canAccessRoute, getDefaultDashboardRoute } from "@/lib/permissions";

describe("canAccessRoute", () => {
  it("allows field leaders into field workflows but blocks PM and finance", () => {
    expect(canAccessRoute("FIELD_LEADER", "/field-reports")).toBe(true);
    expect(canAccessRoute("FIELD_LEADER", "/field-readiness")).toBe(true);
    expect(canAccessRoute("FIELD_LEADER", "/field-readiness/site/LT-0001")).toBe(true);
    expect(canAccessRoute("FIELD_LEADER", "/field-deliveries")).toBe(true);
    expect(canAccessRoute("FIELD_LEADER", "/field-deliveries/calloff/1")).toBe(true);
    expect(canAccessRoute("FIELD_LEADER", "/")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/pm")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/pm/batches")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/pm/calloffs")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/pm/invoices")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/procurement")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/finance")).toBe(false);
  });

  it("allows nested routes when the role has access to the section", () => {
    expect(canAccessRoute("ADMIN", "/finance/invoices")).toBe(true);
    expect(canAccessRoute("ADMIN", "/field-readiness")).toBe(true);
    expect(canAccessRoute("ADMIN", "/field-deliveries")).toBe(true);
    expect(canAccessRoute("ADMIN", "/pm/calloffs")).toBe(true);
    expect(canAccessRoute("ADMIN", "/pm/payment-requests")).toBe(true);
    expect(canAccessRoute("FIELD_LEADER", "/pm/payment-requests")).toBe(false);
    expect(canAccessRoute("ADMIN", "/pm/invoices")).toBe(true);
    expect(canAccessRoute("EXECUTIVE", "/pm/invoices/review/123")).toBe(true);
  });

  it("returns a role-appropriate default dashboard route", () => {
    expect(getDefaultDashboardRoute("EXECUTIVE")).toBe("/");
    expect(getDefaultDashboardRoute("FIELD_LEADER")).toBe("/field-reports");
  });
});
