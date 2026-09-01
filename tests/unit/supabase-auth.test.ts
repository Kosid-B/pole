import {
  getConfiguredAuthProvider,
  mapSupabaseRole,
} from "@/lib/supabase-auth";

describe("SiteCost Supabase auth bridge", () => {
  const originalProvider = process.env.SITECOST_AUTH_PROVIDER;

  afterEach(() => {
    if (originalProvider === undefined) {
      delete process.env.SITECOST_AUTH_PROVIDER;
    } else {
      process.env.SITECOST_AUTH_PROVIDER = originalProvider;
    }
  });

  it("keeps legacy auth as the safe default during cutover", () => {
    delete process.env.SITECOST_AUTH_PROVIDER;
    expect(getConfiguredAuthProvider()).toBe("legacy");
  });

  it("uses Supabase only when explicitly enabled", () => {
    process.env.SITECOST_AUTH_PROVIDER = "supabase";
    expect(getConfiguredAuthProvider()).toBe("supabase");
  });

  it("maps organization leadership to executive access", () => {
    expect(mapSupabaseRole(null, ["owner"])).toBe("EXECUTIVE");
    expect(mapSupabaseRole(null, ["executive"])).toBe("EXECUTIVE");
  });

  it("maps management functions to admin workspace access", () => {
    expect(mapSupabaseRole(null, ["pm"])).toBe("ADMIN");
    expect(mapSupabaseRole(null, ["procurement"])).toBe("ADMIN");
    expect(mapSupabaseRole(null, ["finance"])).toBe("ADMIN");
  });

  it("keeps field leaders inside field-level access", () => {
    expect(mapSupabaseRole(null, ["field_leader"])).toBe("FIELD_LEADER");
  });

  it("does not grant application access to an unprovisioned user", () => {
    expect(mapSupabaseRole(null, [])).toBeNull();
    expect(mapSupabaseRole(null, ["viewer"])).toBeNull();
  });

  it("recognizes a platform admin profile without organization escalation", () => {
    expect(mapSupabaseRole("admin", [])).toBe("ADMIN");
  });
});
