export type InvitePasswordValidation =
  | { ok: true; error: null }
  | {
      ok: false;
      error: "PASSWORD_TOO_SHORT" | "PASSWORD_MISMATCH";
    };

export function validateInvitePassword(
  password: string,
  confirmPassword: string,
): InvitePasswordValidation {
  if (password.length < 12) {
    return { ok: false, error: "PASSWORD_TOO_SHORT" };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "PASSWORD_MISMATCH" };
  }

  return { ok: true, error: null };
}
