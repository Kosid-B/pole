import {
  canAccessRoute,
  getNavigationForRole,
} from "@/lib/permissions";

describe("drying-yard Commercial and PM permissions", () => {
  it("allows EXECUTIVE and ADMIN to access Commercial and PM", () => {
    for (const role of ["EXECUTIVE", "ADMIN"] as const) {
      expect(canAccessRoute(role, "/commercial")).toBe(true);
      expect(canAccessRoute(role, "/pm")).toBe(true);
      expect(canAccessRoute(role, "/commercial/pricing")).toBe(true);
      expect(canAccessRoute(role, "/pm/procurement")).toBe(true);
    }
  });

  it("keeps FIELD_LEADER out of Commercial and PM", () => {
    expect(canAccessRoute("FIELD_LEADER", "/commercial")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/pm")).toBe(false);
    expect(canAccessRoute("FIELD_LEADER", "/drying-yard")).toBe(true);
  });

  it("shows Commercial and PM navigation only to allowed roles", () => {
    const adminLinks = getNavigationForRole("ADMIN").map((item) => item.href);
    const fieldLinks = getNavigationForRole("FIELD_LEADER").map(
      (item) => item.href,
    );

    expect(adminLinks).toContain("/commercial");
    expect(adminLinks).toContain("/pm");
    expect(fieldLinks).not.toContain("/commercial");
    expect(fieldLinks).not.toContain("/pm");
  });
});
