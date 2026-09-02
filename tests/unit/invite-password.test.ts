import { describe, expect, it } from "vitest";
import { validateInvitePassword } from "@/lib/invite-password";

describe("validateInvitePassword", () => {
  it("rejects passwords shorter than 12 characters", () => {
    expect(validateInvitePassword("short-pass", "short-pass")).toEqual({
      ok: false,
      error: "PASSWORD_TOO_SHORT",
    });
  });

  it("rejects mismatched confirmation", () => {
    expect(
      validateInvitePassword("long-enough-pass-1", "long-enough-pass-2"),
    ).toEqual({
      ok: false,
      error: "PASSWORD_MISMATCH",
    });
  });

  it("accepts a matching password with at least 12 characters", () => {
    expect(
      validateInvitePassword("long-enough-pass-1", "long-enough-pass-1"),
    ).toEqual({ ok: true, error: null });
  });
});
