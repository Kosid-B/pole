import {
  canAccessRoute,
  getNavigationForRole,
} from "@/lib/permissions";

describe("drying-yard Commercial, PM, and Procurement permissions", () => {
  it("allows EXECUTIVE and ADMIN to access Commercial, PM, and Procurement", () => {
    for (const role of ["EXECUTIVE", "ADMIN"] as const) {
      expect(canAccessRoute(role, "/commercial")).toBe(true);
      expect(canAccessRoute(role, "/pm")).toBe(true);
      expect(canAccessRoute(role, "/procurement")).toBe(true);
      expect(canAccessRoute(role, "/commercial/pricing")).toBe(true);
      expect(canAccessRoute(role, "/pm/cash-flow")).toBe(true);
      expect(canAccessRoute(role, "/procurement/clusters")).toBe(true);
    }
  });

  it("keeps FIELD_LEADER out of Commercial, PM, and Procurement", () => {
    expect(canAccessRoute("FIELD_LEADER", "/commercial")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/pm")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/procurement")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/drying-yard")).toBe(true);
  });

  it("shows internal financial modules only to allowed roles", () => {
    const adminLinks = getNavigationForRole("ADMIN").map((item) => item.href);
    const fieldLinks = getNavigationForRole("FIELD_LEADER").map(
      (item) => item.href,
    );

    expect(adminLinks).toContain("/commercial");
    expect(adminLinks).toContain("/pm");
    expect(adminLinks).toContain("/procurement");
    expect(fieldLinks).not.toContain("/commercial");
    expect(fieldLinks).not.toContain("/pm");
    expect(fieldLinks).not.toContain("/procurement");
  });
});
