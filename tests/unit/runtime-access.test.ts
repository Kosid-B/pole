import {
  canUseRouteInRuntime,
  getRuntimeDefaultDashboardRoute,
  isLegacyPrismaRoute,
} from "@/lib/runtime-access";

describe("Supabase runtime route policy", () => {
  it("identifies every legacy Prisma route prefix including nested routes", () => {
    expect(isLegacyPrismaRoute("/teams")).toBe(true);
    expect(isLegacyPrismaRoute("/field-reports/new")).toBe(true);
    expect(isLegacyPrismaRoute("/finance/costs")).toBe(true);
    expect(isLegacyPrismaRoute("/imports/review/123")).toBe(true);
    expect(isLegacyPrismaRoute("/pm/financial")).toBe(false);
    expect(isLegacyPrismaRoute("/field-readiness")).toBe(false);
  });

  it("keeps legacy runtime unchanged", () => {
    expect(canUseRouteInRuntime("legacy", "/finance")).toBe(true);
    expect(canUseRouteInRuntime("legacy", "/field-reports/new")).toBe(true);
  });

  it("fails closed for legacy data routes in Supabase mode", () => {
    expect(canUseRouteInRuntime("supabase", "/teams")).toBe(false);
    expect(canUseRouteInRuntime("supabase", "/field-reports/new")).toBe(false);
    expect(canUseRouteInRuntime("supabase", "/finance")).toBe(false);
    expect(canUseRouteInRuntime("supabase", "/imports")).toBe(false);
    expect(canUseRouteInRuntime("supabase", "/commercial")).toBe(true);
    expect(canUseRouteInRuntime("supabase", "/pm/financial")).toBe(true);
  });

  it("moves Supabase field leaders to a non-Prisma default route", () => {
    expect(getRuntimeDefaultDashboardRoute("FIELD_LEADER", "supabase")).toBe(
      "/field-readiness",
    );
    expect(getRuntimeDefaultDashboardRoute("FIELD_LEADER", "legacy")).toBe(
      "/field-reports",
    );
    expect(getRuntimeDefaultDashboardRoute("ADMIN", "supabase")).toBe("/");
  });
});
